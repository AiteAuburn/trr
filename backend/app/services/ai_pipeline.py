from collections.abc import Iterator
from datetime import UTC, datetime
import json
import re
from time import monotonic
from typing import Annotated
from typing import Literal
from uuid import UUID

import httpx
from fastapi import HTTPException
from pydantic import BaseModel, Field, ValidationError, field_validator, model_validator

from app.core.config import get_settings
from app.core.metrics import http_metrics
from app.schemas.ai import (
    AI_MODEL_ID_MAX_LENGTH,
    ActionProposal,
    AiModelOption,
    Certainty,
    ParsedRecordPreview,
    ParsePreviewResponse,
    ProposedAction,
    RejectedEvent,
    SegmentType,
    TranscriptSegment,
    UiResponse,
)
from app.services.record_sanitization import (
    sanitize_record_metadata_for_storage,
    sanitize_record_payload_for_storage,
)
from app.services.record_schema_registry import validate_payload_with_registry
from app.services.record_validation import RecordType

GEMMA4_LLM_MODEL_ID = "gemma-4-e2b-local-pending"
OLLAMA_QWEN25_LLM_MODEL_ID = "ollama-qwen2.5-1.5b"
OLLAMA_GEMMA3_LLM_MODEL_ID = "ollama-gemma3-1b"
OLLAMA_LLAMA32_LLM_MODEL_ID = "ollama-llama3.2-1b"
DEEPSEEK_LLM_MODEL_ID = "deepseek-chat"
DEEPSEEK_SYSTEM_PROMPT = (
    "你是中文健康記錄轉錄解析器（只做結構化抽取，不做醫療建議或判斷）。"
    "你僅能根據 transcript 內容抽取 compact IR 欄位：records、rejected、needs_confirmation；不得編造任何欄位。"
    "請只輸出精簡、合法、可直接 parse 的 JSON：\n"
    "1) records: 每筆紀錄需具備 schema 規定欄位；2) rejected: 無法確認或可能有歧義的內容；"
    "3) needs_confirmation 必須為 true。"
)
DEEPSEEK_ANALYSIS_ADDENDUM = (
    "分析規則：\n"
    "1. 先判斷可驗證性，能對應到 transcript 的片段才進入 records；無法確認者放入 rejected。\n"
    "2. 只保留逐字明確、可追溯的數值/時間/單位；缺值或可疑內容一律拒絕。\n"
    "3. 不輸出醫療建議、不輸出 raw transcript、不輸出額外說明文字，只回傳最小 schema JSON。"
)
LOCAL_LLM_SEGMENT_BATCH_SIZE = 10
LOCAL_LLM_BATCH_MAX_TOKENS = 960
LOCAL_LLM_BATCH_MIN_TOKENS = 240
LOCAL_LLM_TOKENS_PER_EXTRA_SEGMENT = 120
LOCAL_LLM_PROMPT_SEGMENT_CHAR_LIMIT = 160
LOCAL_LLM_PROMPT_SEGMENTS_CHAR_BUDGET = 1600
LOCAL_LLM_RESPONSE_CHAR_BUDGET = 12000
LOCAL_LLM_HTTP_RESPONSE_CHAR_BUDGET = LOCAL_LLM_RESPONSE_CHAR_BUDGET + 4096
LOCAL_LLM_STREAM_LINE_CHAR_BUDGET = LOCAL_LLM_HTTP_RESPONSE_CHAR_BUDGET
OLLAMA_TAGS_HTTP_RESPONSE_CHAR_BUDGET = 8192
OLLAMA_TAGS_MAX_MODEL_IDS = 128
LOCAL_LLM_MAX_TRANSCRIPT_SEGMENTS = 30
LOCAL_LLM_MAX_TRANSCRIPT_NUMERIC_VALUES = LOCAL_LLM_MAX_TRANSCRIPT_SEGMENTS * 3
MAX_PARSE_PREVIEW_RECORDS = LOCAL_LLM_MAX_TRANSCRIPT_SEGMENTS * 3
COMPACT_IR_MAX_RECORDS_PER_BATCH = LOCAL_LLM_SEGMENT_BATCH_SIZE * 3
COMPACT_IR_MAX_REJECTED_PER_BATCH = LOCAL_LLM_SEGMENT_BATCH_SIZE
COMPACT_IR_MAX_ITEMS_PER_RECORD = 12
COMPACT_IR_MAX_FLAGS_PER_RECORD = 8
COMPACT_IR_MAX_SHORT_TEXT_CHARS = 80
COMPACT_IR_MAX_EVIDENCE_CHARS = 240
OLLAMA_MODEL_CACHE_TTL_SECONDS = 15.0
_ollama_model_cache: dict[str, tuple[float, set[str]]] = {}
CHINESE_DIGITS = {
    "零": 0,
    "〇": 0,
    "一": 1,
    "二": 2,
    "兩": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "七": 7,
    "八": 8,
    "九": 9,
}


class LocalParserUnavailableError(RuntimeError):
    pass


class LocalParserError(RuntimeError):
    pass


class TranscriptTooComplexError(RuntimeError):
    def __init__(self, *, segment_count: int, max_segments: int) -> None:
        super().__init__("Transcript has too many atomic events for one parse request")
        self.segment_count = segment_count
        self.max_segments = max_segments


class TranscriptTooDenseError(RuntimeError):
    def __init__(self, *, numeric_count: int, max_numeric_values: int) -> None:
        super().__init__("Transcript has too many numeric values for one parse request")
        self.numeric_count = numeric_count
        self.max_numeric_values = max_numeric_values


GemmaParserUnavailableError = LocalParserUnavailableError
GemmaParserError = LocalParserError

CompactShortText = Annotated[str, Field(min_length=1, max_length=COMPACT_IR_MAX_SHORT_TEXT_CHARS)]


class CompactIrRecord(BaseModel):
    type: Literal["glucose", "meal", "exercise", "medication", "note"]
    segment_id: CompactShortText | None = None
    value: float | None = None
    unit: CompactShortText | None = None
    meal_timing: Literal["fasting", "before_meal", "after_meal", "bedtime", "unknown"] = "unknown"
    time_hint: Literal["am", "noon", "pm", "eve", "night", "unknown"] = "unknown"
    items: list[CompactShortText] = Field(
        default_factory=list,
        max_length=COMPACT_IR_MAX_ITEMS_PER_RECORD,
    )
    duration_min: int | None = None
    confidence: float = 0.5
    flags: list[CompactShortText] = Field(
        default_factory=list,
        max_length=COMPACT_IR_MAX_FLAGS_PER_RECORD,
    )
    evidence: str = Field(default="", max_length=COMPACT_IR_MAX_EVIDENCE_CHARS)

    @field_validator("evidence")
    @classmethod
    def evidence_must_not_be_placeholder(cls, value: str) -> str:
        if value.strip() in {"", "exact user words", "original atomic phrase"}:
            raise ValueError("evidence must be exact transcript text")
        return value

    @model_validator(mode="after")
    def required_fields_by_type(self) -> "CompactIrRecord":
        if self.evidence.strip() in {"", "exact user words", "original atomic phrase"}:
            raise ValueError("evidence must be exact transcript text")
        if self.type == "glucose" and self.value is None:
            raise ValueError("glucose record requires value")
        if self.type == "meal" and not self.items:
            raise ValueError("meal record requires items")
        if self.type == "exercise" and not self.items:
            raise ValueError("exercise record requires activity item")
        if self.type == "medication" and not self.items:
            raise ValueError("medication record requires items")
        return self


class CompactIrRejected(BaseModel):
    type: Literal["negative_event"]
    segment_id: CompactShortText | None = None
    evidence: str = Field(max_length=COMPACT_IR_MAX_EVIDENCE_CHARS)

    @field_validator("evidence")
    @classmethod
    def rejected_evidence_must_not_be_placeholder(cls, value: str) -> str:
        if value.strip() in {"", "exact user words", "original atomic phrase"}:
            raise ValueError("evidence must be exact transcript text")
        return value


class CompactParserIr(BaseModel):
    records: list[CompactIrRecord] = Field(
        default_factory=list,
        max_length=COMPACT_IR_MAX_RECORDS_PER_BATCH,
    )
    rejected: list[CompactIrRejected] = Field(
        default_factory=list,
        max_length=COMPACT_IR_MAX_REJECTED_PER_BATCH,
    )
    needs_confirmation: Literal[True] = True

    @model_validator(mode="before")
    @classmethod
    def force_confirmation_required(cls, value: object) -> object:
        if isinstance(value, dict):
            return {**value, "needs_confirmation": True}
        return value

STT_MODELS = [
    AiModelOption(
        id="browser-web-speech",
        label="Browser Web Speech",
        kind="stt",
        runtime="browser",
        available=True,
        description="Web simulator speech recognition. Mobile will replace this with local STT.",
    ),
    AiModelOption(
        id="local-whisper-tiny-placeholder",
        label="Local Whisper Tiny Test",
        kind="stt",
        runtime="local",
        available=True,
        description="Local test slot for Whisper Tiny STT. Web simulator cannot run whisper.rn yet, but backend accepts this model id.",
    ),
    AiModelOption(
        id="web-transformers-whisper-tiny",
        label="Web Transformers Whisper Tiny",
        kind="stt",
        runtime="browser",
        available=True,
        description="Browser-local Whisper Tiny through Transformers.js. Downloads model on first use.",
    ),
]

LLM_MODELS = [
    AiModelOption(
        id=DEEPSEEK_LLM_MODEL_ID,
        label="DeepSeek Chat",
        kind="llm",
        runtime="server_api",
        available=True,
        description="OpenAI-compatible DeepSeek parser. Requires DEEPSEEK_PARSER_URL and DEEPSEEK_API_KEY.",
    ),
    AiModelOption(
        id="local-llm-schema-stub",
        label="Local LLM Schema Stub",
        kind="llm",
        runtime="server_stub",
        available=True,
        description="Deterministic schema adapter used until llama.rn is connected.",
    ),
    AiModelOption(
        id="local-llm-careful-stub",
        label="Local LLM Careful Stub",
        kind="llm",
        runtime="server_stub",
        available=True,
        description="Same local adapter contract with more conservative confidence.",
    ),
    AiModelOption(
        id="gemma-4-e2b-local-pending",
        label="Gemma 4 E2B Local Test",
        kind="llm",
        runtime="local",
        available=True,
        description="Local test slot for Gemma 4 parser benchmarking. Requires GEMMA4_PARSER_URL.",
    ),
    AiModelOption(
        id="ollama-qwen2.5-1.5b",
        label="Ollama Qwen2.5 1.5B",
        kind="llm",
        runtime="local",
        available=True,
        description="Runnable local parser through Ollama. Recommended first test for Chinese structured parsing.",
    ),
    AiModelOption(
        id="ollama-gemma3-1b",
        label="Ollama Gemma 3 1B",
        kind="llm",
        runtime="local",
        available=True,
        description="Runnable local parser through Ollama. Useful for small-model benchmark comparison.",
    ),
    AiModelOption(
        id="ollama-llama3.2-1b",
        label="Ollama Llama 3.2 1B",
        kind="llm",
        runtime="local",
        available=True,
        description="Runnable local parser through Ollama. Useful for small-model benchmark comparison.",
    ),
    AiModelOption(
        id="openai-fallback-disabled",
        label="OpenAI Fallback Disabled",
        kind="llm",
        runtime="cloud_disabled",
        available=False,
        description="Reserved for future compliant paid fallback. Disabled in v1.",
    ),
]


