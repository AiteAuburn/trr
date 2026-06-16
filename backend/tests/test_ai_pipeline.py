import json
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import UUID

import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import select

from app.core.config import get_settings
from app.core.metrics import http_metrics
from app.db.session import SessionLocal
from app.main import app
from app.models import RateLimitCounter, UsageCounter
from app.api.ai import (
    MAX_PROGRESS_STREAM_EVENT_CHARS,
    ai_rate_limit_exceeded_detail,
    stream_progress_with_success_voice_quota,
)
from app.services.ai_pipeline import (
    DEEPSEEK_LLM_MODEL_ID,
    COMPACT_IR_MAX_ITEMS_PER_RECORD,
    COMPACT_IR_MAX_RECORDS_PER_BATCH,
    COMPACT_IR_MAX_REJECTED_PER_BATCH,
    COMPACT_IR_MAX_SHORT_TEXT_CHARS,
    CompactParserIr,
    LOCAL_LLM_BATCH_MAX_TOKENS,
    LOCAL_LLM_BATCH_MIN_TOKENS,
    LOCAL_LLM_PROMPT_SEGMENT_CHAR_LIMIT,
    LOCAL_LLM_PROMPT_SEGMENTS_CHAR_BUDGET,
    LOCAL_LLM_MAX_TRANSCRIPT_SEGMENTS,
    LOCAL_LLM_MAX_TRANSCRIPT_NUMERIC_VALUES,
    LOCAL_LLM_HTTP_RESPONSE_CHAR_BUDGET,
    LOCAL_LLM_RESPONSE_CHAR_BUDGET,
    LOCAL_LLM_STREAM_LINE_CHAR_BUDGET,
    MAX_PARSE_PREVIEW_RECORDS,
    OLLAMA_MODEL_CACHE_TTL_SECONDS,
    OLLAMA_TAGS_HTTP_RESPONSE_CHAR_BUDGET,
    OLLAMA_TAGS_MAX_MODEL_IDS,
    LocalParserError,
    _bounded_prompt_segment_lines,
    _clear_ollama_model_cache_for_tests,
    _compact_ir_validation_error_message,
    _installed_ollama_model_ids,
    _json_decode_error_message,
    _local_llm_max_tokens_for_segments,
    _local_parser_prompt,
    _normalize_compact_ir_candidate,
    _request_ollama_structured_json,
    _request_local_parser_json,
    compact_ir_to_parse_preview,
    enforce_transcript_complexity_budget,
    parse_transcript_to_records,
    segment_transcript,
    _local_parser_system_prompt,
    storage_compatible_preview_records,
    stream_local_parser_debug,
    TranscriptTooComplexError,
    TranscriptTooDenseError,
    validate_local_parser_response_size,
)
from app.schemas.ai import CommandProposalRequest, ParsedRecordPreview, ParsePreviewRequest, TranscriptSegment
from app.schemas.ai import (
    AI_MODEL_DESCRIPTION_MAX_LENGTH,
    AI_MODEL_ID_MAX_LENGTH,
    AI_MODEL_OPTIONS_MAX_COUNT,
    COMMAND_ACTIONS_MAX_COUNT,
    COMMAND_PAYLOAD_MAX_KEYS,
    COMMAND_UI_MESSAGE_MAX_LENGTH,
    ActionProposal,
    AiModelOption,
    AiModelOptionsResponse,
    PARSE_PREVIEW_RECORDS_MAX_COUNT,
    PARSE_PREVIEW_SEGMENTS_MAX_COUNT,
    PARSE_PREVIEW_TEXT_MAX_LENGTH,
    PARSE_PREVIEW_TOP_LEVEL_JSON_MAX_KEYS,
    ParsePreviewResponse,
    ProposedAction,
    RejectedEvent,
    UiResponse,
)
from app.services.rate_limits import MAX_RATE_LIMIT_RETRY_AFTER_SECONDS, rate_limit_key_hash
from tests.helpers import create_account_and_profile

PARSER_CASES_DIR = Path(__file__).parent / "parser_cases"


def _count_type(records: list[dict[str, object]], record_type: str) -> int:
    return sum(1 for record in records if record["record_type"] == record_type)


def _glucose_record(records: list[dict[str, object]], value: int) -> dict[str, object]:
    for record in records:
        if record["record_type"] != "glucose":
            continue
        payload = record["payload_json"]
        assert isinstance(payload, dict)
        if payload.get("value") == float(value):
            return record
    raise AssertionError(f"missing glucose value {value}")


def _food_names(records: list[dict[str, object]]) -> set[str]:
    names: set[str] = set()
    for record in records:
        if record["record_type"] != "meal":
            continue
        payload = record["payload_json"]
        assert isinstance(payload, dict)
        food_items = payload.get("food_items")
        assert isinstance(food_items, list)
        for food_item in food_items:
            assert isinstance(food_item, dict)
            name = food_item.get("name")
            assert isinstance(name, str)
            names.add(name)
    return names


def _exercise_minutes(records: list[dict[str, object]]) -> set[int]:
    minutes: set[int] = set()
    for record in records:
        if record["record_type"] != "exercise":
            continue
        payload = record["payload_json"]
        assert isinstance(payload, dict)
        value = payload.get("minutes")
        assert isinstance(value, int)
        minutes.add(value)
    return minutes


def test_list_ai_models() -> None:
    client = TestClient(app)

    response = client.get("/ai/models")

    assert response.status_code == 200
    models = response.json()
    assert [model["id"] for model in models["stt_models"]] == [
        "browser-web-speech",
        "local-whisper-tiny-placeholder",
        "web-transformers-whisper-tiny",
    ]
    assert models["stt_models"][0]["available"] is True
    assert models["stt_models"][1]["available"] is True
    assert models["stt_models"][2]["available"] is True
    llm_model_ids = [model["id"] for model in models["llm_models"]]
    assert "local-llm-schema-stub" in llm_model_ids
    assert "ollama-qwen2.5-1.5b" in llm_model_ids
    assert "ollama-gemma3-1b" in llm_model_ids
    assert "ollama-llama3.2-1b" in llm_model_ids


def test_deepseek_system_prompt_can_be_customized(monkeypatch) -> None:
    custom_prompt = "中文測試：嚴格抽取，非 JSON 不要回傳。"
    custom_addendum = "若不確定直接拒絕，不做猜測。"
    monkeypatch.setenv("DEEPSEEK_SYSTEM_PROMPT", custom_prompt)
    monkeypatch.setenv("DEEPSEEK_ANALYSIS_ADDENDUM", custom_addendum)
    get_settings.cache_clear()

    prompt = _local_parser_system_prompt(llm_model_id=DEEPSEEK_LLM_MODEL_ID)
    assert custom_prompt in prompt
    assert custom_addendum in prompt


def test_ai_model_options_response_schema_bounds_metadata() -> None:
    valid_option = AiModelOption(
        id="local-llm-schema-stub",
        label="Local LLM Schema Stub",
        kind="llm",
        runtime="server_stub",
        available=True,
        description="Deterministic schema adapter.",
    )

    with pytest.raises(ValidationError):
        AiModelOption(
            id="x" * (AI_MODEL_ID_MAX_LENGTH + 1),
            label="Local LLM Schema Stub",
            kind="llm",
            runtime="server_stub",
            available=True,
            description="Deterministic schema adapter.",
        )

    with pytest.raises(ValidationError):
        AiModelOption(
            id="local-llm-schema-stub",
            label="Local LLM Schema Stub",
            kind="llm",
            runtime="server_stub",
            available=True,
            description="x" * (AI_MODEL_DESCRIPTION_MAX_LENGTH + 1),
        )

    with pytest.raises(ValidationError):
        AiModelOptionsResponse(
            stt_models=[],
            llm_models=[valid_option for _ in range(AI_MODEL_OPTIONS_MAX_COUNT + 1)],
        )


def test_ai_request_schemas_reject_blank_transcripts() -> None:
    common_payload = {
        "profile_id": UUID(int=1),
        "transcript": " \n\t ",
        "stt_model_id": "browser-web-speech",
        "llm_model_id": "local-llm-schema-stub",
        "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC),
        "voice_seconds": 12,
    }

    for schema in (ParsePreviewRequest, CommandProposalRequest):
        try:
            schema.model_validate(common_payload)
        except ValidationError as exc:
            assert "transcript must not be blank" in str(exc)
        else:
            raise AssertionError(f"{schema.__name__} should reject blank transcript")


