from collections.abc import Mapping, Sequence
from typing import Any

from fastapi import HTTPException, status

MAX_RECORD_JSON_DEPTH = 8
MAX_RECORD_JSON_NODES = 256
MAX_RECORD_JSON_STRING_LENGTH = 512
MAX_RECORD_JSON_CONTAINER_LENGTH = 128


def validate_record_json_bounds(value: Any, *, field_name: str) -> None:
    stack: list[tuple[Any, int]] = [(value, 1)]
    nodes = 0
    while stack:
        current, depth = stack.pop()
        nodes += 1
        if nodes > MAX_RECORD_JSON_NODES:
            raise_record_json_bounds_error(field_name, "too_many_nodes")
        if depth > MAX_RECORD_JSON_DEPTH:
            raise_record_json_bounds_error(field_name, "too_deep")
        if isinstance(current, str):
            if len(current) > MAX_RECORD_JSON_STRING_LENGTH:
                raise_record_json_bounds_error(field_name, "string_too_long")
            continue
        if isinstance(current, Mapping):
            if len(current) > MAX_RECORD_JSON_CONTAINER_LENGTH:
                raise_record_json_bounds_error(field_name, "too_many_keys")
            for key, item in current.items():
                if not isinstance(key, str):
                    raise_record_json_bounds_error(field_name, "invalid_key")
                if len(key) > MAX_RECORD_JSON_STRING_LENGTH:
                    raise_record_json_bounds_error(field_name, "key_too_long")
                stack.append((item, depth + 1))
            continue
        if isinstance(current, Sequence) and not isinstance(current, bytes | bytearray):
            if len(current) > MAX_RECORD_JSON_CONTAINER_LENGTH:
                raise_record_json_bounds_error(field_name, "array_too_long")
            stack.extend((item, depth + 1) for item in current)


def raise_record_json_bounds_error(field_name: str, reason: str) -> None:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={
            "code": "record_json_too_large",
            "field": field_name,
            "reason": reason,
        },
    )