def runtime_llm_models() -> list[AiModelOption]:
    """Return model options adjusted for the local runtime state."""
    settings = get_settings()
    ollama_models = _installed_ollama_model_ids(settings.ollama_chat_url)
    configured_model_by_option = {
        OLLAMA_QWEN25_LLM_MODEL_ID: settings.ollama_qwen25_model_id,
        OLLAMA_GEMMA3_LLM_MODEL_ID: settings.ollama_gemma3_model_id,
        OLLAMA_LLAMA32_LLM_MODEL_ID: settings.ollama_llama32_model_id,
    }
    adjusted: list[AiModelOption] = []
    for model in LLM_MODELS:
        if model.id == GEMMA4_LLM_MODEL_ID and not settings.gemma4_parser_url:
            adjusted.append(
                model.model_copy(
                    update={
                        "available": False,
                        "description": f"{model.description} Not available until GEMMA4_PARSER_URL is set.",
                    }
                )
            )
            continue
        if model.id == DEEPSEEK_LLM_MODEL_ID:
            has_parser = bool(settings.deepseek_parser_url)
            has_key = bool(settings.deepseek_api_key)
            can_use = has_parser and has_key
            suffix = " DeepSeek chat endpoint ready." if can_use else " Set DEEPSEEK_PARSER_URL and DEEPSEEK_API_KEY."
            adjusted.append(
                model.model_copy(
                    update={
                        "available": can_use,
                        "description": f"{model.description}{suffix}",
                    }
                )
            )
            continue
        if model.id in configured_model_by_option:
            configured_model = configured_model_by_option[model.id]
            is_available = configured_model in ollama_models
            suffix = (
                f" Installed Ollama model: {configured_model}."
                if is_available
                else f" Pull Ollama model first: ollama pull {configured_model}."
            )
            adjusted.append(
                model.model_copy(
                    update={
                        "available": is_available,
                        "description": f"{model.description}{suffix}",
                    }
                )
            )
            continue
        adjusted.append(model)
    return adjusted


def _clear_ollama_model_cache_for_tests() -> None:
    _ollama_model_cache.clear()


def _installed_ollama_model_ids(ollama_chat_url: str, *, now: float | None = None) -> set[str]:
    checked_at = monotonic() if now is None else now
    cached = _ollama_model_cache.get(ollama_chat_url)
    if cached is not None:
        cached_at, cached_models = cached
        if checked_at - cached_at < OLLAMA_MODEL_CACHE_TTL_SECONDS:
            return set(cached_models)

    tags_url = ollama_chat_url.replace("/api/chat", "/api/tags")
    try:
        with httpx.Client(timeout=1.0) as client:
            response_text = _read_bounded_ollama_tags_response_text(client=client, tags_url=tags_url)
        payload = json.loads(response_text)
    except (httpx.HTTPError, json.JSONDecodeError, LocalParserError):
        if cached is not None:
            return set(cached[1])
        return set()

    models = payload.get("models") if isinstance(payload, dict) else None
    if not isinstance(models, list):
        return set()
    model_ids: set[str] = set()
    for model in models:
        if not isinstance(model, dict):
            continue
        for key in ("name", "model"):
            value = model.get(key)
            model_id = _bounded_ollama_model_id(value)
            if model_id is not None:
                model_ids.add(model_id)
                if len(model_ids) >= OLLAMA_TAGS_MAX_MODEL_IDS:
                    break
        if len(model_ids) >= OLLAMA_TAGS_MAX_MODEL_IDS:
            break
    _ollama_model_cache[ollama_chat_url] = (checked_at, set(model_ids))
    return model_ids