def test_parse_preview_response_schema_bounds_output_shape() -> None:
    profile_id = UUID(int=1)
    occurred_at = datetime(2026, 4, 30, 8, 0, tzinfo=UTC)
    segment = TranscriptSegment(
        segment_id="seg_001",
        segment_type="measurement",
        source_text="血糖 120",
        normalized_text="血糖 120",
        confidence=0.9,
    )
    record = ParsedRecordPreview(
        profile_id=profile_id,
        record_type="glucose",
        occurred_at=occurred_at,
        payload_json={"value": 120, "unit": "mg/dL", "meal_timing": "unknown"},
        source="ai_parse_preview",
        confidence=0.9,
        decision_trace="bounded parse preview",
    )

    with pytest.raises(ValidationError):
        TranscriptSegment(
            segment_id="seg_001",
            segment_type="measurement",
            source_text="x" * (PARSE_PREVIEW_TEXT_MAX_LENGTH + 1),
            normalized_text="血糖 120",
            confidence=0.9,
        )

    with pytest.raises(ValidationError):
        ParsedRecordPreview(
            profile_id=profile_id,
            record_type="note",
            occurred_at=occurred_at,
            payload_json={
                f"key_{index}": index for index in range(PARSE_PREVIEW_TOP_LEVEL_JSON_MAX_KEYS + 1)
            },
            source="ai_parse_preview",
            confidence=0.9,
            decision_trace="bounded parse preview",
        )

    with pytest.raises(ValidationError):
        ParsePreviewResponse(
            transcript="",
            normalized_text="",
            stt_model_id="browser-web-speech",
            llm_model_id="local-llm-schema-stub",
            segments=[segment for _ in range(PARSE_PREVIEW_SEGMENTS_MAX_COUNT + 1)],
            records=[record],
        )

    with pytest.raises(ValidationError):
        ParsePreviewResponse(
            transcript="",
            normalized_text="",
            stt_model_id="browser-web-speech",
            llm_model_id="local-llm-schema-stub",
            segments=[segment],
            records=[record for _ in range(PARSE_PREVIEW_RECORDS_MAX_COUNT + 1)],
        )

    with pytest.raises(ValidationError):
        RejectedEvent(
            segment_id="seg_001",
            source_text="血糖 120",
            reason="invalid structured payload",
            time_hint="x" * (PARSE_PREVIEW_TEXT_MAX_LENGTH + 1),
        )


def test_parse_preview_rejects_blank_transcript_before_quota_work() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "ai-blank-transcript")

    response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": " \n\t ",
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "local-llm-schema-stub",
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
            "voice_seconds": 12,
        },
    )

    assert response.status_code == 422
    assert "transcript must not be blank" in response.text
    with SessionLocal() as db:
        counter = db.scalar(
            select(UsageCounter).where(
                UsageCounter.account_id == UUID(account_id),
            )
        )
    assert counter is None


def test_ai_rate_limit_detail_bounds_retry_after_seconds() -> None:
    assert ai_rate_limit_exceeded_detail(0)["retry_after_seconds"] == 1
    assert (
        ai_rate_limit_exceeded_detail(MAX_RATE_LIMIT_RETRY_AFTER_SECONDS + 1)[
            "retry_after_seconds"
        ]
        == MAX_RATE_LIMIT_RETRY_AFTER_SECONDS
    )


def test_ollama_model_ids_cache_uses_ttl_and_returns_copy(monkeypatch) -> None:
    _clear_ollama_model_cache_for_tests()
    calls: list[str] = []

    class FakeResponse:
        def __enter__(self) -> "FakeResponse":
            return self

        def __exit__(self, *args: object) -> bool:
            return False

        def raise_for_status(self) -> None:
            return None

        def iter_text(self) -> list[str]:
            return [json.dumps({"models": [{"name": "qwen2.5:1.5b"}]})]

    class FakeClient:
        def __init__(self, *, timeout: float) -> None:
            assert timeout == 1.0

        def __enter__(self) -> "FakeClient":
            return self

        def __exit__(self, *args: object) -> bool:
            return False

        def stream(self, method: str, url: str) -> FakeResponse:
            assert method == "GET"
            calls.append(url)
            return FakeResponse()

    monkeypatch.setattr("app.services.ai_pipeline.httpx.Client", FakeClient)

    first = _installed_ollama_model_ids("http://ollama:11434/api/chat", now=100.0)
    first.add("mutated-by-caller")
    second = _installed_ollama_model_ids("http://ollama:11434/api/chat", now=101.0)

    assert first == {"qwen2.5:1.5b", "mutated-by-caller"}
    assert second == {"qwen2.5:1.5b"}
    assert calls == ["http://ollama:11434/api/tags"]

    _clear_ollama_model_cache_for_tests()


def test_ollama_model_ids_cache_refreshes_after_ttl(monkeypatch) -> None:
    _clear_ollama_model_cache_for_tests()
    payloads = [
        {"models": [{"name": "qwen2.5:1.5b"}]},
        {"models": [{"name": "qwen2.5:1.5b"}, {"name": "gemma3:1b"}]},
    ]

    class FakeResponse:
        def __init__(self, payload: dict[str, object]) -> None:
            self.payload = payload

        def __enter__(self) -> "FakeResponse":
            return self

        def __exit__(self, *args: object) -> bool:
            return False

        def raise_for_status(self) -> None:
            return None

        def iter_text(self) -> list[str]:
            return [json.dumps(self.payload)]

    class FakeClient:
        def __init__(self, *, timeout: float) -> None:
            assert timeout == 1.0

        def __enter__(self) -> "FakeClient":
            return self

        def __exit__(self, *args: object) -> bool:
            return False

        def stream(self, method: str, url: str) -> FakeResponse:
            assert method == "GET"
            assert url == "http://ollama:11434/api/tags"
            return FakeResponse(payloads.pop(0))

    monkeypatch.setattr("app.services.ai_pipeline.httpx.Client", FakeClient)

    first = _installed_ollama_model_ids("http://ollama:11434/api/chat", now=100.0)
    second = _installed_ollama_model_ids(
        "http://ollama:11434/api/chat",
        now=100.0 + OLLAMA_MODEL_CACHE_TTL_SECONDS + 0.1,
    )

    assert first == {"qwen2.5:1.5b"}
    assert second == {"qwen2.5:1.5b", "gemma3:1b"}
    assert payloads == []

    _clear_ollama_model_cache_for_tests()


def test_ollama_model_ids_cache_falls_back_to_stale_on_fetch_error(monkeypatch) -> None:
    _clear_ollama_model_cache_for_tests()

    class FakeResponse:
        def __enter__(self) -> "FakeResponse":
            return self

        def __exit__(self, *args: object) -> bool:
            return False

        def raise_for_status(self) -> None:
            return None

        def iter_text(self) -> list[str]:
            return [json.dumps({"models": [{"name": "qwen2.5:1.5b"}]})]

    class SuccessfulClient:
        def __init__(self, *, timeout: float) -> None:
            assert timeout == 1.0

        def __enter__(self) -> "SuccessfulClient":
            return self

        def __exit__(self, *args: object) -> bool:
            return False

        def stream(self, method: str, url: str) -> FakeResponse:
            assert method == "GET"
            assert url == "http://ollama:11434/api/tags"
            return FakeResponse()

    class FailingClient:
        def __init__(self, *, timeout: float) -> None:
            assert timeout == 1.0

        def __enter__(self) -> "FailingClient":
            return self

        def __exit__(self, *args: object) -> bool:
            return False

        def stream(self, method: str, url: str) -> FakeResponse:
            assert method == "GET"
            assert url == "http://ollama:11434/api/tags"
            raise httpx.ConnectError("ollama unavailable")

    monkeypatch.setattr("app.services.ai_pipeline.httpx.Client", SuccessfulClient)
    assert _installed_ollama_model_ids("http://ollama:11434/api/chat", now=100.0) == {
        "qwen2.5:1.5b"
    }

    monkeypatch.setattr("app.services.ai_pipeline.httpx.Client", FailingClient)
    assert _installed_ollama_model_ids(
        "http://ollama:11434/api/chat",
        now=100.0 + OLLAMA_MODEL_CACHE_TTL_SECONDS + 0.1,
    ) == {"qwen2.5:1.5b"}

    _clear_ollama_model_cache_for_tests()


def test_ollama_model_ids_rejects_oversized_tags_response_before_json_parse(monkeypatch) -> None:
    _clear_ollama_model_cache_for_tests()
    oversized_response = '{"models":[' + ("x" * OLLAMA_TAGS_HTTP_RESPONSE_CHAR_BUDGET)

    class FakeResponse:
        def __enter__(self) -> "FakeResponse":
            return self

        def __exit__(self, *args: object) -> bool:
            return False

        def raise_for_status(self) -> None:
            return None

        def iter_text(self) -> list[str]:
            midway = len(oversized_response) // 2
            return [oversized_response[:midway], oversized_response[midway:]]

    class FakeClient:
        def __init__(self, *, timeout: float) -> None:
            assert timeout == 1.0

        def __enter__(self) -> "FakeClient":
            return self

        def __exit__(self, *args: object) -> bool:
            return False

        def stream(self, method: str, url: str) -> FakeResponse:
            assert method == "GET"
            assert url == "http://ollama:11434/api/tags"
            return FakeResponse()

    monkeypatch.setattr("app.services.ai_pipeline.httpx.Client", FakeClient)

    assert _installed_ollama_model_ids("http://ollama:11434/api/chat", now=100.0) == set()

    _clear_ollama_model_cache_for_tests()


def test_ollama_model_ids_bounds_model_id_values_and_count(monkeypatch) -> None:
    _clear_ollama_model_cache_for_tests()
    valid_models = [{"name": f"model-{index}"} for index in range(OLLAMA_TAGS_MAX_MODEL_IDS + 10)]
    payload = {
        "models": [
            {"name": " "},
            {"name": "x" * (AI_MODEL_ID_MAX_LENGTH + 1)},
            {"name": " qwen2.5:1.5b "},
            *valid_models,
        ]
    }

    class FakeResponse:
        def __enter__(self) -> "FakeResponse":
            return self

        def __exit__(self, *args: object) -> bool:
            return False

        def raise_for_status(self) -> None:
            return None

        def iter_text(self) -> list[str]:
            return [json.dumps(payload)]

    class FakeClient:
        def __init__(self, *, timeout: float) -> None:
            assert timeout == 1.0

        def __enter__(self) -> "FakeClient":
            return self

        def __exit__(self, *args: object) -> bool:
            return False

        def stream(self, method: str, url: str) -> FakeResponse:
            assert method == "GET"
            assert url == "http://ollama:11434/api/tags"
            return FakeResponse()

    monkeypatch.setattr("app.services.ai_pipeline.httpx.Client", FakeClient)

    model_ids = _installed_ollama_model_ids("http://ollama:11434/api/chat", now=100.0)

    assert len(model_ids) == OLLAMA_TAGS_MAX_MODEL_IDS
    assert "qwen2.5:1.5b" in model_ids
    assert " " not in model_ids
    assert "x" * (AI_MODEL_ID_MAX_LENGTH + 1) not in model_ids
    assert "model-126" in model_ids
    assert "model-127" not in model_ids

    _clear_ollama_model_cache_for_tests()


