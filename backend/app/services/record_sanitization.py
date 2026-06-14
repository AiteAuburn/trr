from typing import Any

from app.services.record_json_bounds import (
    MAX_RECORD_JSON_CONTAINER_LENGTH,
    MAX_RECORD_JSON_DEPTH,
    MAX_RECORD_JSON_STRING_LENGTH,
)

RECORD_SANITIZATION_TRUNCATED = "[TRUNCATED]"

METADATA_TEXT_KEYS = {
    "transcript",
    "source_text",
    "raw_transcript",
    "raw_text",
    "original_text",
    "normalized_text",
}

PAYLOAD_TEXT_KEYS = METADATA_TEXT_KEYS | {
    "description",
    "text",
    "note",
    "notes",
    "free_text",
}


def _strip_keys(
    value: Any,
    blocked_keys: set[str],
    *,
    depth: int = 1,
    max_depth: int = MAX_RECORD_JSON_DEPTH,
    max_container_length: int = MAX_RECORD_JSON_CONTAINER_LENGTH,
    max_string_length: int = MAX_RECORD_JSON_STRING_LENGTH,
) -> Any:
    if depth > max_depth:
        return RECORD_SANITIZATION_TRUNCATED
    if isinstance(value, dict):
        sanitized: dict[str, Any] = {}
        for index, (key, item) in enumerate(value.items()):
            if index >= max_container_length:
                sanitized["_truncated"] = True
                break
            if key in blocked_keys:
                continue
            sanitized[key] = _strip_keys(
                item,
                blocked_keys,
                depth=depth + 1,
                max_depth=max_depth,
                max_container_length=max_container_length,
                max_string_length=max_string_length,
            )
        return sanitized
    if isinstance(value, list):
        sanitized_list = [
            _strip_keys(
                item,
                blocked_keys,
                depth=depth + 1,
                max_depth=max_depth,
                max_container_length=max_container_length,
                max_string_length=max_string_length,
            )
            for item in value[:max_container_length]
        ]
        if len(value) > max_container_length:
            sanitized_list.append(RECORD_SANITIZATION_TRUNCATED)
        return sanitized_list
    if isinstance(value, str):
        return value[:max_string_length]
    return value


def sanitize_record_payload_for_storage(
    record_type: str,
    payload_json: dict[str, Any],
) -> dict[str, Any]:
    _ = record_type
    sanitized = _strip_keys(payload_json, PAYLOAD_TEXT_KEYS)
    if not isinstance(sanitized, dict):
        return {}
    return sanitized


def sanitize_record_metadata_for_storage(metadata_json: dict[str, Any]) -> dict[str, Any]:
    sanitized = _strip_keys(metadata_json, METADATA_TEXT_KEYS)
    if not isinstance(sanitized, dict):
        return {}
    return sanitized
