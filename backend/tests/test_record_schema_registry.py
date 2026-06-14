from fastapi import HTTPException
import pytest

from app.services.record_schema_registry import (
    attach_record_schema_metadata,
    get_record_schema,
    record_schema_metadata,
    report_eligible_record_types,
    supported_record_types,
    validate_payload_with_registry,
)


def test_record_schema_registry_lists_supported_types() -> None:
    assert "glucose" in supported_record_types()
    glucose_schema = get_record_schema("glucose")
    assert glucose_schema is not None
    assert glucose_schema.schema_version == 1


def test_record_schema_registry_lists_report_eligible_types() -> None:
    assert report_eligible_record_types() == [
        "exercise",
        "glucose",
        "lifestyle",
        "meal",
        "medication",
        "note",
    ]


def test_record_schema_registry_validates_payloads() -> None:
    validate_payload_with_registry("glucose", {"value": 120, "unit": "mg/dL"})


def test_record_schema_registry_exposes_metadata_contract() -> None:
    assert record_schema_metadata("glucose") == {"record_schema_version": 1}
    assert attach_record_schema_metadata(
        "glucose",
        {
            "parser_model_id": "local-llm-schema-stub",
            "record_schema_version": 999,
        },
    ) == {
        "parser_model_id": "local-llm-schema-stub",
        "record_schema_version": 1,
    }


def test_record_schema_registry_rejects_invalid_payloads() -> None:
    try:
        validate_payload_with_registry("glucose", {"unit": "mg/dL"})
    except HTTPException as exc:
        assert exc.status_code == 422
    else:
        raise AssertionError("expected invalid glucose payload to fail")


@pytest.mark.parametrize(
    ("record_type", "payload", "expected_detail"),
    [
        ("meal", {"description": "free text"}, "meal payload missing required keys: food_items"),
        ("exercise", {"description": "free text"}, "exercise payload missing required keys: activity"),
        ("medication", {"description": "free text"}, "medication payload missing required keys: name"),
        ("lifestyle", {"description": "free text"}, "lifestyle payload missing required keys: kind"),
    ],
)
def test_record_schema_registry_rejects_description_only_payloads(
    record_type: str,
    payload: dict[str, object],
    expected_detail: str,
) -> None:
    with pytest.raises(HTTPException) as exc_info:
        validate_payload_with_registry(record_type, payload)

    assert exc_info.value.status_code == 422
    assert exc_info.value.detail == expected_detail