def test_parse_preview_returns_structured_records() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "ai")

    response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": "今天早上空腹血糖 138，早餐吃蛋餅，下午走路 30 分鐘",
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "local-llm-schema-stub",
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
        },
    )

    assert response.status_code == 200
    preview = response.json()
    assert preview["transcript"] == ""
    assert preview["normalized_text"] == ""
    assert preview["stt_model_id"] == "browser-web-speech"
    assert preview["llm_model_id"] == "local-llm-schema-stub"
    assert [segment["segment_type"] for segment in preview["segments"]] == [
        "measurement",
        "meal",
        "exercise",
    ]
    assert preview["rejected_events"] == []
    record_types = [record["record_type"] for record in preview["records"]]
    assert record_types == ["glucose", "meal", "exercise"]
    assert preview["records"][0]["payload_json"]["value"] == 138.0
    assert preview["records"][0]["occurred_at"] == "2026-04-30T08:00:00Z"
    assert preview["records"][0]["metadata_json"]["stt_model_id"] == "browser-web-speech"
    assert preview["records"][0]["decision_trace"]


def test_parse_preview_enforces_voice_quota_from_entitlements() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "voice-quota")
    payload = {
        "profile_id": profile_id,
        "transcript": "今天早上空腹血糖 138",
        "stt_model_id": "browser-web-speech",
        "llm_model_id": "local-llm-schema-stub",
        "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
    }

    allowed_response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={**payload, "voice_seconds": 300},
    )
    assert allowed_response.status_code == 200

    denied_response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={**payload, "voice_seconds": 1},
    )
    assert denied_response.status_code == 429
    assert denied_response.json()["detail"]["code"] == "voice_quota_exceeded"
    assert denied_response.json()["detail"]["remaining_seconds"] == 0


def test_parse_preview_rate_limit_blocks_before_quota_and_parser(monkeypatch) -> None:
    from app.api import ai as ai_api

    monkeypatch.setenv("AI_PARSE_RATE_LIMIT_COUNT", "1")
    monkeypatch.setenv("AI_PARSE_RATE_LIMIT_WINDOW_SECONDS", "60")
    get_settings.cache_clear()
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "ai-rate-limit")
    payload = {
        "profile_id": profile_id,
        "transcript": "今天早上空腹血糖 138",
        "stt_model_id": "browser-web-speech",
        "llm_model_id": "local-llm-schema-stub",
        "voice_seconds": 12,
    }

    first_response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json=payload,
    )
    assert first_response.status_code == 200

    def fail_if_parser_called(**_: object) -> None:
        raise AssertionError("parser should not run after AI rate limit is exceeded")

    monkeypatch.setattr(ai_api, "build_parse_preview", fail_if_parser_called)
    second_response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json=payload,
    )

    assert second_response.status_code == 429
    assert second_response.json()["detail"]["code"] == "rate_limit_exceeded"
    assert int(second_response.headers["Retry-After"]) >= 1
    assert account_id not in second_response.text
    with SessionLocal() as db:
        counter = db.scalar(
            select(RateLimitCounter).where(
                RateLimitCounter.scope == "ai_parse",
                RateLimitCounter.key_hash == rate_limit_key_hash(account_id),
            )
        )
    assert counter is not None
    assert counter.count == 1
    assert counter.key_hash == rate_limit_key_hash(account_id)
    assert account_id not in counter.key_hash

    quota_response = client.get(
        "/subscriptions/voice-quota",
        headers={"X-Account-Id": account_id},
    )
    assert quota_response.status_code == 200
    assert quota_response.json()["used_seconds_today"] == 12

    monkeypatch.delenv("AI_PARSE_RATE_LIMIT_COUNT")
    monkeypatch.delenv("AI_PARSE_RATE_LIMIT_WINDOW_SECONDS")
    get_settings.cache_clear()


def test_parse_preview_rejects_too_many_segments_before_quota_and_parser(monkeypatch) -> None:
    from app.api import ai as ai_api

    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "segment-budget")
    transcript = "。".join(
        f"第 {index} 筆空腹血糖 138" for index in range(LOCAL_LLM_MAX_TRANSCRIPT_SEGMENTS + 1)
    )

    def fail_if_parser_called(**_: object) -> None:
        raise AssertionError("parser should not run when transcript exceeds segment budget")

    monkeypatch.setattr(ai_api, "build_parse_preview", fail_if_parser_called)

    response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": transcript,
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "local-llm-schema-stub",
            "voice_seconds": 300,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "transcript_too_complex",
        "message": "Transcript has too many atomic events for one parse request.",
        "max_segments": LOCAL_LLM_MAX_TRANSCRIPT_SEGMENTS,
        "segment_count": LOCAL_LLM_MAX_TRANSCRIPT_SEGMENTS + 1,
    }

    quota_response = client.get(
        "/subscriptions/voice-quota",
        headers={"X-Account-Id": account_id},
    )
    assert quota_response.status_code == 200
    assert quota_response.json()["used_seconds_today"] == 0


def test_parse_preview_rejects_too_many_segments_before_runtime_model_lookup(
    monkeypatch,
) -> None:
    from app.services import ai_pipeline

    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "segment-budget-model-lookup")
    transcript = "。".join(
        f"第 {index} 筆空腹血糖 138" for index in range(LOCAL_LLM_MAX_TRANSCRIPT_SEGMENTS + 1)
    )

    def fail_if_model_lookup_runs(_: str) -> set[str]:
        raise AssertionError("model availability should not run before transcript budget rejection")

    monkeypatch.setattr(ai_pipeline, "_installed_ollama_model_ids", fail_if_model_lookup_runs)

    response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": transcript,
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "ollama-qwen2.5-1.5b",
            "voice_seconds": 300,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "transcript_too_complex"


def test_parse_preview_rejects_too_many_numeric_values_before_quota_and_parser(
    monkeypatch,
) -> None:
    from app.api import ai as ai_api
    from app.services import ai_pipeline

    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "numeric-budget")
    transcript = "今天血糖 " + " ".join(
        str(100 + (index % 80)) for index in range(LOCAL_LLM_MAX_TRANSCRIPT_NUMERIC_VALUES + 1)
    )

    def fail_if_model_lookup_runs(_: str) -> set[str]:
        raise AssertionError("model availability should not run before numeric budget rejection")

    def fail_if_profile_lookup_runs(*_: object, **__: object) -> object:
        raise AssertionError("profile lookup should not run before numeric budget rejection")

    def fail_if_parser_called(**_: object) -> None:
        raise AssertionError("parser should not run when transcript exceeds numeric budget")

    monkeypatch.setattr(ai_pipeline, "_installed_ollama_model_ids", fail_if_model_lookup_runs)
    monkeypatch.setattr(ai_api, "get_owned_profile", fail_if_profile_lookup_runs)
    monkeypatch.setattr(ai_api, "build_parse_preview", fail_if_parser_called)

    response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": transcript,
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "ollama-qwen2.5-1.5b",
            "voice_seconds": 300,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "transcript_too_dense",
        "message": "Transcript has too many numeric values for one parse request.",
        "max_numeric_values": LOCAL_LLM_MAX_TRANSCRIPT_NUMERIC_VALUES,
        "numeric_count": LOCAL_LLM_MAX_TRANSCRIPT_NUMERIC_VALUES + 1,
    }

    quota_response = client.get(
        "/subscriptions/voice-quota",
        headers={"X-Account-Id": account_id},
    )
    assert quota_response.status_code == 200
    assert quota_response.json()["used_seconds_today"] == 0


def test_parse_preview_rejects_invalid_stt_before_transcript_budget(
    monkeypatch,
) -> None:
    from app.api import ai as ai_api

    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "stt-before-budget")
    transcript = "。".join(
        f"第 {index} 筆空腹血糖 138" for index in range(LOCAL_LLM_MAX_TRANSCRIPT_SEGMENTS + 20)
    )

    def fail_if_budget_runs(_: str) -> None:
        raise AssertionError("transcript budget should not run before STT model rejection")

    def fail_if_profile_lookup_runs(*_: object, **__: object) -> object:
        raise AssertionError("profile lookup should not run before STT model rejection")

    monkeypatch.setattr(ai_api, "validate_parse_request_budget", fail_if_budget_runs)
    monkeypatch.setattr(ai_api, "get_owned_profile", fail_if_profile_lookup_runs)

    response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": transcript,
            "stt_model_id": "missing-stt-model",
            "llm_model_id": "local-llm-schema-stub",
            "voice_seconds": 300,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Selected STT model is not available"


def test_parse_preview_rejects_future_occurred_at_before_profile_and_parser(
    monkeypatch,
) -> None:
    from app.api import ai as ai_api

    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "future-occurred-at-ai")

    def fail_if_profile_lookup_runs(*_: object, **__: object) -> object:
        raise AssertionError("profile lookup should not run for future occurred_at")

    def fail_if_parser_runs(**_: object) -> None:
        raise AssertionError("parser should not run for future occurred_at")

    monkeypatch.setattr(ai_api, "get_owned_profile", fail_if_profile_lookup_runs)
    monkeypatch.setattr(ai_api, "build_parse_preview", fail_if_parser_runs)

    response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": "空腹血糖 138",
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "local-llm-schema-stub",
            "occurred_at": (datetime.now(UTC) + timedelta(days=1)).isoformat(),
            "voice_seconds": 300,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "invalid_record_time",
        "message": "occurred_at must not be in the future.",
    }