def _bounded_ollama_model_id(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = value.strip()
    if not normalized or len(normalized) > AI_MODEL_ID_MAX_LENGTH:
        return None
    return normalized


def _read_bounded_ollama_tags_response_text(*, client: httpx.Client, tags_url: str) -> str:
    chunks: list[str] = []
    total_chars = 0
    with client.stream("GET", tags_url) as response:
        response.raise_for_status()
        for chunk in response.iter_text():
            if not chunk:
                continue
            total_chars += len(chunk)
            if total_chars > OLLAMA_TAGS_HTTP_RESPONSE_CHAR_BUDGET:
                raise LocalParserError("Ollama model list response exceeded safe size")
            chunks.append(chunk)
    return "".join(chunks)


def available_model_ids(models: list[AiModelOption]) -> set[str]:
    return {model.id for model in models if model.available}


def enforce_transcript_complexity_budget(
    transcript: str,
    *,
    max_segments: int = LOCAL_LLM_MAX_TRANSCRIPT_SEGMENTS,
    max_numeric_values: int = LOCAL_LLM_MAX_TRANSCRIPT_NUMERIC_VALUES,
) -> int:
    normalized = normalize_transcript(transcript)
    numeric_count = count_transcript_numeric_values(
        normalized,
        max_numeric_values=max_numeric_values + 1,
    )
    if numeric_count > max_numeric_values:
        raise TranscriptTooDenseError(
            numeric_count=numeric_count,
            max_numeric_values=max_numeric_values,
        )

    segment_count = len(_atomic_event_segments(normalized, max_segments=max_segments + 1))
    if segment_count > max_segments:
        raise TranscriptTooComplexError(segment_count=segment_count, max_segments=max_segments)
    return segment_count


def count_transcript_numeric_values(text: str, *, max_numeric_values: int | None = None) -> int:
    count = 0
    for _ in re.finditer(r"(?<!\d)(\d{2,3})(?!\d)", text):
        count += 1
        if max_numeric_values is not None and count >= max_numeric_values:
            return count
    for match in re.finditer(r"[零〇一二兩三四五六七八九十百]{2,}", text):
        value = _parse_chinese_number(match.group(0))
        if value is None or not 10 <= value <= 999:
            continue
        count += 1
        if max_numeric_values is not None and count >= max_numeric_values:
            return count
    return count


def _first_number(text: str) -> float | None:
    match = re.search(r"(?<!\d)(\d{2,3})(?!\d)", text)
    if match:
        return float(match.group(1))
    values = _chinese_number_values(text)
    return values[0] if values else None


def _parse_chinese_number(text: str) -> int | None:
    if not text or not all(char in CHINESE_DIGITS or char in {"十", "百"} for char in text):
        return None

    if "百" in text:
        hundred_text, rest = text.split("百", 1)
        hundreds = CHINESE_DIGITS.get(hundred_text, 1 if hundred_text == "" else 0)
        if rest == "":
            return hundreds * 100
        if rest.startswith(("零", "〇")):
            rest = rest[1:]
            return hundreds * 100 + (CHINESE_DIGITS.get(rest, 0) if len(rest) == 1 else 0)
        if "十" in rest:
            ten_text, one_text = rest.split("十", 1)
            tens = CHINESE_DIGITS.get(ten_text, 1 if ten_text == "" else 0)
            ones = CHINESE_DIGITS.get(one_text, 0) if one_text else 0
            return hundreds * 100 + tens * 10 + ones
        if len(rest) == 1 and rest in CHINESE_DIGITS:
            return hundreds * 100 + CHINESE_DIGITS[rest] * 10
        return None

    if "十" in text:
        ten_text, one_text = text.split("十", 1)
        tens = CHINESE_DIGITS.get(ten_text, 1 if ten_text == "" else 0)
        ones = CHINESE_DIGITS.get(one_text, 0) if one_text else 0
        return tens * 10 + ones

    if len(text) == 2 and all(char in CHINESE_DIGITS for char in text):
        return CHINESE_DIGITS[text[0]] * 10 + CHINESE_DIGITS[text[1]]
    return CHINESE_DIGITS.get(text)


def _chinese_number_values(text: str) -> list[float]:
    values: list[float] = []
    for match in re.finditer(r"[零〇一二兩三四五六七八九十百]{2,}", text):
        value = _parse_chinese_number(match.group(0))
        if value is not None and 10 <= value <= 999:
            values.append(float(value))
    return values


def _number_values(text: str) -> list[float]:
    values = [float(value) for value in re.findall(r"(?<!\d)(\d{2,3})(?!\d)", text)]
    values.extend(_chinese_number_values(text))
    return values


def _plausible_glucose_values(text: str) -> list[float]:
    return [value for value in _number_values(text) if 40 <= value <= 500]


def _numbers_after_keywords(text: str, keywords: tuple[str, ...], window: int = 32) -> list[float]:
    normalized = text.lower()
    for keyword in keywords:
        index = normalized.find(keyword.lower())
        if index == -1:
            continue
        fragment = normalized[index + len(keyword) : index + len(keyword) + window]
        values = _number_values(fragment)
        if values:
            return values
    return []


def _number_before_keywords(text: str, keywords: tuple[str, ...], window: int = 16) -> float | None:
    normalized = text.lower()
    for keyword in keywords:
        index = normalized.find(keyword.lower())
        if index == -1:
            continue
        fragment = normalized[max(0, index - window) : index]
        values = _number_values(fragment)
        if values:
            return values[-1]
    return None


def _glucose_value(text: str) -> float | None:
    values = _numbers_after_keywords(text, ("血糖", "空腹", "飯前", "飯後", "睡前"))
    return values[0] if values else _first_number(text)


def _body_measurement_value(text: str, kind: str) -> float | None:
    if kind == "body_fat":
        values = _numbers_after_keywords(text, ("體脂",))
        return values[0] if values else _number_before_keywords(text, ("%",))
    values = _numbers_after_keywords(text, ("體重",))
    return values[0] if values else _number_before_keywords(text, ("公斤", "kg"))


def _minutes(text: str) -> int | None:
    match = re.search(r"(\d{1,3})\s*(?:分鐘|分|minutes?|mins?)", text, re.IGNORECASE)
    if not match:
        return None
    return int(match.group(1))


def _metadata(
    transcript: str,
    stt_model_id: str,
    llm_model_id: str,
    *,
    source_text: str | None = None,
    time_hint: str | None = None,
) -> dict[str, str]:
    metadata = {
        "transcript": transcript,
        "source_text": source_text or transcript,
        "stt_model_id": stt_model_id,
        "parser_model_id": llm_model_id,
    }
    if time_hint is not None:
        metadata["time_hint"] = time_hint
    return metadata


def _confidence(llm_model_id: str, base: float) -> float:
    if llm_model_id == "local-llm-careful-stub":
        return max(0.1, round(base - 0.12, 2))
    return round(base, 2)


def normalize_transcript(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip())


def _clauses(text: str) -> list[str]:
    raw_clauses = [clause.strip() for clause in re.split(r"[，。,.!?！？；;]+", text) if clause.strip()]
    clauses: list[str] = []

    for clause in raw_clauses:
        if "但" not in clause:
            clauses.append(clause)
            continue

        parts = [part.strip() for part in clause.split("但") if part.strip()]
        if len(parts) != 2:
            clauses.append(clause)
            continue

        prefix = _time_hint(parts[0])
        clauses.append(parts[0])
        second_part = parts[1]
        if prefix and prefix != "bedtime" and not _time_hint(second_part):
            time_prefix = {
                "morning": "早上",
                "noon": "中午",
                "afternoon": "下午",
                "evening": "晚上",
                "bedtime": "睡前",
            }[prefix]
            second_part = f"{time_prefix}{second_part}"
        clauses.append(second_part)

    return clauses


def _time_hint(text: str) -> str | None:
    if any(keyword in text for keyword in ("早上", "早餐", "空腹")):
        return "morning"
    if any(keyword in text for keyword in ("中午", "午餐")):
        return "noon"
    if any(keyword in text for keyword in ("下午", "點心")):
        return "afternoon"
    if any(keyword in text for keyword in ("晚上", "晚餐")):
        return "evening"
    if "睡前" in text:
        return "bedtime"
    return None


def _ir_time_hint(value: str) -> str | None:
    return {
        "am": "morning",
        "noon": "noon",
        "pm": "afternoon",
        "eve": "evening",
        "night": "bedtime",
        "unknown": None,
    }.get(value, None)


def _meal_timing(text: str, nearby_text: str = "") -> str:
    combined = f"{text} {nearby_text}"
    if any(keyword in combined for keyword in ("忘記是不是空腹", "不確定是不是空腹")):
        return "unknown"
    if "空腹" in text:
        return "fasting"
    if any(keyword in text for keyword in ("飯後", "餐後", "吃飯之後", "早餐後", "午餐後", "晚餐後")):
        return "after_meal"
    if any(keyword in text for keyword in ("飯前", "餐前", "早餐前", "午餐前", "晚餐前")):
        return "before_meal"
    if "睡前" in text:
        return "bedtime"
    return "unknown"


def _meal_type(text: str) -> str | None:
    if "早餐" in text:
        return "breakfast"
    if any(keyword in text for keyword in ("中午", "午餐")):
        return "lunch"
    if any(keyword in text for keyword in ("下午", "點心")):
        return "snack"
    if any(keyword in text for keyword in ("晚上", "晚餐")):
        return "dinner"
    return None


def _food_items(text: str) -> list[dict[str, str]]:
    match = re.search(r"(?:吃了|吃|喝了|喝)(.+)$", text)
    if not match:
        return []
    food_text = match.group(1)
    food_text = re.sub(r"^(了|有)", "", food_text)
    food_text = re.split(r"(?:之後|以後|後來|量血糖|血糖)", food_text)[0].strip()
    if food_text in {"飯", "飯後", "吃飯"}:
        return []
    names = [
        name.strip()
        for name in re.split(r"(?:跟|和|與|、|/|，)", food_text)
        if name.strip() and name.strip() not in {"有", "了"}
    ]
    return [
        {"name": name, "amount": "unknown"}
        for name in names[:COMPACT_IR_MAX_ITEMS_PER_RECORD]
    ]


def _is_negative_event(text: str) -> bool:
    return any(keyword in text for keyword in ("沒量血糖", "沒再量", "沒有量血糖"))


def _segment_type(text: str) -> SegmentType:
    if _is_negative_event(text):
        return "negative_event"
    if any(keyword in text for keyword in ("血糖", "空腹", "飯前", "飯後", "睡前", "又量", "再量")):
        return "measurement"
    if any(keyword in text for keyword in ("早餐", "午餐", "中午", "點心", "晚餐", "吃", "喝")):
        return "meal"
    if any(keyword in text for keyword in ("散步", "走路", "運動", "伸展", "跑步", "騎車", "游泳")):
        return "exercise"
    if any(keyword in text for keyword in ("藥", "用藥", "吃藥", "胰島素", "metformin")):
        return "medication"
    if any(keyword in text for keyword in ("血壓", "收縮壓", "舒張壓")):
        return "vital"
    if any(keyword in text for keyword in ("體重", "公斤", "kg", "體脂")):
        return "body_measurement"
    return "unknown"


def _exercise_items(text: str) -> list[str]:
    for keyword in ("散步", "走路", "跑步", "騎車", "游泳", "伸展", "運動"):
        if keyword in text:
            return [keyword]
    return []


def _certainty(text: str) -> Certainty:
    if any(keyword in text for keyword in ("好像", "左右", "忘記", "不確定", "大概")):
        return "uncertain"
    return "certain"


def _is_measurement_modifier(text: str) -> bool:
    return any(keyword in text for keyword in ("忘記是不是空腹", "不確定是不是空腹"))


def _is_duration_modifier(text: str) -> bool:
    return _minutes(text) is not None and _segment_type(text) == "unknown"


def _atomic_event_segments(text: str, *, max_segments: int | None = None) -> list[str]:
    atomic_segments: list[str] = []

    for clause in _clauses(text):
        clause_type = _segment_type(clause)

        if (
            _is_measurement_modifier(clause)
            and atomic_segments
            and _segment_type(atomic_segments[-1]) == "measurement"
        ):
            atomic_segments[-1] = f"{atomic_segments[-1]}，{clause}"
            continue

        if (
            atomic_segments
            and _segment_type(atomic_segments[-1]) == "measurement"
            and _glucose_value(atomic_segments[-1]) is None
            and clause_type not in {"meal", "exercise", "medication"}
            and _plausible_glucose_values(clause)
        ):
            atomic_segments[-1] = f"{atomic_segments[-1]}，{clause}"
            continue

        if (
            _is_duration_modifier(clause)
            and atomic_segments
            and _segment_type(atomic_segments[-1]) == "exercise"
        ):
            atomic_segments[-1] = f"{atomic_segments[-1]}，{clause}"
            continue

        atomic_segments.append(clause)
        if max_segments is not None and len(atomic_segments) >= max_segments:
            break

    return atomic_segments


def segment_transcript(transcript: str) -> list[TranscriptSegment]:
    """Local LLM segmentation adapter stub.

    Real mobile LLM output must follow this shape. Each segment must contain
    exactly one atomic event; modifiers for the same event are merged into that
    event instead of becoming standalone segments.
    """

    segments: list[TranscriptSegment] = []
    for index, clause in enumerate(_atomic_event_segments(transcript)):
        certainty = _certainty(clause)
        segments.append(
            TranscriptSegment(
                segment_id=f"seg_{index + 1:03d}",
                segment_type=_segment_type(clause),
                source_text=clause,
                normalized_text=clause,
                time_hint=_time_hint(clause),
                certainty=certainty,
                is_negative_event=_is_negative_event(clause),
                confidence=0.55 if certainty == "uncertain" else 0.78,
            )
        )
    return segments


def _normalize_compact_ir_candidate(
    parsed: object,
    normalized_text: str,
    segments: list[TranscriptSegment] | None = None,
) -> object:
    """Repair common small-model schema slips without re-parsing the transcript."""

    if not isinstance(parsed, dict):
        return parsed

    normalized = dict(parsed)
    raw_records = _bounded_compact_ir_array(
        parsed.get("records"),
        limit=COMPACT_IR_MAX_RECORDS_PER_BATCH,
    )
    if not isinstance(raw_records, list):
        return normalized

    segments = segments or segment_transcript(normalized_text)
    segment_by_id = {segment.segment_id: segment for segment in segments}
    records: list[object] = []
    seen_records: set[tuple[object, ...]] = set()
    for raw_record in raw_records:
        if not isinstance(raw_record, dict):
            records.append(raw_record)
            continue

        record = dict(raw_record)
        segment = _segment_for_record(record, segment_by_id)
        if segment is not None:
            record["evidence"] = segment.source_text

        text = record.get("text")
        if "evidence" not in record and isinstance(text, str):
            record["evidence"] = text

        if record.get("type") == "note":
            converted = _convert_note_record(record)
            if converted is None:
                continue
            record = converted

        if record.get("type") == "meal":
            items = _split_meal_items(_string_items(record.get("items")))
            if items:
                record["items"] = items

        if record.get("type") == "meal" and not _string_items(record.get("items")):
            evidence = record.get("evidence")
            if isinstance(evidence, str):
                food_items = _food_items(evidence)
                if food_items:
                    record["items"] = [item["name"] for item in food_items]

        if record.get("type") == "exercise" and record.get("duration_min") is None:
            evidence = record.get("evidence")
            if isinstance(evidence, str):
                minutes = _minutes(evidence)
                if minutes is not None:
                    record["duration_min"] = minutes

        if record.get("type") == "exercise" and not _string_items(record.get("items")):
            evidence = record.get("evidence")
            if isinstance(evidence, str):
                items = _exercise_items(evidence)
                if items:
                    record["items"] = items

        evidence = record.get("evidence")
        if not _evidence_matches_ir_record(record, evidence, normalized_text):
            matched_evidence = _best_evidence_for_ir_record(record, segments)
            if matched_evidence is not None:
                record["evidence"] = matched_evidence
                if record.get("type") == "exercise" and not _string_items(record.get("items")):
                    items = _exercise_items(matched_evidence)
                    if items:
                        record["items"] = items

        if not _evidence_matches_ir_record(record, record.get("evidence"), normalized_text):
            continue

        identity = _ir_record_identity(record)
        if identity in seen_records:
            continue
        seen_records.add(identity)
        records.append(record)

    normalized["records"] = records
    normalized["needs_confirmation"] = True
    normalized["rejected"] = _normalize_rejected_items(
        _bounded_compact_ir_array(
            parsed.get("rejected"),
            limit=COMPACT_IR_MAX_REJECTED_PER_BATCH,
        ),
        segment_by_id,
    )
    return normalized


def _bounded_compact_ir_array(value: object, *, limit: int) -> object:
    if not isinstance(value, list):
        return value
    return value[:limit]


def _segment_for_record(
    record: dict[str, object], segment_by_id: dict[str, TranscriptSegment]
) -> TranscriptSegment | None:
    segment_id = record.get("segment_id")
    return segment_by_id.get(segment_id) if isinstance(segment_id, str) else None


def _string_items(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, str) and item.strip()]


def _split_meal_items(items: list[str]) -> list[str]:
    split_items: list[str] = []
    for item in items:
        parts = [
            part.strip()
            for part in re.split(r"(?:跟|和|與|及|、|/|，|,)", item)
            if part.strip()
        ]
        split_items.extend(parts or [item])
    return split_items


def _item_match_terms(items: list[str]) -> list[str]:
    terms: list[str] = []
    for item in items:
        for part in _split_meal_items([item]):
            normalized = re.sub(r"^(?:一份|一個|一瓶|一杯|一片|一小塊|半碗|一碗|大概|一些)", "", part)
            for term in (part, normalized):
                if len(term) >= 2 and term not in terms:
                    terms.append(term)
    return terms


def _normalize_rejected_items(
    value: object, segment_by_id: dict[str, TranscriptSegment] | None = None
) -> list[object]:
    if not isinstance(value, list):
        return []

    rejected: list[object] = []
    for item in value:
        if isinstance(item, dict):
            normalized_item = dict(item)
            segment = _segment_for_record(normalized_item, segment_by_id or {})
            if segment is not None:
                normalized_item["type"] = "negative_event"
                normalized_item["evidence"] = segment.source_text
            rejected.append(normalized_item)
            continue
        if isinstance(item, str) and _is_negative_event(item):
            rejected.append({"type": "negative_event", "evidence": item})
    return rejected


def _dedupe_compact_ir_records(records: list[CompactIrRecord]) -> list[CompactIrRecord]:
    deduped: list[CompactIrRecord] = []
    seen: set[tuple[object, ...]] = set()
    for record in records:
        identity = _ir_record_identity(record.model_dump())
        if identity in seen:
            continue
        seen.add(identity)
        deduped.append(record)
    return deduped


def _ir_record_identity(record: dict[str, object]) -> tuple[object, ...]:
    record_type = record.get("type")
    evidence = record.get("evidence")
    if record_type == "glucose":
        return (record_type, record.get("value"), evidence)
    if record_type == "meal":
        return (record_type, tuple(_string_items(record.get("items"))), evidence)
    if record_type == "exercise":
        return (record_type, tuple(_string_items(record.get("items"))), record.get("duration_min"), evidence)
    if record_type == "medication":
        return (record_type, tuple(_string_items(record.get("items"))), evidence)
    return (record_type, evidence)


def _convert_note_record(record: dict[str, object]) -> dict[str, object] | None:
    evidence = record.get("evidence")
    if not isinstance(evidence, str) or not evidence.strip():
        return None

    segment_type = _segment_type(evidence)
    converted = dict(record)
    if segment_type == "measurement":
        value = _glucose_value(evidence)
        if value is None:
            return None
        converted["type"] = "glucose"
        converted["value"] = value
        return converted

    if segment_type == "meal":
        food_items = _food_items(evidence)
        if not food_items:
            return None
        converted["type"] = "meal"
        converted["items"] = [item["name"] for item in food_items]
        return converted

    if segment_type == "exercise":
        converted["type"] = "exercise"
        if converted.get("duration_min") is None:
            converted["duration_min"] = _minutes(evidence)
        if not _string_items(converted.get("items")):
            converted["items"] = _exercise_items(evidence)
        return converted

    if segment_type == "medication":
        converted["type"] = "medication"
        if not _string_items(converted.get("items")):
            converted["items"] = [evidence]
        return converted

    return None


