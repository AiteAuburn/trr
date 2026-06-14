from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

from app.services.record_validation import ALLOWED_RECORD_TYPES, validate_record_payload


@dataclass(frozen=True)
class RecordSchemaDefinition:
    record_type: str
    schema_version: int
    report_eligible: bool


RECORD_SCHEMA_REGISTRY: dict[str, RecordSchemaDefinition] = {
    record_type: RecordSchemaDefinition(
        record_type=record_type,
        schema_version=1,
        report_eligible=record_type in {"glucose", "meal", "exercise", "medication", "lifestyle", "note"},
    )
    for record_type in sorted(ALLOWED_RECORD_TYPES)
}


def get_record_schema(record_type: str) -> RecordSchemaDefinition | None:
    return RECORD_SCHEMA_REGISTRY.get(record_type)


def validate_payload_with_registry(record_type: str, payload: Mapping[str, Any]) -> None:
    validate_record_payload(record_type, payload)


def record_schema_metadata(record_type: str) -> dict[str, object]:
    schema = get_record_schema(record_type)
    if schema is None:
        validate_record_payload(record_type, {})
        raise RuntimeError("unsupported record schema did not raise validation error")
    return {
        "record_schema_version": schema.schema_version,
    }


def attach_record_schema_metadata(record_type: str, metadata: Mapping[str, Any]) -> dict[str, Any]:
    return {
        **dict(metadata),
        **record_schema_metadata(record_type),
    }


def supported_record_types() -> list[str]:
    return sorted(RECORD_SCHEMA_REGISTRY)


def report_eligible_record_types() -> list[str]:
    return sorted(
        record_type
        for record_type, schema in RECORD_SCHEMA_REGISTRY.items()
        if schema.report_eligible
    )