def test_parse_preview_rejects_too_many_segments_before_profile_lookup(
    monkeypatch,
) -> None:
    from app.api import ai as ai_api

    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "segment-budget-profile-lookup")
    transcript = "。".join(
        f"第 {index} 筆空腹血糖 138" for index in range(LOCAL_LLM_MAX_TRANSCRIPT_SEGMENTS + 1)
    )

    def fail_if_profile_lookup_runs(*_: object, **__: object) -> object:
        raise AssertionError("profile lookup should not run before transcript budget rejection")

    monkeypatch.setattr(ai_api, "get_owned_profile", fail_if_profile_lookup_runs)

    response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": transcript,
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "local-llm-schema-stub",
            "voice_seconds": 300,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "transcript_too_complex"


def test_transcript_complexity_budget_stops_counting_after_limit() -> None:
    transcript = "。".join(
        f"第 {index} 筆空腹血糖 138" for index in range(LOCAL_LLM_MAX_TRANSCRIPT_SEGMENTS + 20)
    )

    try:
        enforce_transcript_complexity_budget(transcript)
    except TranscriptTooComplexError as exc:
        assert exc.segment_count == LOCAL_LLM_MAX_TRANSCRIPT_SEGMENTS + 1
        assert exc.max_segments == LOCAL_LLM_MAX_TRANSCRIPT_SEGMENTS
    else:
        raise AssertionError("expected transcript complexity budget rejection")


def test_transcript_numeric_budget_stops_counting_after_limit() -> None:
    transcript = "血糖 " + " ".join(
        str(100 + (index % 80)) for index in range(LOCAL_LLM_MAX_TRANSCRIPT_NUMERIC_VALUES + 20)
    )

    try:
        enforce_transcript_complexity_budget(transcript)
    except TranscriptTooDenseError as exc:
        assert exc.numeric_count == LOCAL_LLM_MAX_TRANSCRIPT_NUMERIC_VALUES + 1
        assert exc.max_numeric_values == LOCAL_LLM_MAX_TRANSCRIPT_NUMERIC_VALUES
    else:
        raise AssertionError("expected transcript numeric budget rejection")


def test_compact_ir_maps_to_record_preview() -> None:
    _, profile_id = create_account_and_profile(TestClient(app), "compact-ir")
    parser_ir = CompactParserIr.model_validate(
        {
            "records": [
                {
                    "type": "glucose",
                    "value": 110,
                    "meal_timing": "unknown",
                    "time_hint": "am",
                    "confidence": 0.6,
                    "flags": ["approx"],
                    "evidence": "早上血糖大概一百一",
                },
                {
                    "type": "meal",
                    "items": ["三明治", "咖啡"],
                    "time_hint": "am",
                    "confidence": 0.9,
                    "evidence": "早餐吃三明治跟咖啡",
                },
                {
                    "type": "exercise",
                    "items": ["走路"],
                    "duration_min": 20,
                    "confidence": 0.9,
                    "evidence": "走路20分鐘",
                },
                {
                    "type": "medication",
                    "items": ["降血糖藥"],
                    "time_hint": "night",
                    "confidence": 0.9,
                    "evidence": "吃了一顆醫生開的降血糖藥",
                },
            ],
            "rejected": [{"type": "negative_event", "evidence": "中午沒量血糖"}],
            "needs_confirmation": True,
        }
    )

    preview = compact_ir_to_parse_preview(
        profile_id=UUID(profile_id),
        transcript="今天早上血糖大概一百一，早餐吃三明治跟咖啡，中午沒量血糖，走路20分鐘，吃了一顆醫生開的降血糖藥",
        normalized_text="今天早上血糖大概一百一，早餐吃三明治跟咖啡，中午沒量血糖，走路20分鐘，吃了一顆醫生開的降血糖藥",
        stt_model_id="browser-web-speech",
        llm_model_id="ollama-qwen2.5-1.5b",
        occurred_at=datetime(2026, 4, 30, 8, 0, tzinfo=UTC),
        parser_ir=parser_ir,
    )

    assert [record.record_type for record in preview.records] == [
        "glucose",
        "meal",
        "exercise",
        "medication",
    ]
    assert preview.records[0].payload_json["value"] == 110.0
    assert preview.records[0].payload_json["meal_timing"] == "unknown"
    assert preview.records[1].payload_json["food_items"] == [
        {"name": "三明治", "amount": "unknown"},
        {"name": "咖啡", "amount": "unknown"},
    ]
    assert preview.records[2].payload_json == {"activity": "走路", "minutes": 20}
    assert preview.records[3].payload_json == {"name": "降血糖藥", "taken": True}
    assert preview.rejected_events[0].source_text == "中午沒量血糖"


def test_storage_compatible_preview_records_sanitize_and_reject_invalid_payloads() -> None:
    _, profile_id = create_account_and_profile(TestClient(app), "preview-storage-gate")
    occurred_at = datetime(2026, 4, 30, 8, 0, tzinfo=UTC)
    records = [
        ParsedRecordPreview(
            profile_id=UUID(profile_id),
            record_type="meal",
            occurred_at=occurred_at,
            payload_json={
                "description": "free text",
                "food_items": [{"name": "蛋餅", "amount": "unknown"}],
            },
            metadata_json={"source_text": "meal source", "time_hint": "morning"},
            source="ai_parse_preview",
            confidence=0.8,
            decision_trace="test",
        ),
        ParsedRecordPreview(
            profile_id=UUID(profile_id),
            record_type="meal",
            occurred_at=occurred_at,
            payload_json={"description": "free text only"},
            metadata_json={"source_text": "invalid meal source"},
            source="ai_parse_preview",
            confidence=0.8,
            decision_trace="test",
        ),
    ]

    valid_records, rejected_events = storage_compatible_preview_records(records)

    assert len(valid_records) == 1
    assert valid_records[0].payload_json == {
        "food_items": [{"name": "蛋餅", "amount": "unknown"}]
    }
    assert len(rejected_events) == 1
    assert rejected_events[0].source_text == "invalid meal source"
    assert rejected_events[0].reason == "invalid structured payload"


def test_compact_ir_forces_confirmation_true() -> None:
    parser_ir = CompactParserIr.model_validate(
        {
            "records": [
                {
                    "type": "glucose",
                    "value": 112,
                    "time_hint": "am",
                    "confidence": 0.8,
                    "evidence": "量空腹血糖，結果是112",
                }
            ],
            "rejected": [],
            "needs_confirmation": False,
        }
    )

    assert parser_ir.needs_confirmation is True


def test_compact_ir_rejects_exercise_without_activity_item() -> None:
    try:
        CompactParserIr.model_validate(
            {
                "records": [
                    {
                        "type": "exercise",
                        "duration_min": 20,
                        "confidence": 0.8,
                        "evidence": "運動20分鐘",
                    }
                ],
                "rejected": [],
                "needs_confirmation": True,
            }
        )
    except ValidationError as exc:
        assert "exercise record requires activity item" in str(exc)
    else:
        raise AssertionError("expected exercise without activity item to fail")


def test_compact_ir_rejects_oversized_records_rejected_and_items() -> None:
    valid_record = {
        "type": "meal",
        "items": ["蛋餅"],
        "evidence": "早餐吃蛋餅",
    }
    cases = [
        {
            "records": [valid_record] * (COMPACT_IR_MAX_RECORDS_PER_BATCH + 1),
            "rejected": [],
            "needs_confirmation": True,
        },
        {
            "records": [],
            "rejected": [
                {"type": "negative_event", "evidence": "中午沒量血糖"}
            ]
            * (COMPACT_IR_MAX_REJECTED_PER_BATCH + 1),
            "needs_confirmation": True,
        },
        {
            "records": [
                {
                    "type": "meal",
                    "items": ["蛋餅"] * (COMPACT_IR_MAX_ITEMS_PER_RECORD + 1),
                    "evidence": "早餐吃蛋餅",
                }
            ],
            "rejected": [],
            "needs_confirmation": True,
        },
        {
            "records": [
                {
                    "type": "meal",
                    "items": ["x" * (COMPACT_IR_MAX_SHORT_TEXT_CHARS + 1)],
                    "evidence": "早餐吃蛋餅",
                }
            ],
            "rejected": [],
            "needs_confirmation": True,
        },
    ]

    for payload in cases:
        try:
            CompactParserIr.model_validate(payload)
        except ValidationError:
            continue
        raise AssertionError("oversized compact IR payload should fail validation")


def test_compact_ir_normalization_bounds_arrays_before_validation() -> None:
    transcript = "。".join(f"早餐吃蛋餅{i}" for i in range(COMPACT_IR_MAX_RECORDS_PER_BATCH + 5))
    parsed = {
        "records": [
            {
                "type": "meal",
                "items": [f"蛋餅{index}"],
                "evidence": f"早餐吃蛋餅{index}",
            }
            for index in range(COMPACT_IR_MAX_RECORDS_PER_BATCH + 5)
        ],
        "rejected": [
            {"type": "negative_event", "evidence": "中午沒量血糖"}
            for _ in range(COMPACT_IR_MAX_REJECTED_PER_BATCH + 5)
        ],
        "needs_confirmation": True,
    }

    normalized = _normalize_compact_ir_candidate(parsed, transcript)
    assert isinstance(normalized, dict)
    assert len(normalized["records"]) <= COMPACT_IR_MAX_RECORDS_PER_BATCH
    assert len(normalized["rejected"]) <= COMPACT_IR_MAX_REJECTED_PER_BATCH
    CompactParserIr.model_validate(normalized)