def _best_evidence_for_ir_record(
    record: dict[str, object], segments: list[TranscriptSegment]
) -> str | None:
    record_type = record.get("type")
    if record_type == "glucose":
        value = record.get("value")
        if not isinstance(value, int | float):
            return None
        for segment in segments:
            if any(
                abs(value - glucose_value) < 0.01
                for glucose_value in _plausible_glucose_values(segment.source_text)
            ):
                return segment.source_text

    if record_type == "meal":
        terms = _item_match_terms(_string_items(record.get("items")))
        best_segment: TranscriptSegment | None = None
        best_score = 0
        for segment in segments:
            score = sum(1 for term in terms if term in segment.source_text)
            if segment.segment_type == "meal":
                score += 1
            if score > best_score:
                best_score = score
                best_segment = segment
        if best_segment is not None and best_score > 1:
            return best_segment.source_text

    if record_type == "exercise":
        duration = record.get("duration_min")
        for segment in segments:
            if segment.segment_type != "exercise":
                continue
            if not isinstance(duration, int) or _minutes(segment.source_text) == duration:
                return segment.source_text

    if record_type == "medication":
        items = _string_items(record.get("items"))
        for segment in segments:
            if segment.segment_type == "medication" or any(item in segment.source_text for item in items):
                return segment.source_text

    return None


def _evidence_matches_ir_record(
    record: dict[str, object], evidence: object, normalized_text: str
) -> bool:
    if not isinstance(evidence, str) or not evidence.strip() or evidence not in normalized_text:
        return False

    record_type = record.get("type")
    if record_type == "glucose":
        value = record.get("value")
        return isinstance(value, int | float) and any(
            abs(value - glucose_value) < 0.01
            for glucose_value in _plausible_glucose_values(evidence)
        )

    if record_type == "meal":
        terms = _item_match_terms(_string_items(record.get("items")))
        return bool(terms) and any(term in evidence for term in terms)

    if record_type == "exercise":
        items = _string_items(record.get("items"))
        if not items:
            return False
        if not any(item in evidence for item in items):
            return False
        duration = record.get("duration_min")
        if isinstance(duration, int):
            return _minutes(evidence) == duration
        return _segment_type(evidence) == "exercise"

    if record_type == "medication":
        items = _string_items(record.get("items"))
        return _segment_type(evidence) == "medication" or any(item in evidence for item in items)

    if record_type == "note":
        return bool(evidence.strip())

    return False


def rejected_events_from_segments(segments: list[TranscriptSegment]) -> list[RejectedEvent]:
    return [
        RejectedEvent(
            segment_id=segment.segment_id,
            source_text=segment.source_text,
            reason="negative measurement event",
            time_hint=segment.time_hint,
        )
        for segment in segments
        if segment.is_negative_event
    ]


def storage_compatible_preview_records(
    records: list[ParsedRecordPreview],
) -> tuple[list[ParsedRecordPreview], list[RejectedEvent]]:
    valid_records: list[ParsedRecordPreview] = []
    rejected_events: list[RejectedEvent] = []

    for index, record in enumerate(records, start=1):
        sanitized_payload = sanitize_record_payload_for_storage(record.record_type, record.payload_json)
        try:
            validate_payload_with_registry(record.record_type, sanitized_payload)
        except HTTPException:
            source_text = record.metadata_json.get("source_text")
            rejected_events.append(
                RejectedEvent(
                    segment_id=f"invalid_{index:03d}",
                    source_text=source_text if isinstance(source_text, str) else "",
                    reason="invalid structured payload",
                    time_hint=record.metadata_json.get("time_hint")
                    if isinstance(record.metadata_json.get("time_hint"), str)
                    else None,
                )
            )
            continue

        valid_records.append(record.model_copy(update={"payload_json": sanitized_payload}))

    return valid_records, rejected_events


def storage_compatible_parse_preview(preview: ParsePreviewResponse) -> ParsePreviewResponse:
    valid_records, rejected_events = storage_compatible_preview_records(preview.records)
    return preview.model_copy(
        update={
            "records": valid_records,
            "rejected_events": [*preview.rejected_events, *rejected_events],
        }
    )


def sanitized_preview_record_dump(record: ParsedRecordPreview) -> dict[str, object]:
    return record.model_copy(
        update={"metadata_json": sanitize_record_metadata_for_storage(record.metadata_json)}
    ).model_dump(mode="json")


def compact_ir_to_parse_preview(
    *,
    profile_id: UUID,
    transcript: str,
    normalized_text: str,
    stt_model_id: str,
    llm_model_id: str,
    occurred_at: datetime | None,
    parser_ir: CompactParserIr,
) -> ParsePreviewResponse:
    record_time = occurred_at or datetime.now(UTC)
    segments: list[TranscriptSegment] = []
    records: list[ParsedRecordPreview] = []
    rejected_events: list[RejectedEvent] = []

    for index, ir_record in enumerate(parser_ir.records, start=1):
        evidence = ir_record.evidence or normalized_text
        time_hint = _ir_time_hint(ir_record.time_hint)
        segment_type: SegmentType = {
            "glucose": "measurement",
            "meal": "meal",
            "exercise": "exercise",
            "medication": "medication",
            "vital": "vital",
            "body_measurement": "body_measurement",
            "lab_result": "lab_result",
            "lifestyle": "lifestyle",
            "note": "note",
        }.get(ir_record.type, "unknown")  # type: ignore[assignment]
        segments.append(
            TranscriptSegment(
                segment_id=f"seg_{index:03d}",
                segment_type=segment_type,
                source_text=evidence,
                normalized_text=evidence,
                time_hint=time_hint,
                certainty="uncertain" if ir_record.confidence < 0.7 else "certain",
                is_negative_event=False,
                confidence=round(ir_record.confidence, 2),
            )
        )

        if ir_record.type == "glucose" and ir_record.value is not None:
            records.append(
                _record(
                    profile_id=profile_id,
                    record_type="glucose",
                    occurred_at=record_time,
                    payload_json={
                        "value": ir_record.value,
                        "unit": ir_record.unit or "mg/dL",
                        "meal_timing": ir_record.meal_timing or "unknown",
                        "context": "unknown",
                    },
                    transcript=normalized_text,
                    source_text=evidence,
                    stt_model_id=stt_model_id,
                    llm_model_id=llm_model_id,
                    confidence=ir_record.confidence,
                    decision_trace="LLM IR extracted glucose measurement.",
                )
            )
            continue

        if ir_record.type == "meal" and ir_record.items:
            records.append(
                _record(
                    profile_id=profile_id,
                    record_type="meal",
                    occurred_at=record_time,
                    payload_json={
                        "meal_type": {
                            "am": "breakfast",
                            "noon": "lunch",
                            "pm": "snack",
                            "eve": "dinner",
                            "night": "unknown",
                            "unknown": "unknown",
                        }.get(ir_record.time_hint, "unknown"),
                        "food_items": [
                            {"name": item, "amount": "unknown"} for item in ir_record.items
                        ],
                    },
                    transcript=normalized_text,
                    source_text=evidence,
                    stt_model_id=stt_model_id,
                    llm_model_id=llm_model_id,
                    confidence=ir_record.confidence,
                    decision_trace="LLM IR extracted meal items.",
                )
            )
            continue

        if ir_record.type == "exercise":
            activity = ir_record.items[0] if ir_record.items else "運動"
            records.append(
                _record(
                    profile_id=profile_id,
                    record_type="exercise",
                    occurred_at=record_time,
                    payload_json={
                        "activity": activity,
                        "minutes": ir_record.duration_min,
                    },
                    transcript=normalized_text,
                    source_text=evidence,
                    stt_model_id=stt_model_id,
                    llm_model_id=llm_model_id,
                    confidence=ir_record.confidence,
                    decision_trace="LLM IR extracted exercise.",
                )
            )
            continue

        if ir_record.type == "medication" and ir_record.items:
            records.append(
                _record(
                    profile_id=profile_id,
                    record_type="medication",
                    occurred_at=record_time,
                    payload_json={
                        "name": ir_record.items[0],
                        "taken": True,
                    },
                    transcript=normalized_text,
                    source_text=evidence,
                    stt_model_id=stt_model_id,
                    llm_model_id=llm_model_id,
                    confidence=ir_record.confidence,
                    decision_trace="LLM IR extracted medication.",
                )
            )
            continue

    for index, rejected in enumerate(parser_ir.rejected, start=1):
        rejected_events.append(
            RejectedEvent(
                segment_id=f"rej_{index:03d}",
                source_text=rejected.evidence,
                reason="negative measurement event",
                time_hint=_ir_time_hint("unknown"),
            )
        )

    return storage_compatible_parse_preview(
        ParsePreviewResponse(
            transcript="",
            normalized_text="",
            stt_model_id=stt_model_id,
            llm_model_id=llm_model_id,
            segments=segments,
            records=records,
            rejected_events=rejected_events,
        )
    )


def build_parse_preview(
    *,
    profile_id: UUID,
    transcript: str,
    stt_model_id: str,
    llm_model_id: str,
    occurred_at: datetime | None,
) -> ParsePreviewResponse:
    try:
        preview = _build_parse_preview(
            profile_id=profile_id,
            transcript=transcript,
            stt_model_id=stt_model_id,
            llm_model_id=llm_model_id,
            occurred_at=occurred_at,
        )
    except LocalParserUnavailableError:
        http_metrics.record_parser_result(
            model_id=llm_model_id,
            outcome="failure",
            reason="local_parser_unavailable",
        )
        raise
    except LocalParserError:
        http_metrics.record_parser_result(
            model_id=llm_model_id,
            outcome="failure",
            reason="local_parser_failed",
        )
        raise

    repair_reasons = _parser_repair_reasons(preview)
    if repair_reasons:
        for reason in repair_reasons:
            http_metrics.record_parser_result(
                model_id=llm_model_id,
                outcome="fallback",
                reason=reason,
            )
    else:
        http_metrics.record_parser_result(model_id=llm_model_id, outcome="success", reason="ok")
    return preview


def _parser_repair_reasons(preview: ParsePreviewResponse) -> list[str]:
    return sorted(
        {
            str(record.metadata_json["parser_repair"])
            for record in preview.records
            if "parser_repair" in record.metadata_json
        }
    )


def _build_parse_preview(
    *,
    profile_id: UUID,
    transcript: str,
    stt_model_id: str,
    llm_model_id: str,
    occurred_at: datetime | None,
) -> ParsePreviewResponse:
    normalized_text = normalize_transcript(transcript)

    if llm_model_id == GEMMA4_LLM_MODEL_ID:
        return _call_gemma4_parser(
            profile_id=profile_id,
            transcript=transcript.strip(),
            normalized_text=normalized_text,
            stt_model_id=stt_model_id,
            llm_model_id=llm_model_id,
            occurred_at=occurred_at,
        )

    if llm_model_id == DEEPSEEK_LLM_MODEL_ID:
        return _call_deepseek_parser(
            profile_id=profile_id,
            transcript=transcript.strip(),
            normalized_text=normalized_text,
            stt_model_id=stt_model_id,
            llm_model_id=llm_model_id,
            occurred_at=occurred_at,
        )

    if llm_model_id in {
        OLLAMA_QWEN25_LLM_MODEL_ID,
        OLLAMA_GEMMA3_LLM_MODEL_ID,
        OLLAMA_LLAMA32_LLM_MODEL_ID,
    }:
        return _call_ollama_parser(
            profile_id=profile_id,
            transcript=transcript.strip(),
            normalized_text=normalized_text,
            stt_model_id=stt_model_id,
            llm_model_id=llm_model_id,
            occurred_at=occurred_at,
        )

    return _build_deterministic_parse_preview(
        profile_id=profile_id,
        transcript=transcript,
        normalized_text=normalized_text,
        stt_model_id=stt_model_id,
        llm_model_id=llm_model_id,
        occurred_at=occurred_at,
    )


