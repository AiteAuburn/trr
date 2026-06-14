from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.db.session import SessionLocal
from app.main import app
from app.models import Record
from app.services.record_json_bounds import (
    MAX_RECORD_JSON_CONTAINER_LENGTH,
    MAX_RECORD_JSON_DEPTH,
    MAX_RECORD_JSON_STRING_LENGTH,
)
from app.services.record_sanitization import (
    RECORD_SANITIZATION_TRUNCATED,
    sanitize_record_metadata_for_storage,
    sanitize_record_payload_for_storage,
)
from app.services.record_validation import (
    MAX_EXERCISE_MINUTES,
    MAX_GLUCOSE_VALUE,
    MAX_MEAL_FOOD_ITEMS,
    MAX_NOTE_TAGS,
    MAX_RECORD_SHORT_TEXT_LENGTH,
    MAX_WEIGHT_KG,
)
from tests.helpers import create_account_and_profile


def test_create_and_list_records_for_profile() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client)
    occurred_at = datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat()

    create_response = client.post(
        "/records",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "record_type": "glucose",
            "occurred_at": occurred_at,
            "payload_json": {"value": 138, "unit": "mg/dL", "meal_timing": "fasting"},
            "source": "manual",
        },
    )
    assert create_response.status_code == 201
    record = create_response.json()
    assert record["profile_id"] == profile_id
    assert record["record_type"] == "glucose"
    assert record["payload_json"]["value"] == 138

    list_response = client.get(
        f"/records?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
    )
    assert list_response.status_code == 200
    assert [item["id"] for item in list_response.json()] == [record["id"]]


def test_record_list_is_paginated_and_supports_before_cursor() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "record-pagination")
    base_time = datetime(2026, 4, 30, 8, 0, tzinfo=UTC)

    created_ids: list[str] = []
    for offset in range(3):
        response = client.post(
            "/records",
            headers={"X-Account-Id": account_id},
            json={
                "profile_id": profile_id,
                "record_type": "glucose",
                "occurred_at": (base_time + timedelta(hours=offset)).isoformat(),
                "payload_json": {"value": 120 + offset, "unit": "mg/dL"},
                "source": "manual",
            },
        )
        assert response.status_code == 201
        created_ids.append(response.json()["id"])

    first_page = client.get(
        f"/records?profile_id={profile_id}&limit=2",
        headers={"X-Account-Id": account_id},
    )
    assert first_page.status_code == 200
    first_page_items = first_page.json()
    assert [item["id"] for item in first_page_items] == [created_ids[2], created_ids[1]]

    next_page = client.get(
        f"/records?profile_id={profile_id}&limit=2&before={first_page_items[-1]['occurred_at']}",
        headers={"X-Account-Id": account_id},
    )
    assert next_page.status_code == 200
    assert [item["id"] for item in next_page.json()] == [created_ids[0]]


def test_record_list_cursor_uses_created_at_tie_breaker() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "record-pagination-tie")
    occurred_at = datetime(2026, 4, 30, 8, 0, tzinfo=UTC)
    created_at_values = [
        datetime(2026, 4, 30, 8, 1, tzinfo=UTC),
        datetime(2026, 4, 30, 8, 2, tzinfo=UTC),
        datetime(2026, 4, 30, 8, 3, tzinfo=UTC),
    ]

    created_ids: list[str] = []
    for offset in range(3):
        response = client.post(
            "/records",
            headers={"X-Account-Id": account_id},
            json={
                "profile_id": profile_id,
                "record_type": "glucose",
                "occurred_at": occurred_at.isoformat(),
                "payload_json": {"value": 120 + offset, "unit": "mg/dL"},
                "source": "manual",
            },
        )
        assert response.status_code == 201
        created_ids.append(response.json()["id"])

    with SessionLocal() as db:
        for record_id, created_at in zip(created_ids, created_at_values, strict=True):
            record = db.scalar(select(Record).where(Record.id == UUID(record_id)))
            assert record is not None
            record.created_at = created_at
        db.commit()

    first_page = client.get(
        f"/records?profile_id={profile_id}&limit=2",
        headers={"X-Account-Id": account_id},
    )
    assert first_page.status_code == 200
    first_page_items = first_page.json()
    assert [item["id"] for item in first_page_items] == [created_ids[2], created_ids[1]]

    next_page = client.get(
        (
            f"/records?profile_id={profile_id}&limit=2"
            f"&before={first_page_items[-1]['occurred_at']}"
            f"&before_created_at={first_page_items[-1]['created_at']}"
        ),
        headers={"X-Account-Id": account_id},
    )
    assert next_page.status_code == 200
    assert [item["id"] for item in next_page.json()] == [created_ids[0]]