def test_compact_ir_adapter_repairs_qwen_schema_slips() -> None:
    transcript = (
        "今天早上6:30起床，先量空腹血糖，結果是112，覺得還可以但有點偏高。"
        "7:00喝了一杯黑咖啡沒有加糖，順便吃了一片全麥吐司加花生醬，"
        "大概7:30再量一次血糖是128。5:30去附近公園散步30分鐘，"
        "晚上8:00覺得嘴饞吃了一小塊蛋糕。"
    )
    parsed = {
        "records": [
            {"type": "glucose", "value": 112, "evidence": "先量空腹血糖，結果是112"},
            {"type": "note", "text": "覺得還可以但有點偏高"},
            {"type": "meal", "items": ["全麥吐司加花生醬"]},
            {"type": "glucose", "value": 128, "evidence": "量血糖是128"},
            {"type": "exercise", "duration_min": 30},
            {"type": "note", "text": "晚上8:00覺得嘴饞吃了一小塊蛋糕"},
        ],
        "rejected": [],
        "needs_confirmation": False,
    }

    normalized = _normalize_compact_ir_candidate(parsed, transcript)
    parser_ir = CompactParserIr.model_validate(normalized)

    assert parser_ir.needs_confirmation is True
    assert [record.type for record in parser_ir.records] == [
        "glucose",
        "meal",
        "glucose",
        "exercise",
        "meal",
    ]
    assert parser_ir.records[1].evidence == "順便吃了一片全麥吐司加花生醬"
    assert parser_ir.records[3].items == ["散步"]
    assert parser_ir.records[3].evidence == "5:30去附近公園散步30分鐘"
    assert parser_ir.records[4].items == ["一小塊蛋糕"]


def test_compact_ir_adapter_reassigns_wrong_or_missing_evidence() -> None:
    transcript = (
        "今天早上6:30起床，先量空腹血糖，結果是112。"
        "7:00喝了一杯黑咖啡沒有加糖，順便吃了一片全麥吐司加花生醬，"
        "大概7:30再量一次血糖是128。"
        "中午12:15吃午餐，吃了一碗白飯、滷雞腿、一份燙青菜和半碗味噌湯，"
        "飯後大概12:45量血糖是165。"
        "5:30去附近公園散步30分鐘。"
        "晚上6:45吃晚餐，吃了半碗飯、清蒸魚、一份炒高麗菜和一碗紫菜蛋花湯，"
        "7:30量血糖是155。8:00覺得嘴饞吃了一小塊蛋糕，8:45血糖升到182。"
    )
    parsed = {
        "records": [
            {"type": "glucose", "value": 112, "evidence": "今天早上6:30起床，先量空腹血糖，結果是112"},
            {"type": "meal", "items": ["全麥吐司加花生醬"], "evidence": "順便吃了一片全麥吐司加花生醬"},
            {"type": "glucose", "value": 128, "evidence": "7:00喝了一杯黑咖啡沒有加糖，順便吃了一片全麥吐司加花生醬"},
            {"type": "glucose", "evidence": "大概7:30再量一次血糖是128", "value": 128.0},
            {"type": "exercise", "duration_min": 30, "evidence": "5:30去附近公園散步30分鐘"},
            {"type": "glucose", "value": 165, "evidence": "中午12:15吃午餐，吃了一碗白飯、滷雞腿、一份燙青菜和半碗味噌湯，飯後大概12:45量血糖是165"},
            {"type": "meal", "items": ["半碗飯、滷雞腿、一份燙青菜和半碗味噌湯"]},
            {"type": "glucose", "value": 155, "evidence": "晚上6:45吃晚餐，吃了半碗飯、清蒸魚、一份炒高麗菜和一碗紫菜蛋花湯"},
            {"type": "meal", "evidence": "覺得嘴饞吃了一小塊蛋糕", "items": ["一小塊蛋糕"]},
            {"type": "glucose", "value": 182, "evidence": "晚上6:45吃晚餐，吃了半碗飯、清蒸魚、一份炒高麗菜和一碗紫菜蛋花湯"},
        ],
        "rejected": [],
        "needs_confirmation": True,
    }

    normalized = _normalize_compact_ir_candidate(parsed, transcript)
    parser_ir = CompactParserIr.model_validate(normalized)

    glucose_values = [record.value for record in parser_ir.records if record.type == "glucose"]
    assert glucose_values == [112.0, 128.0, 165.0, 155.0, 182.0]
    assert sum(1 for record in parser_ir.records if record.type == "meal") == 3
    assert any(
        record.type == "meal" and record.evidence == "吃了一碗白飯、滷雞腿、一份燙青菜和半碗味噌湯"
        for record in parser_ir.records
    )
    assert any(
        record.type == "glucose" and record.value == 182.0 and record.evidence == "8:45血糖升到182"
        for record in parser_ir.records
    )
    assert any(
        record.type == "exercise" and record.items == ["散步"] and record.duration_min == 30
        for record in parser_ir.records
    )


def test_compact_ir_adapter_maps_segment_ids_to_evidence() -> None:
    transcript = "先量空腹血糖，結果是112。早餐吃蛋餅。中午沒量血糖。"
    segments = segment_transcript(transcript)
    parsed = {
        "records": [
            {"type": "glucose", "segment_id": "seg_001", "value": 112},
            {"type": "meal", "segment_id": "seg_002", "items": ["蛋餅"]},
        ],
        "rejected": [{"type": "negative_event", "segment_id": "seg_003"}],
        "needs_confirmation": True,
    }

    normalized = _normalize_compact_ir_candidate(parsed, transcript, segments=segments)
    parser_ir = CompactParserIr.model_validate(normalized)

    assert parser_ir.records[0].evidence == "先量空腹血糖，結果是112"
    assert parser_ir.records[1].evidence == "早餐吃蛋餅"
    assert parser_ir.rejected[0].evidence == "中午沒量血糖"


def test_local_parser_prompt_bounds_segment_text_for_token_budget() -> None:
    long_food_note = "早餐吃" + "蛋餅" * 120
    transcript = f"今天早上空腹血糖112。{long_food_note}。下午走路30分鐘。"
    segments = segment_transcript(transcript)

    segment_lines = _bounded_prompt_segment_lines(segments)
    prompt = _local_parser_prompt(
        profile_id=UUID("00000000-0000-0000-0000-000000000001"),
        transcript=transcript,
        segments=segments,
        occurred_at=datetime(2026, 4, 30, 8, 0, tzinfo=UTC),
        stt_model_id="browser-web-speech",
        llm_model_id="ollama-qwen2.5-1.5b",
    )

    assert "seg_001" in segment_lines
    assert "seg_002" in segment_lines
    assert "…" in segment_lines
    assert "早餐吃蛋餅" in segment_lines
    prompt_source_chars = sum(
        len(line.split(": ", maxsplit=1)[1]) for line in segment_lines.splitlines()
    )
    assert prompt_source_chars <= LOCAL_LLM_PROMPT_SEGMENTS_CHAR_BUDGET
    assert long_food_note not in prompt
    for line in segment_lines.splitlines():
        source_text = line.split(": ", maxsplit=1)[1]
        assert len(source_text) <= LOCAL_LLM_PROMPT_SEGMENT_CHAR_LIMIT


def test_prompt_segment_truncation_preserves_head_and_tail_context() -> None:
    long_segment = "早餐吃蛋餅" + "，很多描述" * 40 + "飯後兩小時血糖168"
    truncated = _bounded_prompt_segment_lines(
        [
            TranscriptSegment(
                segment_id="seg_001",
                segment_type="meal",
                source_text=long_segment,
                normalized_text=long_segment,
                confidence=0.9,
            )
        ],
        per_segment_limit=40,
        total_char_budget=40,
    )

    source_text = truncated.split(": ", maxsplit=1)[1]
    assert len(source_text) <= 40
    assert source_text.startswith("早餐吃蛋餅")
    assert source_text.endswith("飯後兩小時血糖168")
    assert "…" in source_text
    assert long_segment not in truncated


def test_local_llm_output_token_budget_scales_with_segment_count() -> None:
    one_segment_budget = _local_llm_max_tokens_for_segments(
        segment_count=1,
        configured_max=4096,
    )
    full_batch_budget = _local_llm_max_tokens_for_segments(
        segment_count=10,
        configured_max=4096,
    )
    configured_cap_budget = _local_llm_max_tokens_for_segments(
        segment_count=10,
        configured_max=512,
    )

    assert one_segment_budget == LOCAL_LLM_BATCH_MIN_TOKENS
    assert one_segment_budget < full_batch_budget
    assert full_batch_budget == LOCAL_LLM_BATCH_MAX_TOKENS
    assert configured_cap_budget == 512