def stream_parse_progress(
    *,
    profile_id: UUID,
    transcript: str,
    stt_model_id: str,
    llm_model_id: str,
    occurred_at: datetime | None,
) -> Iterator[str]:
    """Stream user-visible parser progress as newline-delimited JSON.

    This endpoint is for local UI progress only. It does not persist transcript,
    prompt, raw model output, or health records.
    """

    def event(name: str, payload: dict[str, object]) -> str:
        return f"{json.dumps({'event': name, **payload}, ensure_ascii=False)}\n"

    def parser_stream_error_payload(
        exc: LocalParserError | LocalParserUnavailableError,
    ) -> dict[str, object]:
        code = "local_parser_failed"
        message = "本地 AI 整理暫時失敗，請改用文字輸入、切換可用模型，或稍後重試。"
        hint = "retry_or_switch_model"
        if isinstance(exc, LocalParserUnavailableError):
            code = "local_parser_unavailable"
            message = "選定的本地解析模型目前不可用，請到設定切換可用模型。"
            hint = "switch_model"
            if "GEMMA4_PARSER_URL" in str(exc):
                hint = "set_gemma4_parser_url"
                message = "選定的 Gemma 4 本地解析服務尚未設定，請到設定切換可用模型。"
        return {"code": code, "message": message, "hint": hint}

    normalized_text = normalize_transcript(transcript)
    yield event("received", {"message": "文字已收到"})
    yield event("normalized", {"normalized_text": normalized_text})

    segments = segment_transcript(normalized_text)
    yield event(
        "segments_ready",
        {
            "count": len(segments),
        },
    )

    yield event(
        "llm_batch_active",
        {
            "message": "本地 LLM 正在一次解析完整文字",
            "segment_count": len(segments),
        },
    )
    settings = get_settings()
    try:
        preview = build_parse_preview(
            profile_id=profile_id,
            transcript=transcript,
            stt_model_id=stt_model_id,
            llm_model_id=llm_model_id,
            occurred_at=occurred_at,
        )
    except (LocalParserError, LocalParserUnavailableError) as exc:
        if not settings.local_llm_repair_fallback_enabled:
            yield event(
                "error",
                {
                    **parser_stream_error_payload(exc),
                    "reason": "local_llm_parse_failed",
                },
            )
            return
        preview = _build_deterministic_parse_preview(
            profile_id=profile_id,
            transcript=transcript,
            normalized_text=normalized_text,
            stt_model_id=stt_model_id,
            llm_model_id=llm_model_id,
            occurred_at=occurred_at,
            parser_repair_reason="local_llm_unavailable_fallback",
        )
        yield event(
            "llm_fallback",
            {
                "reason": "local_llm_unavailable_fallback",
                **parser_stream_error_payload(exc),
            },
        )

    parser_repair_reasons = _parser_repair_reasons(preview)
    if parser_repair_reasons:
        yield event(
            "llm_fallback",
            {
                "reason": ",".join(parser_repair_reasons),
                "message": "本地 LLM 輸出未完全符合 schema，已使用本地 deterministic parser 修復。",
            },
        )

    yield event(
        "llm_batch_done",
        {
            "record_count": len(preview.records),
            "rejected_count": len(preview.rejected_events),
        },
    )

    total_segments = max(len(segments), 1)
    records_by_source: dict[str, int] = {}
    rejected_by_source: dict[str, int] = {}
    for record in preview.records:
        source_text = record.metadata_json.get("source_text")
        if isinstance(source_text, str):
            records_by_source[source_text] = records_by_source.get(source_text, 0) + 1
    for rejected in preview.rejected_events:
        rejected_by_source[rejected.source_text] = rejected_by_source.get(rejected.source_text, 0) + 1

    for index, segment in enumerate(segments, start=1):
        yield event(
            "segment_active",
            {
                "index": index,
                "total": total_segments,
                "segment": segment.model_dump(mode="json"),
            },
        )
        yield event(
            "segment_done",
            {
                "index": index,
                "total": total_segments,
                "record_count": records_by_source.get(segment.source_text, 0),
                "rejected_count": rejected_by_source.get(segment.source_text, 0),
            },
        )

    final_preview = ParsePreviewResponse(
        transcript="",
        normalized_text="",
        stt_model_id=stt_model_id,
        llm_model_id=llm_model_id,
        segments=segments,
        records=preview.records,
        rejected_events=preview.rejected_events,
    )
    yield event("validated", {"record_count": len(preview.records)})
    yield event("final", {"preview": final_preview.model_dump(mode="json")})


def _build_deterministic_parse_preview(
    *,
    profile_id: UUID,
    transcript: str,
    normalized_text: str,
    stt_model_id: str,
    llm_model_id: str,
    occurred_at: datetime | None,
    parser_repair_reason: str | None = None,
) -> ParsePreviewResponse:
    segments = segment_transcript(normalized_text)
    records = parse_transcript_to_records(
        profile_id=profile_id,
        transcript=normalized_text,
        stt_model_id=stt_model_id,
        llm_model_id=llm_model_id,
        occurred_at=occurred_at,
    )
    if parser_repair_reason is not None:
        for record in records:
            record.metadata_json["parser_repair"] = parser_repair_reason

    return storage_compatible_parse_preview(
        ParsePreviewResponse(
            transcript="",
            normalized_text="",
            stt_model_id=stt_model_id,
            llm_model_id=llm_model_id,
            segments=segments,
            records=records,
            rejected_events=rejected_events_from_segments(segments),
        )
    )


def _call_gemma4_parser(
    *,
    profile_id: UUID,
    transcript: str,
    normalized_text: str,
    stt_model_id: str,
    llm_model_id: str,
    occurred_at: datetime | None,
) -> ParsePreviewResponse:
    settings = get_settings()
    if not settings.gemma4_parser_url:
        raise LocalParserUnavailableError(
            "GEMMA4_PARSER_URL is not configured. Start a local OpenAI-compatible Gemma server "
            "and set GEMMA4_PARSER_URL, for example http://host.docker.internal:11434/v1/chat/completions."
        )

    return _call_openai_compatible_local_parser(
        profile_id=profile_id,
        transcript=transcript,
        normalized_text=normalized_text,
        stt_model_id=stt_model_id,
        llm_model_id=llm_model_id,
        occurred_at=occurred_at,
        parser_url=settings.gemma4_parser_url,
        model_id=settings.gemma4_model_id,
        timeout_seconds=settings.gemma4_timeout_seconds,
    )


def _call_deepseek_parser(
    *,
    profile_id: UUID,
    transcript: str,
    normalized_text: str,
    stt_model_id: str,
    llm_model_id: str,
    occurred_at: datetime | None,
) -> ParsePreviewResponse:
    settings = get_settings()
    if not settings.deepseek_parser_url or not settings.deepseek_api_key:
        raise LocalParserUnavailableError(
            "DEEPSEEK_PARSER_URL and DEEPSEEK_API_KEY must be configured to use DeepSeek."
        )

    return _call_openai_compatible_local_parser(
        profile_id=profile_id,
        transcript=transcript,
        normalized_text=normalized_text,
        stt_model_id=stt_model_id,
        llm_model_id=llm_model_id,
        occurred_at=occurred_at,
        parser_url=settings.deepseek_parser_url,
        model_id=settings.deepseek_model_id,
        timeout_seconds=settings.local_llm_timeout_seconds,
        headers={"Authorization": f"Bearer {settings.deepseek_api_key}"},
    )


def _call_ollama_parser(
    *,
    profile_id: UUID,
    transcript: str,
    normalized_text: str,
    stt_model_id: str,
    llm_model_id: str,
    occurred_at: datetime | None,
) -> ParsePreviewResponse:
    settings = get_settings()
    model_id_by_option = {
        OLLAMA_QWEN25_LLM_MODEL_ID: settings.ollama_qwen25_model_id,
        OLLAMA_GEMMA3_LLM_MODEL_ID: settings.ollama_gemma3_model_id,
        OLLAMA_LLAMA32_LLM_MODEL_ID: settings.ollama_llama32_model_id,
    }
    return _call_ollama_structured_parser(
        profile_id=profile_id,
        transcript=transcript,
        normalized_text=normalized_text,
        stt_model_id=stt_model_id,
        llm_model_id=llm_model_id,
        occurred_at=occurred_at,
        parser_url=settings.ollama_chat_url,
        model_id=model_id_by_option[llm_model_id],
        timeout_seconds=settings.local_llm_timeout_seconds,
    )


def stream_local_parser_debug(
    *,
    profile_id: UUID,
    transcript: str,
    stt_model_id: str,
    llm_model_id: str,
    occurred_at: datetime | None,
) -> Iterator[str]:
    if llm_model_id not in {
        OLLAMA_QWEN25_LLM_MODEL_ID,
        OLLAMA_GEMMA3_LLM_MODEL_ID,
        OLLAMA_LLAMA32_LLM_MODEL_ID,
    }:
        yield "Streaming debug is only available for Ollama local LLM models."
        return

    settings = get_settings()
    model_id_by_option = {
        OLLAMA_QWEN25_LLM_MODEL_ID: settings.ollama_qwen25_model_id,
        OLLAMA_GEMMA3_LLM_MODEL_ID: settings.ollama_gemma3_model_id,
        OLLAMA_LLAMA32_LLM_MODEL_ID: settings.ollama_llama32_model_id,
    }
    prompt_segments = segment_transcript(normalize_transcript(transcript))[:LOCAL_LLM_SEGMENT_BATCH_SIZE]
    prompt = _local_parser_prompt(
        profile_id=profile_id,
        transcript=transcript,
        segments=prompt_segments,
        occurred_at=occurred_at or datetime.now(UTC),
        stt_model_id=stt_model_id,
        llm_model_id=llm_model_id,
    )
    body = _ollama_structured_request_body(
        model_id=model_id_by_option[llm_model_id],
        prompt=prompt,
        max_tokens=_local_llm_max_tokens_for_segments(
            segment_count=len(prompt_segments),
            configured_max=settings.local_llm_max_tokens,
        ),
        keep_alive=settings.local_llm_keep_alive,
        stream=True,
    )

    try:
        streamed_content = ""
        emitted_chars = 0
        with httpx.Client(timeout=None) as client:
            with client.stream("POST", settings.ollama_chat_url, json=body) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if not line:
                        continue
                    if len(line) > LOCAL_LLM_STREAM_LINE_CHAR_BUDGET:
                        yield "\n[local parser stream error: stream line exceeded safe size]\n"
                        return
                    data = line.removeprefix("data: ").strip()
                    if data == "[DONE]":
                        break
                    try:
                        payload = json.loads(data)
                    except json.JSONDecodeError:
                        continue
                    content = _extract_stream_content(payload)
                    if content:
                        streamed_content = f"{streamed_content}{content}"
                        if len(streamed_content) > LOCAL_LLM_RESPONSE_CHAR_BUDGET:
                            yield "\n[local parser stream error: response exceeded safe size]\n"
                            return
                        first_json = _first_complete_json_object(streamed_content)
                        if first_json is not None:
                            if len(first_json) > emitted_chars:
                                yield first_json[emitted_chars:]
                            break
                        yield content
                        emitted_chars += len(content)
    except httpx.HTTPError:
        yield "\n[local parser stream error: local parser request failed]\n"