def test_record_list_rejects_incomplete_cursor_before_permission_lookup(monkeypatch) -> None:
    from app.api import records as records_api

    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "record-incomplete-cursor")

    def fail_if_permission_lookup_runs(*_: object, **__: object) -> None:
        raise AssertionError("permission lookup should not run for incomplete record cursors")

    monkeypatch.setattr(records_api, "assert_can_read_profile", fail_if_permission_lookup_runs)

    response = client.get(
        (
            f"/records?profile_id={profile_id}"
            "&before_created_at=2026-04-30T08:00:00Z"
        ),
        headers={"X-Account-Id": account_id},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "invalid_record_cursor",
        "message": "before_created_at requires before.",
    }


def test_record_list_rejects_naive_cursor_before_permission_lookup(monkeypatch) -> None:
    from app.api import records as records_api

    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "record-naive-cursor")

    def fail_if_permission_lookup_runs(*_: object, **__: object) -> None:
        raise AssertionError("permission lookup should not run for naive record cursors")

    monkeypatch.setattr(records_api, "assert_can_read_profile", fail_if_permission_lookup_runs)

    response = client.get(
        f"/records?profile_id={profile_id}&before=2026-04-30T08:00:00",
        headers={"X-Account-Id": account_id},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "invalid_datetime",
        "field": "before",
        "message": "datetime must include a timezone.",
    }


def test_record_create_rejects_future_occurred_at_before_permission_lookup(monkeypatch) -> None:
    from app.api import records as records_api

    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "record-future-create")

    def fail_if_permission_lookup_runs(*_: object, **__: object) -> None:
        raise AssertionError("permission lookup should not run for future occurred_at")

    monkeypatch.setattr(records_api, "assert_can_write_profile", fail_if_permission_lookup_runs)

    response = client.post(
        "/records",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "record_type": "glucose",
            "occurred_at": (datetime.now(UTC) + timedelta(days=1)).isoformat(),
            "payload_json": {"value": 138, "unit": "mg/dL"},
            "source": "manual",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "invalid_record_time",
        "message": "occurred_at must not be in the future.",
    }


def test_record_update_rejects_future_occurred_at_before_record_lookup(monkeypatch) -> None:
    from app.api import records as records_api

    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "record-future-update")

    def fail_if_record_lookup_runs(*_: object, **__: object) -> None:
        raise AssertionError("record lookup should not run for future occurred_at")

    monkeypatch.setattr(records_api, "assert_can_write_record", fail_if_record_lookup_runs)

    response = client.patch(
        f"/records/{UUID(int=1)}",
        headers={"X-Account-Id": account_id},
        json={"occurred_at": (datetime.now(UTC) + timedelta(days=1)).isoformat()},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "invalid_record_time",
        "message": "occurred_at must not be in the future.",
    }


def test_record_create_rejects_oversized_metadata_before_permission_lookup(monkeypatch) -> None:
    from app.api import records as records_api

    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "record-oversized-metadata-create")

    def fail_if_permission_lookup_runs(*_: object, **__: object) -> None:
        raise AssertionError("permission lookup should not run for oversized record metadata")

    monkeypatch.setattr(records_api, "assert_can_write_profile", fail_if_permission_lookup_runs)

    response = client.post(
        "/records",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "record_type": "glucose",
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
            "payload_json": {"value": 138, "unit": "mg/dL"},
            "metadata_json": {"parser_model_id": "x" * 513},
            "source": "manual",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "record_json_too_large",
        "field": "metadata_json",
        "reason": "string_too_long",
    }


def test_record_update_rejects_oversized_payload_before_record_lookup(monkeypatch) -> None:
    from app.api import records as records_api

    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "record-oversized-payload-update")

    def fail_if_record_lookup_runs(*_: object, **__: object) -> None:
        raise AssertionError("record lookup should not run for oversized record payload")

    monkeypatch.setattr(records_api, "assert_can_write_record", fail_if_record_lookup_runs)

    response = client.patch(
        f"/records/{UUID(int=1)}",
        headers={"X-Account-Id": account_id},
        json={
            "payload_json": {
                "value": 138,
                "unit": "mg/dL",
                "samples": list(range(260)),
            }
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "record_json_too_large",
        "field": "payload_json",
        "reason": "array_too_long",
    }


def test_record_create_rejects_wide_payload_before_permission_lookup(monkeypatch) -> None:
    from app.api import records as records_api

    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "record-wide-payload-create")

    def fail_if_permission_lookup_runs(*_: object, **__: object) -> None:
        raise AssertionError("permission lookup should not run for wide record payload")

    monkeypatch.setattr(records_api, "assert_can_write_profile", fail_if_permission_lookup_runs)

    response = client.post(
        "/records",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "record_type": "note",
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
            "payload_json": {
                "kind": "symptom",
                "samples": list(range(MAX_RECORD_JSON_CONTAINER_LENGTH + 1)),
            },
            "source": "manual",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "record_json_too_large",
        "field": "payload_json",
        "reason": "array_too_long",
    }