def test_local_parser_error_messages_omit_phi_content() -> None:
    phi_content = '模型輸出：{"records":[{"type":"glucose","evidence":"空腹血糖 188"}]}'
    json_error = _json_decode_error_message(
        content=phi_content,
        candidate='{"records":[{"type":"glucose","evidence":"空腹血糖 188"}]',
        exc=json.JSONDecodeError("Expecting ',' delimiter", phi_content, 12),
    )

    assert "空腹血糖" not in json_error
    assert "188" not in json_error
    assert "Content omitted for PHI safety" in json_error
    assert "Raw content length" in json_error

    try:
        CompactParserIr.model_validate(
            {
                "records": [{"type": "glucose", "evidence": "空腹血糖 188"}],
                "rejected": [],
                "needs_confirmation": True,
            }
        )
    except ValidationError as exc:
        schema_error = _compact_ir_validation_error_message(
            exc=exc,
            parsed={
                "records": [{"type": "glucose", "evidence": "空腹血糖 188"}],
                "rejected": [],
                "needs_confirmation": True,
            },
        )
    else:
        raise AssertionError("invalid compact IR should fail schema validation")

    assert "空腹血糖" not in schema_error
    assert "188" not in schema_error
    assert "Content omitted for PHI safety" in schema_error
    assert "Parsed content length" in schema_error


def test_local_parser_response_size_guard_omits_phi_content() -> None:
    oversized_content = "空腹血糖 188" + ("x" * LOCAL_LLM_RESPONSE_CHAR_BUDGET)

    try:
        validate_local_parser_response_size(oversized_content, parser_name="Local parser")
    except LocalParserError as exc:
        message = str(exc)
    else:
        raise AssertionError("oversized local parser content should fail before JSON parsing")

    assert "空腹血糖" not in message
    assert "188" not in message
    assert "exceeded safe size" in message
    assert "Content omitted for PHI safety" in message
    assert str(LOCAL_LLM_RESPONSE_CHAR_BUDGET) in message


def test_ollama_response_size_guard_runs_before_json_parsing(monkeypatch) -> None:
    oversized_content = "空腹血糖 188" + ("x" * LOCAL_LLM_RESPONSE_CHAR_BUDGET)
    response_text = json.dumps({"message": {"content": oversized_content}})

    class FakeResponse:
        def __enter__(self) -> "FakeResponse":
            return self

        def __exit__(self, *args: object) -> bool:
            return False

        def raise_for_status(self) -> None:
            return None

        def iter_text(self) -> list[str]:
            return [response_text]

    class FakeClient:
        def __init__(self, *, timeout: float) -> None:
            assert timeout == 1.0

        def __enter__(self) -> "FakeClient":
            return self

        def __exit__(self, *args: object) -> bool:
            return False

        def stream(self, method: str, url: str, json: dict[str, object]) -> FakeResponse:
            assert method == "POST"
            assert url == "http://ollama:11434/api/chat"
            assert json == {"model": "qwen2.5:1.5b"}
            return FakeResponse()

    monkeypatch.setattr("app.services.ai_pipeline.httpx.Client", FakeClient)

    try:
        _request_ollama_structured_json(
            parser_url="http://ollama:11434/api/chat",
            body={"model": "qwen2.5:1.5b"},
            timeout_seconds=1.0,
            batch_number=1,
        )
    except LocalParserError as exc:
        message = str(exc)
    else:
        raise AssertionError("oversized Ollama response should fail before JSON parsing")

    assert "空腹血糖" not in message
    assert "188" not in message
    assert "Ollama structured parser response exceeded safe size" in message
    assert "Content omitted for PHI safety" in message


def test_local_parser_http_response_size_guard_runs_before_json_parsing(monkeypatch) -> None:
    oversized_response = '{"choices":[{"message":{"content":"' + ("x" * LOCAL_LLM_HTTP_RESPONSE_CHAR_BUDGET)

    class FakeResponse:
        def __enter__(self) -> "FakeResponse":
            return self

        def __exit__(self, *args: object) -> bool:
            return False

        def raise_for_status(self) -> None:
            return None

        def iter_text(self) -> list[str]:
            midway = len(oversized_response) // 2
            return [oversized_response[:midway], oversized_response[midway:]]

    class FakeClient:
        def __init__(self, *, timeout: float) -> None:
            assert timeout == 1.0

        def __enter__(self) -> "FakeClient":
            return self

        def __exit__(self, *args: object) -> bool:
            return False

        def stream(self, method: str, url: str, json: dict[str, object]) -> FakeResponse:
            assert method == "POST"
            assert url == "http://parser.local/v1/chat/completions"
            assert json == {"model": "gemma"}
            return FakeResponse()

    monkeypatch.setattr("app.services.ai_pipeline.httpx.Client", FakeClient)

    try:
        _request_local_parser_json(
            parser_url="http://parser.local/v1/chat/completions",
            body={"model": "gemma"},
            timeout_seconds=1.0,
            batch_number=1,
        )
    except LocalParserError as exc:
        message = str(exc)
    else:
        raise AssertionError("oversized HTTP response should fail before JSON parsing")

    assert "HTTP response exceeded safe size" in message
    assert "Content omitted for PHI safety" in message
    assert str(LOCAL_LLM_HTTP_RESPONSE_CHAR_BUDGET) in message


def test_compact_ir_rejects_incomplete_typed_records() -> None:
    try:
        CompactParserIr.model_validate(
            {
                "records": [
                    {
                        "type": "glucose",
                        "time_hint": "am",
                        "evidence": "量血糖是112",
                    },
                    {
                        "type": "meal",
                        "time_hint": "am",
                        "evidence": "早餐喝黑咖啡",
                    },
                ],
                "rejected": [],
                "needs_confirmation": True,
            }
        )
    except ValidationError as exc:
        messages = [str(error["msg"]) for error in exc.errors()]
        assert any("glucose record requires value" in message for message in messages)
        assert any("meal record requires items" in message for message in messages)
    else:
        raise AssertionError("incomplete typed records should fail schema validation")


def test_parse_preview_uses_numbers_near_record_keywords() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "ai-mixed")

    response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": "今天早上空腹血糖 138，血壓 128 82，體重 72 公斤",
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "local-llm-schema-stub",
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
        },
    )

    assert response.status_code == 200
    records = response.json()["records"]
    vital = next(record for record in records if record["record_type"] == "vital")
    body_measurement = next(
        record for record in records if record["record_type"] == "body_measurement"
    )
    assert vital["payload_json"]["systolic"] == 128.0
    assert vital["payload_json"]["diastolic"] == 82.0
    assert body_measurement["payload_json"]["value"] == 72.0


def test_parse_preview_understands_common_chinese_glucose_numbers() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "ai-chinese-number")

    response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": "今天早上血糖大概一百一",
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "local-llm-schema-stub",
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
        },
    )

    assert response.status_code == 200
    records = response.json()["records"]
    assert records[0]["record_type"] == "glucose"
    assert records[0]["payload_json"]["value"] == 110.0
    assert records[0]["confidence"] < 0.7


def test_deterministic_parser_caps_preview_records() -> None:
    _, profile_id = create_account_and_profile(TestClient(app), "deterministic-record-cap")
    transcript = "。".join(
        f"第 {index} 筆空腹血糖 {100 + (index % 80)}"
        for index in range(MAX_PARSE_PREVIEW_RECORDS + 10)
    )

    records = parse_transcript_to_records(
        profile_id=UUID(profile_id),
        transcript=transcript,
        stt_model_id="browser-web-speech",
        llm_model_id="local-llm-schema-stub",
        occurred_at=datetime(2026, 4, 30, 8, 0, tzinfo=UTC),
    )

    assert len(records) == MAX_PARSE_PREVIEW_RECORDS


def test_deterministic_parser_caps_meal_food_items() -> None:
    _, profile_id = create_account_and_profile(TestClient(app), "deterministic-food-cap")
    food_names = [f"食物{index}" for index in range(COMPACT_IR_MAX_ITEMS_PER_RECORD + 8)]
    transcript = "早餐吃" + "、".join(food_names)

    records = parse_transcript_to_records(
        profile_id=UUID(profile_id),
        transcript=transcript,
        stt_model_id="browser-web-speech",
        llm_model_id="local-llm-schema-stub",
        occurred_at=datetime(2026, 4, 30, 8, 0, tzinfo=UTC),
    )

    meal_record = next(record for record in records if record.record_type == "meal")
    food_items = meal_record.payload_json["food_items"]
    assert isinstance(food_items, list)
    assert len(food_items) == COMPACT_IR_MAX_ITEMS_PER_RECORD


def test_parse_progress_stream_reports_atomic_events_and_contextual_glucose() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "ai-progress")

    response = client.post(
        "/ai/parse-preview/progress-stream",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": "晚上飯後血糖165，後來又量一次150，今天有走路20分鐘",
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "local-llm-schema-stub",
            "voice_seconds": 12,
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
        },
    )

    assert response.status_code == 200
    events = [json.loads(line) for line in response.text.splitlines() if line.strip()]
    segments_ready = next(event for event in events if event["event"] == "segments_ready")
    assert segments_ready == {"event": "segments_ready", "count": 3}
    assert [event["event"] for event in events if event["event"] == "segment_active"] == [
        "segment_active",
        "segment_active",
        "segment_active",
    ]
    final = events[-1]
    assert final["event"] == "final"
    assert final["preview"]["transcript"] == ""
    assert final["preview"]["normalized_text"] == ""
    records = final["preview"]["records"]
    _glucose_record(records, 165)
    _glucose_record(records, 150)
    assert _exercise_minutes(records) == {20}
    quota_response = client.get(
        "/subscriptions/voice-quota",
        headers={"X-Account-Id": account_id},
    )
    assert quota_response.status_code == 200
    assert quota_response.json()["used_seconds_today"] == 12