def _first_complete_json_object(content: str) -> str | None:
    start = content.find("{")
    if start == -1:
        return None

    depth = 0
    in_string = False
    escaped = False
    for index in range(start, len(content)):
        char = content[index]
        if escaped:
            escaped = False
            continue
        if char == "\\":
            escaped = True
            continue
        if char == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return content[start : index + 1]
    return None


def _extract_stream_content(payload: object) -> str:
    if not isinstance(payload, dict):
        return ""
    message = payload.get("message")
    if isinstance(message, dict):
        content = message.get("content")
        return content if isinstance(content, str) else ""
    choices = payload.get("choices")
    if not isinstance(choices, list) or not choices:
        return ""
    first_choice = choices[0]
    if not isinstance(first_choice, dict):
        return ""
    delta = first_choice.get("delta")
    if isinstance(delta, dict):
        content = delta.get("content")
        return content if isinstance(content, str) else ""
    message = first_choice.get("message")
    if isinstance(message, dict):
        content = message.get("content")
        return content if isinstance(content, str) else ""
    text = first_choice.get("text")
    return text if isinstance(text, str) else ""


def _segment_batches(
    segments: list[TranscriptSegment], batch_size: int = LOCAL_LLM_SEGMENT_BATCH_SIZE
) -> list[list[TranscriptSegment]]:
    return [segments[index : index + batch_size] for index in range(0, len(segments), batch_size)]


def _local_llm_max_tokens_for_segments(*, segment_count: int, configured_max: int) -> int:
    requested_tokens = LOCAL_LLM_BATCH_MIN_TOKENS + (
        max(segment_count, 1) - 1
    ) * LOCAL_LLM_TOKENS_PER_EXTRA_SEGMENT
    return min(configured_max, LOCAL_LLM_BATCH_MAX_TOKENS, requested_tokens)