def test_record_update_rejects_wide_metadata_before_record_lookup(monkeypatch) -> None:
    from app.api import records as records_api

    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "record-wide-metadata-update")

    def fail_if_record_lookup_runs(*_: object, **__: object) -> None:
        raise AssertionError("record lookup should not run for wide record metadata")

    monkeypatch.setattr(records_api, "assert_can_write_record", fail_if_record_lookup_runs)

    response = client.patch(
        f"/records/{UUID(int=1)}",
        headers={"X-Account-Id": account_id},
        json={
            "metadata_json": {
                f"key_{index}": "value"
                for index in range(MAX_RECORD_JSON_CONTAINER_LENGTH + 1)
            }
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "record_json_too_large",
        "field": "metadata_json",
        "reason": "too_many_keys",
    }


def test_record_create_removes_raw_text_before_storage() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "record-minimization")

    response = client.post(
        "/records",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "record_type": "meal",
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
            "payload_json": {
                "description": "早餐吃蛋餅",
                "food_items": [{"name": "蛋餅", "amount": "unknown"}],
                "meal_type": "breakfast",
            },
            "metadata_json": {
                "transcript": "今天早上早餐吃蛋餅",
                "source_text": "早餐吃蛋餅",
                "stt_model_id": "browser-web-speech",
                "parser_model_id": "ollama-qwen2.5-1.5b",
                "time_hint": "morning",
            },
            "source": "ai_parse_preview",
        },
    )

    assert response.status_code == 201
    record = response.json()
    assert record["payload_json"] == {
        "food_items": [{"name": "蛋餅", "amount": "unknown"}],
        "meal_type": "breakfast",
    }
    assert record["metadata_json"] == {
        "stt_model_id": "browser-web-speech",
        "parser_model_id": "ollama-qwen2.5-1.5b",
        "time_hint": "morning",
        "record_schema_version": 1,
    }


def test_record_sanitizers_bound_direct_recursive_use() -> None:
    deep: dict[str, object] = {"leaf": "done"}
    for index in range(MAX_RECORD_JSON_DEPTH + 5):
        deep = {f"level_{index}": deep}
    wide = {f"key_{index}": index for index in range(MAX_RECORD_JSON_CONTAINER_LENGTH + 5)}

    payload = sanitize_record_payload_for_storage(
        "note",
        {
            "kind": "symptom",
            "description": "free text is removed",
            "tags": ["x" * (MAX_RECORD_JSON_STRING_LENGTH + 5)],
            "deep": deep,
            "wide": wide,
            "items": list(range(MAX_RECORD_JSON_CONTAINER_LENGTH + 5)),
        },
    )
    metadata = sanitize_record_metadata_for_storage(
        {
            "source_text": "raw transcript removed",
            "long_model": "m" * (MAX_RECORD_JSON_STRING_LENGTH + 5),
        }
    )

    assert "description" not in payload
    assert "source_text" not in metadata
    assert payload["tags"] == ["x" * MAX_RECORD_JSON_STRING_LENGTH]
    assert metadata["long_model"] == "m" * MAX_RECORD_JSON_STRING_LENGTH
    assert payload["wide"]["_truncated"] is True
    assert len(payload["items"]) == MAX_RECORD_JSON_CONTAINER_LENGTH + 1
    assert payload["items"][-1] == RECORD_SANITIZATION_TRUNCATED

    current = payload["deep"]
    for _ in range(MAX_RECORD_JSON_DEPTH - 1):
        assert isinstance(current, dict)
        current = next(iter(current.values()))
    assert current == RECORD_SANITIZATION_TRUNCATED


def test_record_profile_must_belong_to_account() -> None:
    client = TestClient(app)
    _, other_profile_id = create_account_and_profile(client)
    account_id, _ = create_account_and_profile(client)

    response = client.post(
        "/records",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": other_profile_id,
            "record_type": "glucose",
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
            "payload_json": {"value": 138},
        },
    )
    assert response.status_code == 404


