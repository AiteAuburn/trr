from datetime import UTC, datetime
from uuid import UUID

from fastapi.testclient import TestClient
from pydantic import ValidationError
from pytest import raises

from app.main import app
from app.schemas.report import GlucoseSummary, MAX_BASIC_REPORT_RECORDS, ReportSummary
from app.services.record_validation import MAX_GLUCOSE_VALUE, MIN_GLUCOSE_VALUE
from tests.helpers import create_account_and_profile, create_record


def test_basic_report_summarizes_profile_records() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client)

    create_record(
        client,
        account_id,
        profile_id,
        "glucose",
        datetime(2026, 4, 30, 8, 0, tzinfo=UTC),
        {"value": 120, "unit": "mg/dL", "meal_timing": "before_meal"},
    )
    create_record(
        client,
        account_id,
        profile_id,
        "glucose",
        datetime(2026, 4, 30, 18, 0, tzinfo=UTC),
        {"value": 160, "unit": "mg/dL", "meal_timing": "after_meal"},
    )
    create_record(
        client,
        account_id,
        profile_id,
        "meal",
        datetime(2026, 4, 30, 8, 30, tzinfo=UTC),
        {"food_items": [{"name": "蛋餅"}]},
    )
    create_record(
        client,
        account_id,
        profile_id,
        "exercise",
        datetime(2026, 4, 30, 19, 0, tzinfo=UTC),
        {"activity": "walk", "minutes": 30},
    )

    response = client.get(
        f"/reports/basic?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
    )
    assert response.status_code == 200
    report = response.json()
    assert report["profile_id"] == profile_id
    assert report["record_count"] == 4
    assert report["glucose"] == {
        "count": 2,
        "before_meal_count": 1,
        "after_meal_count": 1,
        "average": 140.0,
        "minimum": 120.0,
        "maximum": 160.0,
        "latest_value": 160.0,
        "latest_recorded_at": "2026-04-30T18:00:00Z",
    }
    assert report["meals"] == {"count": 1}
    assert report["lifestyle"] == {
        "exercise_count": 1,
        "medication_count": 0,
        "lifestyle_count": 0,
        "note_count": 0,
    }


def test_basic_report_response_schema_bounds_counts_and_glucose_values() -> None:
    with raises(ValidationError):
        GlucoseSummary(
            count=1,
            before_meal_count=0,
            after_meal_count=0,
            average=MAX_GLUCOSE_VALUE + 1,
            minimum=MIN_GLUCOSE_VALUE,
            maximum=MAX_GLUCOSE_VALUE,
            latest_value=MAX_GLUCOSE_VALUE,
            latest_recorded_at=None,
        )

    with raises(ValidationError):
        ReportSummary(
            profile_id=UUID(int=1),
            generated_at=datetime(2026, 4, 30, 8, 0, tzinfo=UTC),
            record_count=MAX_BASIC_REPORT_RECORDS + 1,
            glucose=GlucoseSummary(
                count=0,
                before_meal_count=0,
                after_meal_count=0,
                average=None,
                minimum=None,
                maximum=None,
                latest_value=None,
                latest_recorded_at=None,
            ),
            meals={"count": 0},
            lifestyle={
                "exercise_count": 0,
                "medication_count": 0,
                "lifestyle_count": 0,
                "note_count": 0,
            },
        )


