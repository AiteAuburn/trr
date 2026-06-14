from datetime import UTC, datetime

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.redaction import (
    MAX_REDACTION_CONTAINER_LENGTH,
    MAX_REDACTION_DEPTH,
    MAX_REDACTION_STRING_LENGTH,
    REDACTED,
    REDACTION_TRUNCATED,
    redact_sensitive_data,
)
from app.db.session import SessionLocal
from app.main import app
from app.models import AuditLog
from app.services.audit import (
    AUDIT_METADATA_TRUNCATED,
    MAX_AUDIT_METADATA_CONTAINER_LENGTH,
    MAX_AUDIT_METADATA_STRING_LENGTH,
    sanitize_audit_metadata,
)
from tests.helpers import create_account_and_profile, create_record


def test_redaction_removes_sensitive_health_and_secret_fields() -> None:
    redacted = redact_sensitive_data(
        {
            "event": "record.created",
            "payload_json": {"value": 138, "unit": "mg/dL"},
            "nested": {
                "transcript": "今天早上空腹血糖 138",
                "api_key": "secret",
            },
        }
    )

    assert redacted == {
        "event": "record.created",
        "payload_json": REDACTED,
        "nested": {
            "transcript": REDACTED,
            "api_key": REDACTED,
        },
    }


def test_redaction_bounds_depth_width_and_string_length() -> None:
    deep: dict[str, object] = {"leaf": "done"}
    for index in range(MAX_REDACTION_DEPTH + 5):
        deep = {f"level_{index}": deep}
    wide = {f"key_{index}": index for index in range(MAX_REDACTION_CONTAINER_LENGTH + 5)}
    long_text = "x" * (MAX_REDACTION_STRING_LENGTH + 5)

    redacted = redact_sensitive_data(
        {
            "deep": deep,
            "wide": wide,
            "items": list(range(MAX_REDACTION_CONTAINER_LENGTH + 5)),
            "long_text": long_text,
        }
    )

    assert redacted["long_text"] == "x" * MAX_REDACTION_STRING_LENGTH
    assert redacted["wide"]["_truncated"] is True
    assert len(redacted["items"]) == MAX_REDACTION_CONTAINER_LENGTH + 1
    assert redacted["items"][-1] == REDACTION_TRUNCATED

    current = redacted["deep"]
    for _ in range(MAX_REDACTION_DEPTH - 1):
        assert isinstance(current, dict)
        current = next(iter(current.values()))
    assert current == REDACTION_TRUNCATED


def test_redaction_rejects_invalid_bounds() -> None:
    for kwargs in (
        {"max_depth": -1},
        {"max_container_length": 0},
        {"max_string_length": 0},
    ):
        try:
            redact_sensitive_data({"safe": "value"}, **kwargs)
        except ValueError:
            pass
        else:
            raise AssertionError(f"expected invalid redaction bounds to fail: {kwargs}")


def test_audit_metadata_sanitizer_bounds_values_and_redacts_sensitive_keys() -> None:
    long_value = "x" * (MAX_AUDIT_METADATA_STRING_LENGTH + 1)
    sanitized = sanitize_audit_metadata(
        {
            "action": long_value,
            "payload_json": {"value": 138, "unit": "mg/dL"},
            "wide": list(range(MAX_AUDIT_METADATA_CONTAINER_LENGTH + 1)),
            "deep": {"a": {"b": {"c": {"d": "too deep"}}}},
        }
    )

    assert sanitized["action"] == "x" * MAX_AUDIT_METADATA_STRING_LENGTH
    assert sanitized["payload_json"] == REDACTED
    assert sanitized["wide"][-1] == AUDIT_METADATA_TRUNCATED
    assert sanitized["deep"]["a"]["b"]["c"] == AUDIT_METADATA_TRUNCATED


def test_audit_metadata_sanitizer_bounds_wide_mapping() -> None:
    sanitized = sanitize_audit_metadata(
        {f"key_{index}": index for index in range(MAX_AUDIT_METADATA_CONTAINER_LENGTH + 1)}
    )

    assert len(sanitized) == MAX_AUDIT_METADATA_CONTAINER_LENGTH + 1
    assert sanitized["_truncated"] is True


def test_audit_metadata_sanitizer_does_not_preredact_unbounded_metadata() -> None:
    metadata: dict[str, object] = {"leaf": "done"}
    for index in range(100):
        metadata = {f"level_{index}": metadata}

    sanitized = sanitize_audit_metadata(metadata)

    first_value = next(iter(sanitized.values()))
    assert isinstance(first_value, dict)
    second_value = next(iter(first_value.values()))
    assert isinstance(second_value, dict)
    third_value = next(iter(second_value.values()))
    assert isinstance(third_value, dict)
    assert next(iter(third_value.values())) == AUDIT_METADATA_TRUNCATED


def test_profile_endpoints_require_account_header() -> None:
    client = TestClient(app)

    response = client.get("/profiles")

    assert response.status_code == 401


def test_record_create_writes_redacted_audit_event() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client)

    create_record(
        client,
        account_id,
        profile_id,
        "glucose",
        datetime(2026, 4, 30, 8, 0, tzinfo=UTC),
        {"value": 138, "unit": "mg/dL"},
    )

    with SessionLocal() as db:
        audit_log = db.scalar(
            select(AuditLog)
            .where(AuditLog.action == "record.created")
            .order_by(AuditLog.created_at.desc())
        )

    assert audit_log is not None
    assert audit_log.actor_account_id is not None
    assert str(audit_log.profile_id) == profile_id
    assert audit_log.metadata_json == {
        "record_type": "glucose",
        "source": "manual",
    }


def test_report_view_writes_audit_event_without_phi_payload() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client)
    create_record(
        client,
        account_id,
        profile_id,
        "glucose",
        datetime(2026, 4, 30, 8, 0, tzinfo=UTC),
        {"value": 138, "unit": "mg/dL"},
    )

    response = client.get(
        f"/reports/basic?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
    )

    assert response.status_code == 200
    with SessionLocal() as db:
        audit_log = db.scalar(
            select(AuditLog)
            .where(AuditLog.action == "report.basic_viewed")
            .order_by(AuditLog.created_at.desc())
        )

    assert audit_log is not None
    assert audit_log.metadata_json == {"record_count": 1}