def test_record_payload_schema_is_validated() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client)

    response = client.post(
        "/records",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "record_type": "glucose",
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
            "payload_json": {"unit": "mg/dL"},
        },
    )

    assert response.status_code == 422


def test_note_record_uses_structured_payload_after_text_minimization() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "note-structured")

    response = client.post(
        "/records",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "record_type": "note",
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
            "payload_json": {
                "kind": "symptom",
                "tags": ["dizzy"],
                "text": "今天有點頭暈",
            },
            "source": "manual",
        },
    )

    assert response.status_code == 201
    assert response.json()["payload_json"] == {"kind": "symptom", "tags": ["dizzy"]}
    assert response.json()["metadata_json"]["record_schema_version"] == 1


def test_record_create_overwrites_client_schema_version_metadata() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "record-schema-version-create")

    response = client.post(
        "/records",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "record_type": "glucose",
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
            "payload_json": {"value": 138, "unit": "mg/dL"},
            "metadata_json": {"record_schema_version": 999, "parser_model_id": "local-llm-schema-stub"},
            "source": "manual",
        },
    )

    assert response.status_code == 201
    assert response.json()["metadata_json"] == {
        "parser_model_id": "local-llm-schema-stub",
        "record_schema_version": 1,
    }


def test_record_create_validates_sanitized_payload() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "record-sanitized-validation")

    response = client.post(
        "/records",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "record_type": "meal",
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
            "payload_json": {"description": "早餐吃蛋餅"},
            "source": "manual",
        },
    )

    assert response.status_code == 422
    assert "meal payload missing required keys: food_items" in response.text


def test_record_create_rejects_oversized_meal_food_items() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "record-meal-items-cap")

    response = client.post(
        "/records",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "record_type": "meal",
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
            "payload_json": {
                "food_items": [
                    {"name": f"food-{index}", "amount": "unknown"}
                    for index in range(MAX_MEAL_FOOD_ITEMS + 1)
                ]
            },
            "source": "manual",
        },
    )

    assert response.status_code == 422
    assert "meal payload food_items exceeds maximum" in response.text


def test_record_create_rejects_invalid_meal_food_item_shape() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "record-meal-item-shape")

    response = client.post(
        "/records",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "record_type": "meal",
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
            "payload_json": {"food_items": ["free text food"]},
            "source": "manual",
        },
    )

    assert response.status_code == 422
    assert "meal payload food_items must contain objects" in response.text


def test_record_create_rejects_oversized_note_tags() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "record-note-tags-cap")

    response = client.post(
        "/records",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "record_type": "note",
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
            "payload_json": {
                "kind": "symptom",
                "tags": [f"tag-{index}" for index in range(MAX_NOTE_TAGS + 1)],
            },
            "source": "manual",
        },
    )

    assert response.status_code == 422
    assert "note payload tags exceeds maximum" in response.text


def test_record_create_rejects_out_of_range_core_numeric_values() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "record-numeric-ranges")
    occurred_at = datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat()
    cases = [
        ("glucose", {"value": MAX_GLUCOSE_VALUE + 1, "unit": "mg/dL"}, "glucose payload value out of range"),
        (
            "exercise",
            {"activity": "walk", "minutes": MAX_EXERCISE_MINUTES + 1},
            "exercise payload minutes out of range",
        ),
        (
            "vital",
            {"kind": "blood_pressure", "systolic": 301, "diastolic": 82, "unit": "mmHg"},
            "vital payload systolic out of range",
        ),
        (
            "body_measurement",
            {"kind": "weight", "value": MAX_WEIGHT_KG + 1, "unit": "kg"},
            "body_measurement payload value out of range",
        ),
    ]

    for record_type, payload_json, expected_detail in cases:
        response = client.post(
            "/records",
            headers={"X-Account-Id": account_id},
            json={
                "profile_id": profile_id,
                "record_type": record_type,
                "occurred_at": occurred_at,
                "payload_json": payload_json,
                "source": "manual",
            },
        )

        assert response.status_code == 422
        assert expected_detail in response.text