def test_parse_progress_stream_error_event_omits_phi_content(monkeypatch) -> None:
    from app.services import ai_pipeline

    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "ai-progress-error")

    def fail_parse_preview(**_: object) -> None:
        raise ai_pipeline.LocalParserError(
            'Local parser content was not valid JSON. Raw content: {"evidence":"空腹血糖 188"}'
        )

    monkeypatch.setattr(ai_pipeline, "build_parse_preview", fail_parse_preview)

    response = client.post(
        "/ai/parse-preview/progress-stream",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": "空腹血糖 188",
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "local-llm-schema-stub",
            "voice_seconds": 12,
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
        },
    )

    assert response.status_code == 200
    events = [json.loads(line) for line in response.text.splitlines() if line.strip()]
    error_event = events[-1]
    assert error_event["event"] == "error"
    assert error_event["code"] == "local_parser_failed"
    assert error_event["hint"] == "retry_or_switch_model"
    assert "空腹血糖" not in error_event["message"]
    assert "188" not in error_event["message"]
    assert "Raw content" not in response.text
    quota_response = client.get(
        "/subscriptions/voice-quota",
        headers={"X-Account-Id": account_id},
    )
    assert quota_response.status_code == 200
    assert quota_response.json()["used_seconds_today"] == 0


def test_parse_progress_stream_replaces_final_with_quota_error_when_over_limit() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "ai-progress-quota")

    response = client.post(
        "/ai/parse-preview/progress-stream",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": "空腹血糖 138",
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "local-llm-schema-stub",
            "voice_seconds": 301,
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
        },
    )

    assert response.status_code == 429
    assert response.json()["detail"]["code"] == "voice_quota_exceeded"
    assert response.json()["detail"]["requested_seconds"] == 301
    assert "空腹血糖" not in response.text
    assert "138" not in response.text
    quota_response = client.get(
        "/subscriptions/voice-quota",
        headers={"X-Account-Id": account_id},
    )
    assert quota_response.status_code == 200
    assert quota_response.json()["used_seconds_today"] == 0


def test_progress_stream_quota_wrapper_rejects_oversized_event_without_json_parse() -> None:
    oversized_phi_line = (
        '{"event":"progress","message":"'
        + ("空腹血糖 188 " * ((MAX_PROGRESS_STREAM_EVENT_CHARS // 8) + 1))
        + '"}\n'
    )

    events = list(
        stream_progress_with_success_voice_quota(
            source=iter([oversized_phi_line]),
            account_id=UUID(int=1),
            voice_seconds=0,
        )
    )

    assert len(events) == 1
    error_event = json.loads(events[0])
    assert error_event == {
        "event": "error",
        "code": "progress_event_too_large",
        "message": "Parser progress event exceeded safe size.",
        "hint": "retry_with_shorter_input",
    }
    assert "空腹血糖" not in events[0]
    assert "188" not in events[0]


def test_parse_debug_stream_is_disabled_by_default() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "ai-debug-disabled")

    response = client.post(
        "/ai/parse-preview/debug-stream",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": "空腹血糖 138",
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "local-llm-schema-stub",
        },
    )

    assert response.status_code == 404


def test_local_parser_debug_stream_omits_raw_http_errors(monkeypatch) -> None:
    class FailingClient:
        def __init__(self, *, timeout: object) -> None:
            _ = timeout

        def __enter__(self) -> "FailingClient":
            return self

        def __exit__(self, *args: object) -> bool:
            return False

        def stream(self, method: str, url: str, json: object) -> object:
            _ = (method, json)
            raise httpx.ConnectError(f"could not connect to {url}/空腹血糖/188?token=secret")

    monkeypatch.setattr("app.services.ai_pipeline.httpx.Client", FailingClient)

    output = "".join(
        stream_local_parser_debug(
            profile_id=UUID("00000000-0000-0000-0000-000000000001"),
            transcript="空腹血糖 188",
            stt_model_id="browser-web-speech",
            llm_model_id="ollama-qwen2.5-1.5b",
            occurred_at=datetime(2026, 4, 30, 8, 0, tzinfo=UTC),
        )
    )

    assert output == "\n[local parser stream error: local parser request failed]\n"
    assert "空腹血糖" not in output
    assert "188" not in output
    assert "secret" not in output
    assert "ollama" not in output


def test_local_parser_debug_stream_rejects_oversized_line_before_json_parse(monkeypatch) -> None:
    oversized_line = (
        '{"message":{"content":"'
        + ("空腹血糖 188 " * ((LOCAL_LLM_STREAM_LINE_CHAR_BUDGET // 8) + 1))
        + '"}}'
    )

    class FakeResponse:
        def __enter__(self) -> "FakeResponse":
            return self

        def __exit__(self, *args: object) -> bool:
            return False

        def raise_for_status(self) -> None:
            return None

        def iter_lines(self) -> Iterator[str]:
            yield oversized_line

    class FakeClient:
        def __init__(self, *, timeout: object) -> None:
            _ = timeout

        def __enter__(self) -> "FakeClient":
            return self

        def __exit__(self, *args: object) -> bool:
            return False

        def stream(self, method: str, url: str, json: object) -> FakeResponse:
            _ = (method, url, json)
            return FakeResponse()

    monkeypatch.setattr("app.services.ai_pipeline.httpx.Client", FakeClient)

    output = "".join(
        stream_local_parser_debug(
            profile_id=UUID("00000000-0000-0000-0000-000000000001"),
            transcript="空腹血糖 188",
            stt_model_id="browser-web-speech",
            llm_model_id="ollama-qwen2.5-1.5b",
            occurred_at=datetime(2026, 4, 30, 8, 0, tzinfo=UTC),
        )
    )

    assert output == "\n[local parser stream error: stream line exceeded safe size]\n"
    assert "空腹血糖" not in output
    assert "188" not in output


def test_parser_golden_complex_mixed_day() -> None:
    case = json.loads((PARSER_CASES_DIR / "complex_mixed_day_001.json").read_text())
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "ai-golden")

    response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": case["input"],
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "local-llm-schema-stub",
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
        },
    )

    assert response.status_code == 200
    preview = response.json()
    records = preview["records"]
    segments = preview["segments"]
    rejected_events = preview["rejected_events"]
    expected = case["expected"]

    assert isinstance(records, list)
    assert len(records) == expected["total"]
    assert isinstance(segments, list)
    assert len(segments) >= expected["total"]
    assert [event["source_text"] for event in rejected_events] == [
        "中午沒量血糖",
        "睡前沒再量",
    ]
    assert "早上量血糖好像是 110 左右，忘記是不是空腹" in [
        segment["source_text"] for segment in segments
    ]
    assert "今天有運動一下，大概 20 分鐘" in [
        segment["source_text"] for segment in segments
    ]
    assert "忘記是不是空腹" not in [segment["source_text"] for segment in segments]
    assert "大概 20 分鐘" not in [segment["source_text"] for segment in segments]

    for record in records:
        assert record["record_type"]
        assert record["source"]
        assert isinstance(record["confidence"], float)
        assert record["metadata_json"]["source_text"]

    for segment in segments:
        assert segment["segment_id"]
        assert segment["segment_type"]
        assert segment["source_text"]
        assert segment["normalized_text"]
        assert isinstance(segment["confidence"], float)

    for record_type, count in expected["counts"].items():
        assert _count_type(records, record_type) == count

    for value in expected["must_include"]["glucose_values"]:
        _glucose_record(records, value)

    assert set(expected["must_include"]["foods"]).issubset(_food_names(records))
    assert set(expected["must_include"]["exercise_minutes"]).issubset(_exercise_minutes(records))

    uncertain_glucose = _glucose_record(records, 110)
    uncertain_payload = uncertain_glucose["payload_json"]
    assert isinstance(uncertain_payload, dict)
    assert uncertain_payload["meal_timing"] == "unknown"
    confidence = uncertain_glucose["confidence"]
    assert isinstance(confidence, float)
    assert confidence < 0.7

    glucose_source_texts = [
        record["metadata_json"]["source_text"]
        for record in records
        if record["record_type"] == "glucose"
    ]
    for forbidden_text in expected["must_not_include"]["glucose_source_texts"]:
        assert all(forbidden_text not in source_text for source_text in glucose_source_texts)


def test_parse_preview_accepts_whisper_tiny_local_test_model() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "ai-whisper-tiny")

    response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": "空腹血糖 138",
            "stt_model_id": "local-whisper-tiny-placeholder",
            "llm_model_id": "local-llm-schema-stub",
        },
    )

    assert response.status_code == 200
    assert response.json()["stt_model_id"] == "local-whisper-tiny-placeholder"


def test_parse_preview_gemma4_requires_local_endpoint() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "ai-gemma4-missing")

    response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": "空腹血糖 138",
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "gemma-4-e2b-local-pending",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "llm_model_unavailable",
        "message": "Selected LLM model is not available.",
        "hint": "set_gemma4_parser_url",
    }


def test_parse_preview_accepts_static_llm_without_runtime_model_lookup(monkeypatch) -> None:
    from app.services import ai_pipeline

    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "ai-static-llm-no-runtime")

    def fail_if_ollama_lookup_runs(_: str) -> set[str]:
        raise AssertionError("Ollama availability lookup should not run for static LLM models")

    monkeypatch.setattr(ai_pipeline, "_installed_ollama_model_ids", fail_if_ollama_lookup_runs)

    response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": "空腹血糖 138",
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "local-llm-schema-stub",
        },
    )

    assert response.status_code == 200
    assert response.json()["llm_model_id"] == "local-llm-schema-stub"


