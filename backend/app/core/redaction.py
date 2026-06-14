from collections.abc import Mapping, Sequence
from typing import Any

REDACTED = "[REDACTED]"
REDACTION_TRUNCATED = "[TRUNCATED]"
MAX_REDACTION_DEPTH = 6
MAX_REDACTION_CONTAINER_LENGTH = 64
MAX_REDACTION_STRING_LENGTH = 512

SENSITIVE_KEYS = frozenset(
    {
        "access_token",
        "api_key",
        "audio",
        "authorization",
        "blood_glucose",
        "db_password",
        "food_items",
        "food_photo",
        "glucose_value",
        "image",
        "llm_prompt",
        "medical_note",
        "medication",
        "note",
        "openai_key",
        "password",
        "payload",
        "payload_json",
        "photo",
        "prompt",
        "refresh_token",
        "token",
        "transcript",
        "voice",
    }
)


def is_sensitive_key(key: str) -> bool:
    normalized = key.strip().lower().replace("-", "_")
    return normalized in SENSITIVE_KEYS


def redact_sensitive_data(
    value: Any,
    *,
    max_depth: int = MAX_REDACTION_DEPTH,
    max_container_length: int = MAX_REDACTION_CONTAINER_LENGTH,
    max_string_length: int = MAX_REDACTION_STRING_LENGTH,
) -> Any:
    if max_depth < 0:
        raise ValueError("max_depth must not be negative")
    if max_container_length < 1:
        raise ValueError("max_container_length must be positive")
    if max_string_length < 1:
        raise ValueError("max_string_length must be positive")
    return _redact_sensitive_data(
        value,
        depth=0,
        max_depth=max_depth,
        max_container_length=max_container_length,
        max_string_length=max_string_length,
    )


def _redact_sensitive_data(
    value: Any,
    *,
    depth: int,
    max_depth: int,
    max_container_length: int,
    max_string_length: int,
) -> Any:
    if depth >= max_depth:
        return REDACTION_TRUNCATED
    if isinstance(value, Mapping):
        redacted: dict[str, Any] = {}
        for index, (key, item) in enumerate(value.items()):
            if index >= max_container_length:
                redacted["_truncated"] = True
                break
            normalized_key = str(key)
            redacted[normalized_key] = (
                REDACTED
                if is_sensitive_key(normalized_key)
                else _redact_sensitive_data(
                    item,
                    depth=depth + 1,
                    max_depth=max_depth,
                    max_container_length=max_container_length,
                    max_string_length=max_string_length,
                )
            )
        return redacted
    if isinstance(value, str):
        return value[:max_string_length]
    if isinstance(value, Sequence):
        redacted_sequence = [
            _redact_sensitive_data(
                item,
                depth=depth + 1,
                max_depth=max_depth,
                max_container_length=max_container_length,
                max_string_length=max_string_length,
            )
            for item in value[:max_container_length]
        ]
        if len(value) > max_container_length:
            redacted_sequence.append(REDACTION_TRUNCATED)
        return redacted_sequence
    return value
