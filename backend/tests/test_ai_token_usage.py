import json
from typing import Literal

import httpx
import pytest

from app.services import ai_pipeline


def test_openai_compatible_parser_records_provider_model_and_tokens(monkeypatch: pytest.MonkeyPatch) -> None:
    recorded: list[dict[str, object]] = []
    response_payload = {
        "choices": [{"message": {"content": "{}"}}],
        "usage": {"prompt_tokens": 12, "completion_tokens": 4, "total_tokens": 16},
    }

    class FakeResponse:
        def __enter__(self) -> "FakeResponse":
            return self

        def __exit__(self, *args: object) -> Literal[False]:
            return False

        def raise_for_status(self) -> None:
            return None

        def iter_text(self) -> list[str]:
            return [json.dumps(response_payload)]

    class FakeClient:
        def __init__(self, *, timeout: float) -> None:
            assert timeout == 2.0

        def __enter__(self) -> "FakeClient":
            return self

        def __exit__(self, *args: object) -> Literal[False]:
            return False

        def stream(
            self,
            method: str,
            url: str,
            json: object,
            headers: object | None = None,
        ) -> "FakeResponse":
            assert method == "POST"
            assert url == "https://provider.example/v1/chat/completions"
            assert headers == {"Authorization": "Bearer hidden"}
            return FakeResponse()

    monkeypatch.setattr("app.services.ai_pipeline.httpx.Client", FakeClient)
    monkeypatch.setattr(
        ai_pipeline,
        "safe_record_ai_token_usage",
        lambda **kwargs: recorded.append(kwargs),
    )

    parsed = ai_pipeline._request_local_parser_json(
        parser_url="https://provider.example/v1/chat/completions",
        body={"model": "model-v2"},
        timeout_seconds=2.0,
        batch_number=1,
        headers={"Authorization": "Bearer hidden"},
        usage_provider="provider",
        usage_model_id="model-v2",
    )

    assert parsed == {}
    assert recorded == [
        {
            "provider": "provider",
            "model_id": "model-v2",
            "succeeded": True,
            "usage": response_payload["usage"],
        }
    ]


def test_remote_parser_failure_records_safe_operational_metadata(monkeypatch: pytest.MonkeyPatch) -> None:
    token_events: list[dict[str, object]] = []
    operational_events: list[dict[str, object]] = []

    class FailingClient:
        def __init__(self, *, timeout: float) -> None:
            assert timeout == 2.0

        def __enter__(self) -> "FailingClient":
            return self

        def __exit__(self, *args: object) -> Literal[False]:
            return False

        def stream(
            self,
            method: str,
            url: str,
            json: object,
            headers: object | None = None,
        ) -> None:
            _ = (method, json, headers)
            raise httpx.ConnectError(
                f"failed {url}/blood-glucose/188?token=should-not-log"
            )

    monkeypatch.setattr("app.services.ai_pipeline.httpx.Client", FailingClient)
    monkeypatch.setattr(
        ai_pipeline,
        "safe_record_ai_token_usage",
        lambda **kwargs: token_events.append(kwargs),
    )
    monkeypatch.setattr(
        ai_pipeline,
        "safe_record_operational_event",
        lambda **kwargs: operational_events.append(kwargs),
    )

    with pytest.raises(ai_pipeline.LocalParserError):
        ai_pipeline._request_local_parser_json(
            parser_url="https://provider.example/v1/chat/completions",
            body={"model": "deepseek-v4-flash"},
            timeout_seconds=2.0,
            batch_number=3,
            usage_provider="deepseek",
            usage_model_id="deepseek-v4-flash",
        )

    assert token_events == [
        {
            "provider": "deepseek",
            "model_id": "deepseek-v4-flash",
            "succeeded": False,
            "usage": None,
        }
    ]
    assert operational_events == [
        {
            "event_code": "remote_model_request_failed",
            "source": "ai_pipeline",
            "severity": "ERROR",
            "provider": "deepseek",
            "model_id": "deepseek-v4-flash",
            "error_type": "ConnectError",
            "http_status": 0,
            "batch_number": 3,
        }
    ]
    serialized = json.dumps(operational_events)
    assert "blood-glucose" not in serialized
    assert "188" not in serialized
    assert "should-not-log" not in serialized
