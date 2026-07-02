from datetime import UTC, datetime
from uuid import UUID

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.db.session import SessionLocal
from app.main import app
from app.models import DailyRecord, Record
from tests.helpers import create_account_and_profile


def test_daily_record_save_creates_records_and_one_daily_record() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "daily-record-create")
    occurred_at = datetime(2026, 6, 28, 8, 0, tzinfo=UTC)

    response = client.post(
        "/daily-records/save",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "record_date": "2026-06-28",
            "summary_text": "今天已整理 2 筆紀錄。",
            "records": [
                {
                    "profile_id": profile_id,
                    "record_type": "glucose",
                    "occurred_at": occurred_at.isoformat(),
                    "payload_json": {"value": 105, "unit": "mg/dL", "meal_timing": "fasting"},
                    "source": "ai_parse_preview",
                },
                {
                    "profile_id": profile_id,
                    "record_type": "meal",
                    "occurred_at": occurred_at.isoformat(),
                    "payload_json": {
                        "meal_type": "breakfast",
                        "food_items": [{"name": "水煮蛋", "amount": "2 顆"}],
                    },
                    "source": "ai_parse_preview",
                },
            ],
            "transcript_entries": [
                {
                    "id": "daily-transcript-1",
                    "occurred_at": occurred_at.isoformat(),
                    "source_text": "早餐前血糖 105，早餐吃兩顆水煮蛋。",
                    "source": "voice",
                }
            ],
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert len(payload["records"]) == 2
    assert payload["daily_record"]["record_date"] == "2026-06-28"
    assert payload["daily_record"]["summary_text"] == "今天已整理 2 筆紀錄。"
    assert len(payload["daily_record"]["record_ids"]) == 2
    assert len(payload["daily_record"]["preview_records_json"]) == 2
    assert payload["daily_record"]["transcript_entries_json"][0]["id"] == "daily-transcript-1"

    list_response = client.get(
        f"/daily-records?profile_id={profile_id}&record_date=2026-06-28",
        headers={"X-Account-Id": account_id},
    )
    assert list_response.status_code == 200
    assert [item["id"] for item in list_response.json()] == [payload["daily_record"]["id"]]


def test_daily_record_save_updates_same_day_instead_of_creating_second_daily_record() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "daily-record-merge")
    morning = datetime(2026, 6, 28, 8, 0, tzinfo=UTC)
    afternoon = datetime(2026, 6, 28, 15, 0, tzinfo=UTC)

    first_response = client.post(
        "/daily-records/save",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "record_date": "2026-06-28",
            "summary_text": "早上已整理。",
            "records": [
                {
                    "profile_id": profile_id,
                    "record_type": "glucose",
                    "occurred_at": morning.isoformat(),
                    "payload_json": {"value": 105, "unit": "mg/dL", "meal_timing": "fasting"},
                    "source": "ai_parse_preview",
                }
            ],
            "transcript_entries": [
                {
                    "id": "daily-transcript-morning",
                    "occurred_at": morning.isoformat(),
                    "source_text": "早上空腹血糖 105。",
                    "source": "voice",
                }
            ],
        },
    )
    assert first_response.status_code == 201
    daily_record_id = first_response.json()["daily_record"]["id"]

    second_response = client.post(
        "/daily-records/save",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "record_date": "2026-06-28",
            "summary_text": "今天已更新下午運動。",
            "records": [
                {
                    "profile_id": profile_id,
                    "record_type": "exercise",
                    "occurred_at": afternoon.isoformat(),
                    "payload_json": {"activity": "騎腳踏車", "minutes": 40},
                    "source": "ai_parse_preview",
                }
            ],
            "transcript_entries": [
                {
                    "id": "daily-transcript-afternoon",
                    "occurred_at": afternoon.isoformat(),
                    "source_text": "下午騎腳踏車 40 分鐘。",
                    "source": "voice",
                }
            ],
        },
    )

    assert second_response.status_code == 201
    daily_record = second_response.json()["daily_record"]
    assert daily_record["id"] == daily_record_id
    assert daily_record["summary_text"] == "今天已更新下午運動。"
    assert len(daily_record["record_ids"]) == 2
    assert len(daily_record["preview_records_json"]) == 2
    assert [entry["id"] for entry in daily_record["transcript_entries_json"]] == [
        "daily-transcript-morning",
        "daily-transcript-afternoon",
    ]

    with SessionLocal() as db:
        daily_records = list(
            db.scalars(
                select(DailyRecord).where(
                    DailyRecord.profile_id == UUID(profile_id),
                    DailyRecord.record_date == datetime(2026, 6, 28).date(),
                )
            )
        )
        records = list(db.scalars(select(Record).where(Record.profile_id == UUID(profile_id))))

    assert len(daily_records) == 1
    assert len(records) == 2


def test_daily_record_save_rejects_mismatched_record_profile() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "daily-record-mismatch-a")
    _, other_profile_id = create_account_and_profile(client, "daily-record-mismatch-b")
    occurred_at = datetime(2026, 6, 28, 8, 0, tzinfo=UTC)

    response = client.post(
        "/daily-records/save",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "record_date": "2026-06-28",
            "records": [
                {
                    "profile_id": other_profile_id,
                    "record_type": "glucose",
                    "occurred_at": occurred_at.isoformat(),
                    "payload_json": {"value": 105, "unit": "mg/dL"},
                    "source": "ai_parse_preview",
                }
            ],
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "daily_record_profile_mismatch",
        "message": "All records must belong to the daily record profile.",
    }