def _local_parser_request_body(
    *,
    model_id: str,
    llm_model_id: str,
    prompt: str,
    max_tokens: int,
    keep_alive: str | None,
    stream: bool,
) -> dict[str, object]:
    body: dict[str, object] = {
        "model": model_id,
        "messages": [
            {
                "role": "system",
                "content": _local_parser_system_prompt(llm_model_id=llm_model_id),
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0,
        "max_tokens": max_tokens,
        "response_format": {"type": "json_object"},
        "stream": stream,
    }
    if keep_alive is not None:
        body["keep_alive"] = keep_alive
    return body


def _local_parser_system_prompt(*, llm_model_id: str) -> str:
    base = (
        "You are a health record parser. Return compact JSON only. "
        "Use segment_id. Do not repeat transcript text. "
        "Do not provide medical advice. Do not guess missing values."
    )
    if llm_model_id == DEEPSEEK_LLM_MODEL_ID:
        settings = get_settings()
        deepseek_prompt = settings.deepseek_system_prompt or DEEPSEEK_SYSTEM_PROMPT
        deepseek_addendum = settings.deepseek_analysis_addendum or DEEPSEEK_ANALYSIS_ADDENDUM
        return f"{deepseek_prompt}\n{deepseek_addendum}\n{base}"
    return base


def _compact_ir_json_schema() -> dict[str, object]:
    return {
        "type": "object",
        "properties": {
            "records": {
                "type": "array",
                "maxItems": COMPACT_IR_MAX_RECORDS_PER_BATCH,
                "items": {
                    "type": "object",
                    "properties": {
                        "type": {
                            "type": "string",
                            "enum": ["glucose", "meal", "exercise", "medication", "note"],
                        },
                        "segment_id": {"type": "string", "maxLength": COMPACT_IR_MAX_SHORT_TEXT_CHARS},
                        "value": {"type": ["number", "null"]},
                        "unit": {
                            "type": ["string", "null"],
                            "maxLength": COMPACT_IR_MAX_SHORT_TEXT_CHARS,
                        },
                        "meal_timing": {
                            "type": "string",
                            "enum": [
                                "fasting",
                                "before_meal",
                                "after_meal",
                                "bedtime",
                                "unknown",
                            ],
                        },
                        "time_hint": {
                            "type": "string",
                            "enum": ["am", "noon", "pm", "eve", "night", "unknown"],
                        },
                        "items": {
                            "type": "array",
                            "maxItems": COMPACT_IR_MAX_ITEMS_PER_RECORD,
                            "items": {
                                "type": "string",
                                "maxLength": COMPACT_IR_MAX_SHORT_TEXT_CHARS,
                            },
                        },
                        "duration_min": {"type": ["integer", "null"]},
                        "confidence": {"type": "number"},
                        "flags": {
                            "type": "array",
                            "maxItems": COMPACT_IR_MAX_FLAGS_PER_RECORD,
                            "items": {
                                "type": "string",
                                "maxLength": COMPACT_IR_MAX_SHORT_TEXT_CHARS,
                            },
                        },
                        "evidence": {"type": "string", "maxLength": COMPACT_IR_MAX_EVIDENCE_CHARS},
                    },
                    "required": ["type"],
                },
            },
            "rejected": {
                "type": "array",
                "maxItems": COMPACT_IR_MAX_REJECTED_PER_BATCH,
                "items": {
                    "type": "object",
                    "properties": {
                        "type": {"type": "string", "enum": ["negative_event"]},
                        "segment_id": {"type": "string", "maxLength": COMPACT_IR_MAX_SHORT_TEXT_CHARS},
                        "evidence": {"type": "string", "maxLength": COMPACT_IR_MAX_EVIDENCE_CHARS},
                    },
                    "required": ["type"],
                },
            },
            "needs_confirmation": {"type": "boolean"},
        },
        "required": ["records", "rejected", "needs_confirmation"],
    }


def _ollama_structured_request_body(
    *,
    model_id: str,
    prompt: str,
    max_tokens: int,
    keep_alive: str,
    stream: bool,
) -> dict[str, object]:
    return {
        "model": model_id,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a health record parser. Return compact JSON only. "
                    "Use segment_id. Do not repeat transcript text. "
                    "Do not provide medical advice. Do not guess missing values."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        "format": _compact_ir_json_schema(),
        "options": {"temperature": 0, "num_predict": max_tokens},
        "keep_alive": keep_alive,
        "stream": stream,
    }


def _request_local_parser_json(
    *,
    parser_url: str,
    body: dict[str, object],
    timeout_seconds: float,
    batch_number: int,
    headers: dict[str, str] | None = None,
) -> object:
    try:
        with httpx.Client(timeout=timeout_seconds) as client:
            response_text = _read_bounded_local_parser_response_text(
                client=client,
                parser_url=parser_url,
                body=body,
                headers=headers,
                parser_name="Local parser",
            )
    except httpx.HTTPError as exc:
        raise LocalParserError(f"Local parser request failed on batch {batch_number}: {exc}") from exc
    try:
        payload = json.loads(response_text)
    except json.JSONDecodeError as exc:
        raise LocalParserError("Local parser returned non-JSON HTTP response") from exc

    content = _extract_openai_compatible_content(payload)
    validate_local_parser_response_size(content, parser_name="Local parser")
    try:
        json_candidate = _extract_json_object(content)
        return json.loads(json_candidate)
    except json.JSONDecodeError as exc:
        raise LocalParserError(
            f"Local parser batch {batch_number} returned invalid JSON. "
            + _json_decode_error_message(
                content=content,
                candidate=json_candidate if "json_candidate" in locals() else content,
                exc=exc,
            )
        ) from exc


def _request_ollama_structured_json(
    *,
    parser_url: str,
    body: dict[str, object],
    timeout_seconds: float,
    batch_number: int,
) -> object:
    try:
        with httpx.Client(timeout=timeout_seconds) as client:
            response_text = _read_bounded_local_parser_response_text(
                client=client,
                parser_url=parser_url,
                body=body,
                parser_name="Ollama structured parser",
            )
    except httpx.HTTPError as exc:
        raise LocalParserError(f"Ollama structured request failed on batch {batch_number}: {exc}") from exc
    try:
        payload = json.loads(response_text)
    except json.JSONDecodeError as exc:
        raise LocalParserError("Ollama returned non-JSON HTTP response") from exc

    content = _extract_ollama_chat_content(payload)
    validate_local_parser_response_size(content, parser_name="Ollama structured parser")
    try:
        json_candidate = _extract_json_object(content)
        return json.loads(json_candidate)
    except json.JSONDecodeError as exc:
        raise LocalParserError(
            f"Ollama structured batch {batch_number} returned invalid JSON. "
            + _json_decode_error_message(
                content=content,
                candidate=json_candidate if "json_candidate" in locals() else content,
                exc=exc,
            )
        ) from exc


def _extract_ollama_chat_content(payload: object) -> str:
    if not isinstance(payload, dict):
        raise LocalParserError("Ollama response must be a JSON object")
    message = payload.get("message")
    if isinstance(message, dict):
        content = message.get("content")
        if isinstance(content, str):
            return content
    response = payload.get("response")
    if isinstance(response, str):
        return response
    raise LocalParserError("Ollama response missing message content")


def _read_bounded_local_parser_response_text(
    *,
    client: httpx.Client,
    parser_url: str,
    body: dict[str, object],
    headers: dict[str, str] | None = None,
    parser_name: str,
) -> str:
    chunks: list[str] = []
    total_chars = 0
    stream_kwargs: dict[str, object] = {"json": body}
    if headers is not None:
        stream_kwargs["headers"] = headers
    with client.stream("POST", parser_url, **stream_kwargs) as response:
        response.raise_for_status()
        for chunk in response.iter_text():
            if not chunk:
                continue
            total_chars += len(chunk)
            if total_chars > LOCAL_LLM_HTTP_RESPONSE_CHAR_BUDGET:
                raise LocalParserError(
                    f"{parser_name} HTTP response exceeded safe size. "
                    f"Limit: {LOCAL_LLM_HTTP_RESPONSE_CHAR_BUDGET} chars. "
                    "Content omitted for PHI safety."
                )
            chunks.append(chunk)
    return "".join(chunks)


def _call_openai_compatible_local_parser(
    *,
    profile_id: UUID,
    transcript: str,
    normalized_text: str,
    stt_model_id: str,
    llm_model_id: str,
    occurred_at: datetime | None,
    parser_url: str,
    model_id: str,
    timeout_seconds: float,
    headers: dict[str, str] | None = None,
) -> ParsePreviewResponse:
    settings = get_settings()
    segments = segment_transcript(normalized_text)
    parser_irs: list[CompactParserIr] = []

    try:
        for batch_number, segment_batch in enumerate(_segment_batches(segments), start=1):
            prompt = _local_parser_prompt(
                profile_id=profile_id,
                transcript=transcript,
                segments=segment_batch,
                occurred_at=occurred_at or datetime.now(UTC),
                stt_model_id=stt_model_id,
                llm_model_id=llm_model_id,
            )
            body = _local_parser_request_body(
                model_id=model_id,
                llm_model_id=llm_model_id,
                prompt=prompt,
                max_tokens=_local_llm_max_tokens_for_segments(
                    segment_count=len(segment_batch),
                    configured_max=settings.local_llm_max_tokens,
                ),
                keep_alive=None if llm_model_id == DEEPSEEK_LLM_MODEL_ID else settings.local_llm_keep_alive,
                stream=False,
            )
            parsed = _request_local_parser_json(
                parser_url=parser_url,
                body=body,
                timeout_seconds=timeout_seconds,
                batch_number=batch_number,
                headers=headers,
            )
            compact_candidate = _normalize_compact_ir_candidate(
                parsed,
                normalized_text,
                segments=segment_batch,
            )
            parser_irs.append(CompactParserIr.model_validate(compact_candidate))
    except (LocalParserError, ValidationError) as exc:
        if settings.local_llm_repair_fallback_enabled:
            return _build_deterministic_parse_preview(
                profile_id=profile_id,
                transcript=transcript,
                normalized_text=normalized_text,
                stt_model_id=stt_model_id,
                llm_model_id=llm_model_id,
                occurred_at=occurred_at,
                parser_repair_reason="local_llm_batch_parse_fallback",
            )
        if isinstance(exc, ValidationError):
            raise LocalParserError(
                _compact_ir_validation_error_message(
                    exc=exc,
                    parsed=compact_candidate if "compact_candidate" in locals() else {},
                )
            ) from exc
        raise

    parser_ir = CompactParserIr(
        records=_dedupe_compact_ir_records(
            [record for parser_ir in parser_irs for record in parser_ir.records]
        ),
        rejected=[rejected for parser_ir in parser_irs for rejected in parser_ir.rejected],
        needs_confirmation=True,
    )
    preview = compact_ir_to_parse_preview(
        profile_id=profile_id,
        transcript=transcript,
        normalized_text=normalized_text,
        stt_model_id=stt_model_id,
        llm_model_id=llm_model_id,
        occurred_at=occurred_at,
        parser_ir=parser_ir,
    )
    if not preview.records and not preview.rejected_events:
        if not settings.local_llm_repair_fallback_enabled:
            raise LocalParserError("Local parser returned no records")
        return _build_deterministic_parse_preview(
            profile_id=profile_id,
            transcript=transcript,
            normalized_text=normalized_text,
            stt_model_id=stt_model_id,
            llm_model_id=llm_model_id,
            occurred_at=occurred_at,
            parser_repair_reason="empty_ir_fallback",
        )
    return preview


def _call_ollama_structured_parser(
    *,
    profile_id: UUID,
    transcript: str,
    normalized_text: str,
    stt_model_id: str,
    llm_model_id: str,
    occurred_at: datetime | None,
    parser_url: str,
    model_id: str,
    timeout_seconds: float,
) -> ParsePreviewResponse:
    settings = get_settings()
    segments = segment_transcript(normalized_text)
    parser_irs: list[CompactParserIr] = []

    try:
        for batch_number, segment_batch in enumerate(_segment_batches(segments), start=1):
            prompt = _local_parser_prompt(
                profile_id=profile_id,
                transcript=transcript,
                segments=segment_batch,
                occurred_at=occurred_at or datetime.now(UTC),
                stt_model_id=stt_model_id,
                llm_model_id=llm_model_id,
            )
            body = _ollama_structured_request_body(
                model_id=model_id,
                prompt=prompt,
                max_tokens=_local_llm_max_tokens_for_segments(
                    segment_count=len(segment_batch),
                    configured_max=settings.local_llm_max_tokens,
                ),
                keep_alive=settings.local_llm_keep_alive,
                stream=False,
            )
            parsed = _request_ollama_structured_json(
                parser_url=parser_url,
                body=body,
                timeout_seconds=timeout_seconds,
                batch_number=batch_number,
            )
            compact_candidate = _normalize_compact_ir_candidate(
                parsed,
                normalized_text,
                segments=segment_batch,
            )
            parser_irs.append(CompactParserIr.model_validate(compact_candidate))
    except (LocalParserError, ValidationError) as exc:
        if settings.local_llm_repair_fallback_enabled:
            return _build_deterministic_parse_preview(
                profile_id=profile_id,
                transcript=transcript,
                normalized_text=normalized_text,
                stt_model_id=stt_model_id,
                llm_model_id=llm_model_id,
                occurred_at=occurred_at,
                parser_repair_reason="ollama_structured_parse_fallback",
            )
        if isinstance(exc, ValidationError):
            raise LocalParserError(
                _compact_ir_validation_error_message(
                    exc=exc,
                    parsed=compact_candidate if "compact_candidate" in locals() else {},
                )
            ) from exc
        raise

    parser_ir = CompactParserIr(
        records=_dedupe_compact_ir_records(
            [record for parser_ir in parser_irs for record in parser_ir.records]
        ),
        rejected=[rejected for parser_ir in parser_irs for rejected in parser_ir.rejected],
        needs_confirmation=True,
    )
    preview = compact_ir_to_parse_preview(
        profile_id=profile_id,
        transcript=transcript,
        normalized_text=normalized_text,
        stt_model_id=stt_model_id,
        llm_model_id=llm_model_id,
        occurred_at=occurred_at,
        parser_ir=parser_ir,
    )
    if not preview.records and not preview.rejected_events:
        if not settings.local_llm_repair_fallback_enabled:
            raise LocalParserError("Ollama structured parser returned no records")
        return _build_deterministic_parse_preview(
            profile_id=profile_id,
            transcript=transcript,
            normalized_text=normalized_text,
            stt_model_id=stt_model_id,
            llm_model_id=llm_model_id,
            occurred_at=occurred_at,
            parser_repair_reason="empty_ollama_structured_ir_fallback",
        )
    return preview


def _extract_openai_compatible_content(payload: object) -> str:
    if not isinstance(payload, dict):
        raise LocalParserError("Local parser response must be a JSON object")

    direct_content = payload.get("content")
    if isinstance(direct_content, str):
        return direct_content

    choices = payload.get("choices")
    if not isinstance(choices, list) or not choices:
        raise LocalParserError("Local parser response missing choices")

    first_choice = choices[0]
    if not isinstance(first_choice, dict):
        raise LocalParserError("Local parser choice must be an object")

    message = first_choice.get("message")
    if isinstance(message, dict):
        content = message.get("content")
        if isinstance(content, str):
            return content

    text = first_choice.get("text")
    if isinstance(text, str):
        return text

    raise LocalParserError("Local parser response missing message content")


def _extract_json_object(content: str) -> str:
    stripped = content.strip()
    if stripped.startswith("```"):
        stripped = re.sub(r"^```(?:json)?", "", stripped).strip()
        stripped = re.sub(r"```$", "", stripped).strip()

    start = stripped.find("{")
    end = stripped.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return stripped
    return stripped[start : end + 1]


def _json_decode_error_message(*, content: str, candidate: str, exc: json.JSONDecodeError) -> str:
    return (
        "Local parser content was not valid JSON. "
        f"Reason: {exc.msg} at line {exc.lineno}, column {exc.colno}, char {exc.pos}. "
        f"Extracted candidate length: {len(candidate)} chars. "
        f"Raw content length: {len(content)} chars. "
        "Content omitted for PHI safety."
    )


def validate_local_parser_response_size(content: str, *, parser_name: str) -> None:
    if len(content) <= LOCAL_LLM_RESPONSE_CHAR_BUDGET:
        return
    raise LocalParserError(
        f"{parser_name} response exceeded safe size. "
        f"Content length: {len(content)} chars. "
        f"Limit: {LOCAL_LLM_RESPONSE_CHAR_BUDGET} chars. "
        "Content omitted for PHI safety."
    )


def _schema_validation_error_message(exc: ValidationError) -> str:
    errors: list[str] = []
    for error in exc.errors()[:8]:
        location = ".".join(str(part) for part in error.get("loc", ()))
        message = str(error.get("msg", "invalid"))
        errors.append(f"{location}: {message}" if location else message)
    suffix = "" if len(exc.errors()) <= 8 else f"; ... {len(exc.errors()) - 8} more errors"
    return f"Local parser content failed schema validation. Problems: {'; '.join(errors)}{suffix}"


def _compact_ir_validation_error_message(*, exc: ValidationError, parsed: object) -> str:
    message = _schema_validation_error_message(exc)
    parsed_length = len(json.dumps(parsed, ensure_ascii=False, default=str))
    return (
        f"{message}. Expected compact IR shape: "
        '{"records":[...],"rejected":[{"type":"negative_event","evidence":"..."}],'
        '"needs_confirmation":true}. '
        f"Parsed content length: {parsed_length} chars. Content omitted for PHI safety."
    )


def _local_parser_prompt(
    *,
    profile_id: UUID,
    transcript: str,
    segments: list[TranscriptSegment],
    occurred_at: datetime,
    stt_model_id: str,
    llm_model_id: str,
) -> str:
    segment_lines = _bounded_prompt_segment_lines(segments)
    return f"""
You are a health record parser.

Rules:
- Output JSON only. No markdown. No comments.
- Top-level keys must be exactly: records, rejected, needs_confirmation.
- records must be an array.
- rejected must be an array.
- needs_confirmation must be true.
- Never output needs_confirmation false.
- Each record must be one atomic event only.
- type must be exactly one of: glucose, meal, exercise, medication, note.
- Prefer omitting non-health comments instead of outputting note.
- Never use a "text" key.
- Prefer segment_id over evidence. Backend will map segment_id back to original words.
- Never output values like "glucose | meal" or "glucose | meal | exercise".
- meal_timing must be exactly one of: fasting, before_meal, after_meal, bedtime, unknown.
- time_hint must be exactly one of: am, noon, pm, eve, night, unknown.
- Every record should include segment_id from the Atomic segments list.
- If segment_id cannot be used, evidence must copy one exact atomic segment.
- Some atomic segment text may be shortened for token budget. Prefer segment_id instead of evidence.
- Do not output long evidence.
- Do not output the full transcript as evidence.
- Do not translate, normalize, simplify, or rewrite evidence.
- Keep Traditional Chinese exactly when the transcript uses Traditional Chinese.
- Never output placeholder evidence such as "exact user words".
- Every glucose number must become one glucose record.
- A glucose record must include value as a number.
- Food and drinks such as coffee, latte, milk tea, rice, noodles, bread, or snacks must become meal records.
- A meal record must include items.
- Do not output note for glucose, food, drinks, exercise, medication, lab tests, or hospital events.
- Use note only when the phrase cannot fit any structured type.
- Scan the transcript from start to end. Do not stop after the first few events.
- Do not copy examples or invent foods, activities, values, or evidence not present in the transcript.
- If the transcript contains "血糖", "量", "升到", "降到", or "再量" near a number, output a glucose record.
- If the transcript contains "吃", "喝", "買了一瓶", "午餐", "晚餐", "早餐", "嘴饞", or "點心", output a meal record.
- If the transcript contains "散步", "伸展", "運動", "走路", "跑步", "騎車", or "游泳", output an exercise record.
- An exercise record must include items with the explicit activity, such as ["散步"] or ["走路"].
- An exercise record should include duration_min when a duration is present.
- If the transcript contains "藥", "吃藥", "降血糖藥", or medication names, output a medication record.
- A medication record must use type medication, not note.
- If user explicitly says did not measure, put it in rejected and do not create a record.
- If there is no explicit did-not-measure phrase, rejected must be [].
- Every rejected item must be an object with type "negative_event" and segment_id.
- Never output rejected as strings like "did not measure".
- Omit keys that do not apply.
- Do not include profile_id, timestamps, model ids, metadata, or explanations.
- Do not repeat the same record.
- Stop after producing records for the provided Atomic segments only.

Atomic segments:
{segment_lines}

Expected shape:
{{"records":[{{"type":"glucose","segment_id":"seg_001","value":112}}],"rejected":[],"needs_confirmation":true}}
""".strip()


def _bounded_prompt_segment_lines(
    segments: list[TranscriptSegment],
    *,
    per_segment_limit: int = LOCAL_LLM_PROMPT_SEGMENT_CHAR_LIMIT,
    total_char_budget: int = LOCAL_LLM_PROMPT_SEGMENTS_CHAR_BUDGET,
) -> str:
    lines: list[str] = []
    used_chars = 0
    for segment in segments[:LOCAL_LLM_SEGMENT_BATCH_SIZE]:
        remaining = total_char_budget - used_chars
        if remaining <= 0:
            break
        source_text = _truncate_prompt_segment_text(
            segment.source_text,
            limit=min(per_segment_limit, remaining),
        )
        line = f"- {segment.segment_id}: {source_text}"
        lines.append(line)
        used_chars += len(source_text)
    return "\n".join(lines)


def _truncate_prompt_segment_text(value: str, *, limit: int) -> str:
    normalized = re.sub(r"\s+", " ", value).strip()
    if limit <= 1:
        return "…"
    if len(normalized) <= limit:
        return normalized
    head_chars = (limit - 1) // 2
    tail_chars = limit - 1 - head_chars
    return f"{normalized[:head_chars]}…{normalized[-tail_chars:]}"


def _record(
    *,
    profile_id: UUID,
    record_type: RecordType,
    occurred_at: datetime,
    payload_json: dict[str, object],
    transcript: str,
    source_text: str,
    stt_model_id: str,
    llm_model_id: str,
    confidence: float,
    decision_trace: str,
) -> ParsedRecordPreview:
    return ParsedRecordPreview(
        profile_id=profile_id,
        record_type=record_type,
        occurred_at=occurred_at,
        payload_json=payload_json,
        metadata_json=_metadata(
            transcript,
            stt_model_id,
            llm_model_id,
            source_text=source_text,
            time_hint=_time_hint(source_text),
        ),
        source="ai_parse_preview",
        confidence=_confidence(llm_model_id, confidence),
        decision_trace=decision_trace,
    )


def parse_transcript_to_records(
    *,
    profile_id: UUID,
    transcript: str,
    stt_model_id: str,
    llm_model_id: str,
    occurred_at: datetime | None,
) -> list[ParsedRecordPreview]:
    normalized = normalize_transcript(transcript)
    record_time = occurred_at or datetime.now(UTC)
    records: list[ParsedRecordPreview] = []
    clauses = _atomic_event_segments(normalized)

    previous_glucose_context = False
    for index, clause in enumerate(clauses):
        if any(keyword in clause for keyword in ("沒量血糖", "沒再量")):
            previous_glucose_context = False
            continue

        glucose_values = _numbers_after_keywords(clause, ("血糖", "空腹", "飯前", "飯後", "睡前"))
        if not glucose_values and any(keyword in clause for keyword in ("又量", "再量", "又測", "再測")):
            glucose_values = _number_values(clause)

        if glucose_values and (
            any(keyword in clause for keyword in ("血糖", "空腹", "飯前", "飯後", "睡前"))
            or previous_glucose_context
            or any(keyword in clause for keyword in ("又量", "再量", "又測", "再測"))
        ):
            source_text = clause
            for value in glucose_values:
                records.append(
                    _record(
                        profile_id=profile_id,
                        record_type="glucose",
                        occurred_at=record_time,
                        payload_json={
                            "value": value,
                            "unit": "mg/dL",
                            "meal_timing": _meal_timing(clause),
                            "context": _meal_type(clause) or "unknown",
                        },
                        transcript=normalized,
                        source_text=source_text,
                        stt_model_id=stt_model_id,
                        llm_model_id=llm_model_id,
                        confidence=0.56 if _meal_timing(clause) == "unknown" else 0.82,
                        decision_trace="偵測到血糖情境與數值，建立 glucose 候選紀錄。",
                    )
                )
                if len(records) >= MAX_PARSE_PREVIEW_RECORDS:
                    return records
            previous_glucose_context = True
            continue

        previous_glucose_context = False

    for clause in clauses:
        if not any(keyword in clause for keyword in ("早餐", "午餐", "中午", "點心", "晚餐", "吃", "喝")):
            continue
        food_items = _food_items(clause)
        if not food_items:
            continue
        records.append(
            _record(
                profile_id=profile_id,
                record_type="meal",
                occurred_at=record_time,
                payload_json={
                    "meal_type": _meal_type(clause) or "unknown",
                    "food_items": food_items,
                },
                transcript=normalized,
                source_text=clause,
                stt_model_id=stt_model_id,
                llm_model_id=llm_model_id,
                confidence=0.68,
                decision_trace="偵測到飲食關鍵語意，建立 meal 候選紀錄。",
            )
        )
        if len(records) >= MAX_PARSE_PREVIEW_RECORDS:
            return records

    for index, clause in enumerate(clauses):
        if not any(keyword in clause for keyword in ("走路", "運動", "跑步", "騎車", "游泳")):
            continue
        next_clause = clauses[index + 1] if index + 1 < len(clauses) else ""
        source_text = clause
        minutes = _minutes(clause)
        if minutes is None and _minutes(next_clause) is not None:
            source_text = f"{clause}，{next_clause}"
            minutes = _minutes(source_text)
        records.append(
            _record(
                profile_id=profile_id,
                record_type="exercise",
                occurred_at=record_time,
                payload_json={
                    "activity": "走路" if "走路" in source_text else "運動",
                    "minutes": minutes,
                },
                transcript=normalized,
                source_text=source_text,
                stt_model_id=stt_model_id,
                llm_model_id=llm_model_id,
                confidence=0.7,
                decision_trace="偵測到運動語意，建立 exercise 候選紀錄。",
            )
        )
        if len(records) >= MAX_PARSE_PREVIEW_RECORDS:
            return records

    if any(keyword in normalized for keyword in ("藥", "用藥", "吃藥", "胰島素", "metformin")):
        records.append(
            _record(
                profile_id=profile_id,
                record_type="medication",
                occurred_at=record_time,
                payload_json={
                    "name": "unknown",
                    "taken": True,
                },
                transcript=normalized,
                source_text=normalized,
                stt_model_id=stt_model_id,
                llm_model_id=llm_model_id,
                confidence=0.62,
                decision_trace="偵測到用藥語意，建立 medication 候選紀錄。",
            )
        )
        if len(records) >= MAX_PARSE_PREVIEW_RECORDS:
            return records

    if any(keyword in normalized for keyword in ("血壓", "收縮壓", "舒張壓")):
        numbers = _numbers_after_keywords(normalized, ("血壓", "收縮壓", "舒張壓"))
        if len(numbers) >= 2:
            records.append(
                _record(
                    profile_id=profile_id,
                    record_type="vital",
                    occurred_at=record_time,
                    payload_json={
                        "kind": "blood_pressure",
                        "systolic": numbers[0],
                        "diastolic": numbers[1],
                        "unit": "mmHg",
                    },
                    transcript=normalized,
                    source_text=normalized,
                    stt_model_id=stt_model_id,
                    llm_model_id=llm_model_id,
                    confidence=0.66,
                    decision_trace="偵測到血壓語意，建立 vital 候選紀錄。",
                )
            )
            if len(records) >= MAX_PARSE_PREVIEW_RECORDS:
                return records

    if any(keyword in normalized for keyword in ("體重", "公斤", "kg", "體脂")):
        kind = "body_fat" if "體脂" in normalized else "weight"
        measurement_value = _body_measurement_value(normalized, kind)
        if measurement_value is not None:
            records.append(
                _record(
                    profile_id=profile_id,
                    record_type="body_measurement",
                    occurred_at=record_time,
                    payload_json={
                        "kind": kind,
                        "value": measurement_value,
                        "unit": "%" if kind == "body_fat" else "kg",
                    },
                    transcript=normalized,
                    source_text=normalized,
                    stt_model_id=stt_model_id,
                    llm_model_id=llm_model_id,
                    confidence=0.64,
                    decision_trace="偵測到身體量測語意，建立 body_measurement 候選紀錄。",
                )
            )
            if len(records) >= MAX_PARSE_PREVIEW_RECORDS:
                return records

    return records


def _navigation_target(text: str) -> str | None:
    if any(keyword in text for keyword in ("報告", "回診摘要")):
        return "report"
    if any(keyword in text for keyword in ("趨勢", "圖表")):
        return "trend"
    if any(keyword in text for keyword in ("首頁", "回家")):
        return "home"
    return None


def build_command_proposal(
    *,
    profile_id: UUID,
    transcript: str,
    stt_model_id: str,
    llm_model_id: str,
    occurred_at: datetime | None,
) -> ActionProposal:
    normalized = transcript.strip()
    navigation_target = _navigation_target(normalized)

    if any(keyword in normalized for keyword in ("產生報告", "生成報告", "30 天報告", "三十天報告")):
        return ActionProposal(
            intent="GENERATE_REPORT",
            action="show_basic_report",
            actions=[
                ProposedAction(
                    action_type="show_basic_report",
                    payload={
                        "profile_id": str(profile_id),
                        "report_type": "basic",
                        "range_days": 30 if "30" in normalized or "三十" in normalized else None,
                    },
                )
            ],
            payload={
                "profile_id": str(profile_id),
                "report_type": "basic",
                "range_days": 30 if "30" in normalized or "三十" in normalized else None,
            },
            requires_confirmation=False,
            confidence=_confidence(llm_model_id, 0.78),
            decision_trace="偵測到產生報告語意，建立 show_basic_report action proposal。",
            ui_response=UiResponse(
                type="report",
                message="我會打開目前對象的基本報告。",
                target="report",
            ),
        )

    if navigation_target is not None and any(
        keyword in normalized for keyword in ("去", "打開", "回", "看", "顯示")
    ):
        return ActionProposal(
            intent="NAVIGATE",
            action="navigate",
            actions=[ProposedAction(action_type="navigate", payload={"target": navigation_target})],
            payload={"target": navigation_target},
            requires_confirmation=False,
            confidence=_confidence(llm_model_id, 0.74),
            decision_trace="偵測到導航語意，建立 navigate action proposal。",
            ui_response=UiResponse(
                type="navigate",
                message=f"我會切換到 {navigation_target}。",
                target=navigation_target,
            ),
        )

    if llm_model_id in {
        GEMMA4_LLM_MODEL_ID,
        DEEPSEEK_LLM_MODEL_ID,
        OLLAMA_QWEN25_LLM_MODEL_ID,
        OLLAMA_GEMMA3_LLM_MODEL_ID,
        OLLAMA_LLAMA32_LLM_MODEL_ID,
    }:
        record_candidates = build_parse_preview(
            profile_id=profile_id,
            transcript=normalized,
            stt_model_id=stt_model_id,
            llm_model_id=llm_model_id,
            occurred_at=occurred_at,
        ).records
    else:
        record_candidates = parse_transcript_to_records(
            profile_id=profile_id,
            transcript=normalized,
            stt_model_id=stt_model_id,
            llm_model_id=llm_model_id,
            occurred_at=occurred_at,
        )
        record_candidates, _ = storage_compatible_preview_records(record_candidates)
    if record_candidates and record_candidates[0].record_type != "note":
        record_actions = [
            ProposedAction(
                action_type="create_record",
                record_type=record.record_type,
                payload=record.payload_json,
                metadata_json=sanitize_record_metadata_for_storage(record.metadata_json),
            )
            for record in record_candidates
        ]
        return ActionProposal(
            intent="CREATE_RECORD",
            action="create_record_candidates",
            actions=record_actions,
            payload={"records": [sanitized_preview_record_dump(record) for record in record_candidates]},
            requires_confirmation=True,
            confidence=max(record.confidence for record in record_candidates),
            decision_trace="偵測到健康紀錄語意，只建立候選紀錄，不直接寫入資料庫。",
            ui_response=UiResponse(
                type="confirmation",
                message=f"我整理出 {len(record_candidates)} 筆候選紀錄，請確認後儲存。",
            ),
        )

    return ActionProposal(
        intent="UNKNOWN",
        action="show_message",
        actions=[
            ProposedAction(
                action_type="show_message",
                payload={"reason": "unknown_intent"},
            )
        ],
        payload={"reason": "unknown_intent"},
        requires_confirmation=False,
        confidence=_confidence(llm_model_id, 0.35),
        decision_trace="無法判斷明確操作，要求使用者改說或改用文字輸入。",
        ui_response=UiResponse(
            type="message",
            message="我還不確定要執行什麼操作，請換個方式說或用文字輸入。",
        ),
    )