def test_parse_preview_rejects_unknown_llm_before_runtime_and_profile_lookup(
    monkeypatch,
) -> None:
    from app.api import ai as ai_api

    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "ai-unknown-llm-early")

    def fail_if_runtime_lookup_runs() -> list[object]:
        raise AssertionError("runtime model lookup should not run for unknown LLM ids")

    def fail_if_profile_lookup_runs(*_: object, **__: object) -> object:
        raise AssertionError("profile lookup should not run before model rejection")

    monkeypatch.setattr(ai_api, "runtime_llm_models", fail_if_runtime_lookup_runs)
    monkeypatch.setattr(ai_api, "get_owned_profile", fail_if_profile_lookup_runs)

    response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": "空腹血糖 138",
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "unknown-local-model",
            "voice_seconds": 300,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "llm_model_unavailable",
        "message": "Selected LLM model is not available.",
        "hint": "select_available_llm_model",
    }


def test_parse_preview_rejects_runtime_unavailable_ollama_before_parser(monkeypatch) -> None:
    from app.api import ai as ai_api

    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "ai-ollama-unavailable")

    def no_installed_ollama_models(_: str) -> set[str]:
        return set()

    def fail_if_parser_called(**_: object) -> None:
        raise AssertionError("parser should not run for an unavailable LLM model")

    monkeypatch.setattr(
        "app.services.ai_pipeline._installed_ollama_model_ids",
        no_installed_ollama_models,
    )
    monkeypatch.setattr(ai_api, "build_parse_preview", fail_if_parser_called)

    response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": "空腹血糖 138",
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "ollama-qwen2.5-1.5b",
            "voice_seconds": 300,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "llm_model_unavailable",
        "message": "Selected LLM model is not available.",
        "hint": "select_available_llm_model",
    }


def test_parse_preview_rejects_unavailable_model_before_profile_lookup(monkeypatch) -> None:
    from app.api import ai as ai_api

    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "ai-model-before-profile")

    def fail_if_profile_lookup_runs(*_: object, **__: object) -> object:
        raise AssertionError("profile lookup should not run before model rejection")

    monkeypatch.setattr(ai_api, "get_owned_profile", fail_if_profile_lookup_runs)

    response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": "空腹血糖 138",
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "openai-fallback-disabled",
            "voice_seconds": 300,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "llm_model_unavailable",
        "message": "Selected LLM model is not available.",
        "hint": "select_available_llm_model",
    }


def test_parse_preview_local_parser_failure_returns_non_phi_detail(monkeypatch) -> None:
    from app.api import ai as ai_api

    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "ai-parser-error")

    def fail_parse_preview(**_: object) -> None:
        raise ai_api.LocalParserError(
            'Local parser content was not valid JSON. Raw content: {"evidence":"空腹血糖 188"}'
        )

    monkeypatch.setattr(ai_api, "build_parse_preview", fail_parse_preview)

    response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": "空腹血糖 188",
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "local-llm-schema-stub",
            "voice_seconds": 12,
        },
    )

    assert response.status_code == 502
    assert response.json()["detail"] == {
        "code": "local_parser_failed",
        "message": "Selected local parser could not produce a valid structured preview.",
    }
    assert "空腹血糖" not in response.text
    assert "188" not in response.text
    quota_response = client.get(
        "/subscriptions/voice-quota",
        headers={"X-Account-Id": account_id},
    )
    assert quota_response.status_code == 200
    assert quota_response.json()["used_seconds_today"] == 0


def test_parse_preview_records_phi_safe_parser_failure_metric(monkeypatch) -> None:
    from app.services import ai_pipeline

    http_metrics.reset()
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "ai-parser-metric")

    def fail_ollama_parser(**_: object) -> None:
        raise ai_pipeline.LocalParserError(
            'Local parser failed with raw content {"evidence":"空腹血糖 188"}'
        )

    monkeypatch.setattr(ai_pipeline, "_call_ollama_parser", fail_ollama_parser)
    monkeypatch.setattr(ai_pipeline, "_installed_ollama_model_ids", lambda _: {"qwen2.5:1.5b"})

    response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": "空腹血糖 188",
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "ollama-qwen2.5-1.5b",
        },
    )

    assert response.status_code == 502
    metrics = http_metrics.render_prometheus()
    assert (
        'app_parser_results_total{model_id="ollama-qwen2.5-1.5b",'
        'outcome="failure",reason="local_parser_failed"} 1'
    ) in metrics
    metric_label_lines = [
        line
        for line in metrics.splitlines()
        if line.startswith("app_parser_results_total")
        or line.startswith("app_http_requests_total")
    ]
    assert all("空腹血糖" not in line for line in metric_label_lines)
    assert all("188" not in line for line in metric_label_lines)


def test_parse_preview_requires_profile_ownership() -> None:
    client = TestClient(app)
    _, other_profile_id = create_account_and_profile(client, "ai-other")
    account_id, _ = create_account_and_profile(client, "ai-owner")

    response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": other_profile_id,
            "transcript": "空腹血糖 138",
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "local-llm-schema-stub",
        },
    )

    assert response.status_code == 404


def test_command_proposal_create_record_does_not_save_directly() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "command-record")

    response = client.post(
        "/ai/command-proposal",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": "今天早餐後血糖 138，早餐吃蛋餅",
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "local-llm-schema-stub",
        },
    )

    assert response.status_code == 200
    assert response.json()["transcript"] == ""
    proposal = response.json()["proposal"]
    assert proposal["intent"] == "CREATE_RECORD"
    assert proposal["action"] == "create_record_candidates"
    assert proposal["requires_confirmation"] is True
    assert [record["record_type"] for record in proposal["payload"]["records"]] == [
        "glucose",
        "meal",
    ]
    assert [action["action_type"] for action in proposal["actions"]] == [
        "create_record",
        "create_record",
    ]
    assert all("source_text" not in action["metadata_json"] for action in proposal["actions"])
    assert all("transcript" not in action["metadata_json"] for action in proposal["actions"])
    assert all("source_text" not in record["metadata_json"] for record in proposal["payload"]["records"])
    assert all("transcript" not in record["metadata_json"] for record in proposal["payload"]["records"])
    assert all("raw_text" not in record["metadata_json"] for record in proposal["payload"]["records"])

    list_response = client.get(
        f"/records?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
    )
    assert list_response.status_code == 200
    assert list_response.json() == []


def test_command_proposal_response_schema_bounds_output_shape() -> None:
    valid_action = ProposedAction(action_type="navigate", payload={"target": "trend"})

    with pytest.raises(ValidationError):
        UiResponse(type="message", message="x" * (COMMAND_UI_MESSAGE_MAX_LENGTH + 1))

    with pytest.raises(ValidationError):
        ProposedAction(
            action_type="navigate",
            payload={f"key_{index}": index for index in range(COMMAND_PAYLOAD_MAX_KEYS + 1)},
        )

    with pytest.raises(ValidationError):
        ActionProposal(
            intent="NAVIGATE",
            action="navigate",
            actions=[valid_action for _ in range(COMMAND_ACTIONS_MAX_COUNT + 1)],
            payload={"target": "trend"},
            requires_confirmation=False,
            confidence=0.74,
            decision_trace="bounded command proposal",
            ui_response=UiResponse(type="navigate", message="ok", target="trend"),
        )

    with pytest.raises(ValidationError):
        ActionProposal(
            intent="NAVIGATE",
            action="navigate",
            actions=[valid_action],
            payload={"target": "trend"},
            requires_confirmation=False,
            confidence=1.1,
            decision_trace="bounded command proposal",
            ui_response=UiResponse(type="navigate", message="ok", target="trend"),
        )


def test_command_proposal_navigate() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "command-nav")

    response = client.post(
        "/ai/command-proposal",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": "打開趨勢圖",
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "local-llm-schema-stub",
        },
    )

    assert response.status_code == 200
    proposal = response.json()["proposal"]
    assert proposal["intent"] == "NAVIGATE"
    assert proposal["action"] == "navigate"
    assert proposal["actions"] == [
        {
            "action_type": "navigate",
            "record_type": None,
            "payload": {"target": "trend"},
            "metadata_json": {},
        }
    ]
    assert proposal["payload"] == {"target": "trend"}
    assert proposal["requires_confirmation"] is False


def test_command_proposal_generate_report() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "command-report")

    response = client.post(
        "/ai/command-proposal",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": "幫我產生 30 天報告",
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "local-llm-schema-stub",
        },
    )

    assert response.status_code == 200
    proposal = response.json()["proposal"]
    assert proposal["intent"] == "GENERATE_REPORT"
    assert proposal["action"] == "show_basic_report"
    assert proposal["actions"][0]["action_type"] == "show_basic_report"
    assert proposal["payload"]["range_days"] == 30
    assert proposal["requires_confirmation"] is False


def test_command_proposal_unknown_does_not_echo_transcript() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "command-unknown")

    response = client.post(
        "/ai/command-proposal",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": "今天天氣很好，想聊聊天",
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "local-llm-schema-stub",
        },
    )

    assert response.status_code == 200
    proposal = response.json()["proposal"]
    assert proposal["intent"] == "UNKNOWN"
    assert proposal["payload"] == {"reason": "unknown_intent"}
    assert proposal["actions"] == [
        {
            "action_type": "show_message",
            "record_type": None,
            "payload": {"reason": "unknown_intent"},
            "metadata_json": {},
        }
    ]
    assert "天氣很好" not in response.text
    assert "聊聊天" not in response.text


def test_command_proposal_rejects_disabled_model() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "command-disabled")

    response = client.post(
        "/ai/command-proposal",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": "打開報告頁",
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "openai-fallback-disabled",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "llm_model_unavailable",
        "message": "Selected LLM model is not available.",
        "hint": "select_available_llm_model",
    }