def test_record_create_rejects_invalid_core_text_and_units() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "record-text-units")
    occurred_at = datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat()
    too_long_text = "x" * (MAX_RECORD_SHORT_TEXT_LENGTH + 1)
    cases = [
        ("glucose", {"value": 138, "unit": "stone"}, "glucose payload unit is invalid"),
        (
            "glucose",
            {"value": 138, "unit": "mg/dL", "meal_timing": "random"},
            "glucose payload meal_timing is invalid",
        ),
        (
            "meal",
            {"food_items": [{"name": "蛋餅"}], "meal_type": "midnight"},
            "meal payload meal_type is invalid",
        ),
        (
            "meal",
            {"food_items": [{"name": "蛋餅", "amount": too_long_text}]},
            "meal payload food_items amount is invalid",
        ),
        ("exercise", {"activity": " "}, "exercise payload activity is required"),
        ("medication", {"name": ""}, "medication payload name is required"),
        (
            "vital",
            {"kind": "blood_pressure", "systolic": 120, "diastolic": 80, "unit": "kPa"},
            "vital payload unit is invalid",
        ),
        (
            "body_measurement",
            {"kind": "height", "value": 170, "unit": "cm"},
            "body_measurement payload kind is invalid",
        ),
        (
            "body_measurement",
            {"kind": "weight", "value": 72, "unit": "lb"},
            "body_measurement payload unit is invalid",
        ),
        ("lab_result", {"name": " "}, "lab_result payload name is required"),
        ("lifestyle", {"kind": too_long_text}, "lifestyle payload kind is required"),
        ("note", {"kind": "symptom", "tags": [" "]}, "note payload tags must be non-empty strings"),
    ]

    for record_type, payload_json, expected_detail in cases:
        response = client.post(
            "/records",
            headers={"X-Account-Id": account_id},
            json={
                "profile_id": profile_id,
                "record_type": record_type,
                "occurred_at": occurred_at,
                "payload_json": payload_json,
                "source": "manual",
            },
        )

        assert response.status_code == 422
        assert expected_detail in response.text


def test_record_update_rejects_out_of_range_existing_record_payload() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "record-update-range")
    create_response = client.post(
        "/records",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "record_type": "glucose",
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
            "payload_json": {"value": 138, "unit": "mg/dL"},
            "source": "manual",
        },
    )
    assert create_response.status_code == 201

    update_response = client.patch(
        f"/records/{create_response.json()['id']}",
        headers={"X-Account-Id": account_id},
        json={"payload_json": {"value": MAX_GLUCOSE_VALUE + 1, "unit": "mg/dL"}},
    )

    assert update_response.status_code == 422
    assert "glucose payload value out of range" in update_response.text


def test_record_update_rejects_invalid_core_text_and_units() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "record-update-text-units")
    create_response = client.post(
        "/records",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "record_type": "glucose",
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
            "payload_json": {"value": 138, "unit": "mg/dL"},
            "source": "manual",
        },
    )
    assert create_response.status_code == 201

    update_response = client.patch(
        f"/records/{create_response.json()['id']}",
        headers={"X-Account-Id": account_id},
        json={"payload_json": {"value": 138, "unit": "stone"}},
    )

    assert update_response.status_code == 422
    assert "glucose payload unit is invalid" in update_response.text


def test_record_update_and_soft_delete_are_audited() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "record-edit-delete")

    create_response = client.post(
        "/records",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "record_type": "glucose",
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
            "payload_json": {"value": 138, "unit": "mg/dL"},
            "source": "manual",
        },
    )
    assert create_response.status_code == 201
    record_id = create_response.json()["id"]

    update_response = client.patch(
        f"/records/{record_id}",
        headers={"X-Account-Id": account_id},
        json={"payload_json": {"value": 142, "unit": "mg/dL", "note": "更正"}},
    )
    assert update_response.status_code == 200
    assert update_response.json()["payload_json"] == {"value": 142, "unit": "mg/dL"}
    assert update_response.json()["metadata_json"]["record_schema_version"] == 1

    delete_response = client.delete(
        f"/records/{record_id}",
        headers={"X-Account-Id": account_id},
    )
    assert delete_response.status_code == 204

    get_response = client.get(
        f"/records/{record_id}",
        headers={"X-Account-Id": account_id},
    )
    assert get_response.status_code == 404

    list_response = client.get(
        f"/records?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
    )
    assert list_response.status_code == 200
    assert list_response.json() == []


def test_generic_record_types_include_vital_and_body_measurement() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client)
    occurred_at = datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat()

    vital_response = client.post(
        "/records",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "record_type": "vital",
            "occurred_at": occurred_at,
            "payload_json": {
                "kind": "blood_pressure",
                "systolic": 128,
                "diastolic": 82,
                "unit": "mmHg",
            },
        },
    )
    assert vital_response.status_code == 201

    body_response = client.post(
        "/records",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "record_type": "body_measurement",
            "occurred_at": occurred_at,
            "payload_json": {"kind": "weight", "value": 72.5, "unit": "kg"},
        },
    )
    assert body_response.status_code == 201