def test_basic_report_supports_date_window() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "report-window")
    create_record(
        client,
        account_id,
        profile_id,
        "glucose",
        datetime(2026, 4, 29, 8, 0, tzinfo=UTC),
        {"value": 100, "unit": "mg/dL", "meal_timing": "before_meal"},
    )
    create_record(
        client,
        account_id,
        profile_id,
        "glucose",
        datetime(2026, 4, 30, 8, 0, tzinfo=UTC),
        {"value": 150, "unit": "mg/dL", "meal_timing": "before_meal"},
    )
    create_record(
        client,
        account_id,
        profile_id,
        "glucose",
        datetime(2026, 4, 30, 12, 0, tzinfo=UTC),
        {"value": 130, "unit": "mg/dL", "meal_timing": "fasting"},
    )
    create_record(
        client,
        account_id,
        profile_id,
        "glucose",
        datetime(2026, 4, 30, 18, 0, tzinfo=UTC),
        {"value": 180, "unit": "mg/dL", "meal_timing": "after_meal"},
    )
    create_record(
        client,
        account_id,
        profile_id,
        "glucose",
        datetime(2026, 5, 1, 0, 0, tzinfo=UTC),
        {"value": 90, "unit": "mg/dL", "meal_timing": "after_meal"},
    )

    response = client.get(
        (
            f"/reports/basic?profile_id={profile_id}"
            "&start_at=2026-04-30T00:00:00Z"
            "&end_at=2026-05-01T00:00:00Z"
        ),
        headers={"X-Account-Id": account_id},
    )

    assert response.status_code == 200
    report = response.json()
    assert report["record_count"] == 3
    assert report["glucose"] == {
        "count": 3,
        "before_meal_count": 2,
        "after_meal_count": 1,
        "average": 153.3,
        "minimum": 130.0,
        "maximum": 180.0,
        "latest_value": 180.0,
        "latest_recorded_at": "2026-04-30T18:00:00Z",
    }


def test_basic_report_rejects_invalid_date_window_before_permission_lookup(
    monkeypatch,
) -> None:
    from app.api import reports as reports_api

    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "report-invalid-window")

    def fail_if_permission_lookup_runs(*_: object, **__: object) -> None:
        raise AssertionError("permission lookup should not run for invalid report windows")

    monkeypatch.setattr(reports_api, "assert_can_export_profile", fail_if_permission_lookup_runs)

    response = client.get(
        (
            f"/reports/basic?profile_id={profile_id}"
            "&start_at=2026-05-01T00:00:00Z"
            "&end_at=2026-05-01T00:00:00Z"
        ),
        headers={"X-Account-Id": account_id},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "invalid_report_window",
        "message": "start_at must be earlier than end_at.",
    }


def test_basic_report_rejects_naive_window_before_permission_lookup(
    monkeypatch,
) -> None:
    from app.api import reports as reports_api

    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "report-naive-window")

    def fail_if_permission_lookup_runs(*_: object, **__: object) -> None:
        raise AssertionError("permission lookup should not run for naive report windows")

    monkeypatch.setattr(reports_api, "assert_can_export_profile", fail_if_permission_lookup_runs)

    response = client.get(
        (
            f"/reports/basic?profile_id={profile_id}"
            "&start_at=2026-04-30T00:00:00"
            "&end_at=2026-05-01T00:00:00Z"
        ),
        headers={"X-Account-Id": account_id},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "invalid_datetime",
        "field": "start_at",
        "message": "datetime must include a timezone.",
    }


def test_basic_report_uses_registry_report_eligible_types() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "report-eligible-types")
    occurred_at = datetime(2026, 4, 30, 8, 0, tzinfo=UTC)

    create_record(
        client,
        account_id,
        profile_id,
        "glucose",
        occurred_at,
        {"value": 150, "unit": "mg/dL"},
    )
    create_record(
        client,
        account_id,
        profile_id,
        "body_measurement",
        occurred_at,
        {"kind": "weight", "value": 72.5, "unit": "kg"},
    )
    create_record(
        client,
        account_id,
        profile_id,
        "lab_result",
        occurred_at,
        {"name": "HbA1c", "value": 6.8, "unit": "%"},
    )

    response = client.get(
        f"/reports/basic?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
    )

    assert response.status_code == 200
    report = response.json()
    assert report["record_count"] == 1
    assert report["glucose"]["count"] == 1
    assert report["glucose"]["average"] == 150.0


def test_basic_report_requires_profile_ownership() -> None:
    client = TestClient(app)
    _, other_profile_id = create_account_and_profile(client)
    account_id, _ = create_account_and_profile(client)

    response = client.get(
        f"/reports/basic?profile_id={other_profile_id}",
        headers={"X-Account-Id": account_id},
    )
    assert response.status_code == 404
