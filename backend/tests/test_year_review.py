import json
from copy import deepcopy
from datetime import UTC, datetime, timedelta
from typing import Literal, cast
from uuid import UUID

import httpx
from fastapi.testclient import TestClient
from pytest import MonkeyPatch, fixture, raises
from sqlalchemy import Table, select

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.jobs.generate_year_review_snapshots import default_target_year
from app.main import app
from app.models import Record, YearReviewSharePackage, YearReviewSnapshot
from app.services.year_review_snapshots import (
    YEAR_REVIEW_GENERATION_BATCH_SIZE,
    generate_missing_year_review_snapshots,
    validate_completed_year_review_year,
)
from tests.helpers import create_account_and_profile, create_record


@fixture(autouse=True)
def disable_unmocked_year_review_ai(monkeypatch: MonkeyPatch) -> None:
    from app.services import year_review_snapshots

    monkeypatch.setattr(
        year_review_snapshots,
        "get_settings",
        lambda: get_settings().model_copy(
            update={"deepseek_parser_url": "", "deepseek_api_key": ""}
        ),
    )


def test_year_review_scheduler_defaults_to_previous_calendar_year() -> None:
    assert default_target_year(datetime(2026, 1, 1, 0, 15, tzinfo=UTC)) == 2025
    assert default_target_year(datetime(2026, 12, 31, 23, 59, tzinfo=UTC)) == 2025
    assert validate_completed_year_review_year(2025, datetime(2026, 1, 1, 0, 15, tzinfo=UTC)) == 2025
    assert validate_completed_year_review_year(2024, datetime(2026, 1, 1, 0, 15, tzinfo=UTC)) == 2024
    with raises(ValueError, match="year_review_year_not_completed"):
        validate_completed_year_review_year(2026, datetime(2026, 1, 1, 0, 15, tzinfo=UTC))



def test_year_review_share_package_constraints_are_declared_on_share_package_model() -> None:
    expected_constraints = {
        "ck_year_review_share_packages_privacy_level",
        "ck_year_review_share_packages_asset_kind",
        "ck_year_review_share_packages_checksum_len",
        "ck_year_review_share_packages_status",
        "ck_year_review_share_packages_last_result",
    }
    share_package_table = cast(Table, YearReviewSharePackage.__table__)
    snapshot_table = cast(Table, YearReviewSnapshot.__table__)
    share_package_constraints = {constraint.name for constraint in share_package_table.constraints}
    snapshot_constraints = {constraint.name for constraint in snapshot_table.constraints}

    assert expected_constraints.issubset(share_package_constraints)
    assert expected_constraints.isdisjoint(snapshot_constraints)


def test_year_review_summarizes_previous_year_records() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "year-review")
    first_day = datetime(2025, 1, 1, 8, 0, tzinfo=UTC)

    create_record(
        client,
        account_id,
        profile_id,
        "glucose",
        first_day,
        {"value": 120, "unit": "mg/dL", "meal_timing": "before_meal"},
    )
    create_record(
        client,
        account_id,
        profile_id,
        "glucose",
        first_day + timedelta(days=1),
        {"value": 160, "unit": "mg/dL", "meal_timing": "after_meal"},
    )
    create_record(
        client,
        account_id,
        profile_id,
        "meal",
        first_day + timedelta(days=1, hours=1),
        {"food_items": [{"name": "飯", "amount": "半碗"}], "meal_type": "lunch"},
    )
    create_record(
        client,
        account_id,
        profile_id,
        "exercise",
        first_day + timedelta(days=2),
        {"activity": "散步", "minutes": 20},
    )
    create_record(
        client,
        account_id,
        profile_id,
        "glucose",
        first_day + timedelta(days=2, hours=1),
        {"value": 400, "unit": "mg/dL", "meal_timing": "after_meal"},
    )
    with SessionLocal() as db:
        soft_deleted_record = db.scalar(
            select(Record).where(
                Record.profile_id == UUID(profile_id),
                Record.record_type == "glucose",
                Record.payload["value"].as_integer() == 400,
            )
        )
        assert soft_deleted_record is not None
        soft_deleted_record.deleted_at = datetime.now(UTC)
        db.commit()

    response = client.get(
        f"/year-reviews/2025?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["snapshot_id"] is not None
    assert body["source"] == "snapshot"
    assert body["generated_at"] is not None
    assert body["generated_for_previous_year"] is True
    assert {item["key"]: item["value"] for item in body["annual_stats"]} == {
        "record_days": 3,
        "glucose_count": 2,
        "meal_count": 1,
        "exercise_count": 1,
        "longest_streak_days": 3,
    }
    assert {item["key"]: item["value"] for item in body["health_outcomes"]} == {
        "average_glucose": 140.0,
        "highest_glucose": 160,
        "lowest_glucose": 120,
    }
    assert {item["key"]: item["label"] for item in body["health_outcomes"]} == {
        "average_glucose": "年平均血糖",
        "highest_glucose": "年度最高血糖",
        "lowest_glucose": "年度最低血糖",
    }
    ai_summary_by_kind = {item["kind"]: item["text"] for item in body["ai_summary"]}
    assert set(ai_summary_by_kind) == {"important_observation", "encouragement"}
    assert "2025 年共記錄 3 天" in ai_summary_by_kind["important_observation"]
    assert "血糖記錄 2 次" in ai_summary_by_kind["important_observation"]
    assert "年平均血糖 140.0 mg/dL" in ai_summary_by_kind["important_observation"]
    assert ai_summary_by_kind["encouragement"]
    sensitive_share_text_fragments = (
        "average_glucose",
        "highest_glucose",
        "lowest_glucose",
        "年平均血糖",
        "年度最高血糖",
        "年度最低血糖",
        "140.0",
        "160",
        "120",
        "mg/dL",
    )
    sensitive_svg_fragments = (
        "average_glucose",
        "highest_glucose",
        "lowest_glucose",
        "年平均血糖",
        "年度最高血糖",
        "年度最低血糖",
        "140.0 mg/dL",
        ">140.0<",
        ">160<",
        ">120<",
    )

    create_record(
        client,
        account_id,
        profile_id,
        "glucose",
        first_day + timedelta(days=3),
        {"value": 180, "unit": "mg/dL", "meal_timing": "after_meal"},
    )
    second_response = client.get(
        f"/year-reviews/2025?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
    )
    assert second_response.status_code == 200
    second_body = second_response.json()
    assert second_body["snapshot_id"] == body["snapshot_id"]
    assert {item["key"]: item["value"] for item in second_body["annual_stats"]} == {
        "record_days": 3,
        "glucose_count": 2,
        "meal_count": 1,
        "exercise_count": 1,
        "longest_streak_days": 3,
    }

    share_card_response = client.get(
        f"/year-reviews/2025/share-card?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
    )
    assert share_card_response.status_code == 200
    share_card = share_card_response.json()
    assert share_card["snapshot_id"] == body["snapshot_id"]
    assert share_card["privacy_level"] == "public_summary"
    assert share_card["privacy_mask_applied"] is True
    assert share_card["external_share_enabled"] is False
    assert {item["key"] for item in share_card["metrics"]} == {
        "record_days",
        "longest_streak_days",
        "meal_count",
        "exercise_count",
    }
    for fragment in sensitive_share_text_fragments:
        assert fragment not in share_card["share_text"]

    share_asset_response = client.get(
        f"/year-reviews/2025/share-card/asset?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
    )
    assert share_asset_response.status_code == 200
    share_asset = share_asset_response.json()
    assert share_asset["snapshot_id"] == body["snapshot_id"]
    assert share_asset["asset_kind"] == "svg_card"
    assert share_asset["mime_type"] == "image/svg+xml"
    assert share_asset["privacy_mask_applied"] is True
    assert share_asset["external_share_enabled"] is False
    assert len(share_asset["checksum_sha256"]) == 64
    assert share_asset["svg_text"].startswith("<svg")
    assert "記錄天數" in share_asset["svg_text"]
    for fragment in sensitive_svg_fragments:
        assert fragment not in share_asset["svg_text"]

    unacknowledged_response = client.post(
        f"/year-reviews/2025/share-card/confirm?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
        json={"privacy_acknowledged": False},
    )
    assert unacknowledged_response.status_code == 409
    assert unacknowledged_response.json()["detail"]["code"] == "privacy_acknowledgement_required"
    with SessionLocal() as db:
        unacknowledged_packages = list(
            db.scalars(
                select(YearReviewSharePackage).where(
                    YearReviewSharePackage.profile_id == UUID(profile_id),
                    YearReviewSharePackage.year == 2025,
                )
            )
        )
    assert unacknowledged_packages == []

    confirmed_response = client.post(
        f"/year-reviews/2025/share-card/confirm?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
        json={"privacy_acknowledged": True},
    )
    assert confirmed_response.status_code == 200
    share_package = confirmed_response.json()
    share_package_id = share_package["share_package_id"]
    assert share_package["snapshot_id"] == body["snapshot_id"]
    assert share_package["status"] == "confirmed"
    assert share_package["confirmed_at"]
    assert share_package["shared_at"] is None
    assert share_package["revoked_at"] is None
    assert share_package["privacy_mask_applied"] is True
    assert share_package["external_share_enabled"] is True
    assert share_package["asset"]["external_share_enabled"] is False
    assert share_package["asset"]["checksum_sha256"] == share_asset["checksum_sha256"]
    for fragment in sensitive_share_text_fragments:
        assert fragment not in share_package["share_text"]
    for fragment in sensitive_svg_fragments:
        assert fragment not in share_package["asset"]["svg_text"]
    public_package_json = json.dumps(share_package, ensure_ascii=False)
    for fragment in (
        "annual_stats",
        "health_outcomes",
        "ai_summary",
        "summary_json",
        "average_glucose",
        "highest_glucose",
        "lowest_glucose",
        "年平均血糖",
        "年度最高血糖",
        "年度最低血糖",
        "140.0",
        "mg/dL",
    ):
        assert fragment not in public_package_json

    package_status_response = client.get(
        f"/year-reviews/share-packages/{share_package_id}",
        headers={"X-Account-Id": account_id},
    )
    assert package_status_response.status_code == 200
    assert package_status_response.json()["status"] == "confirmed"

    other_account_id, _ = create_account_and_profile(client, "year-review-share-other")
    unauthorized_status_response = client.get(
        f"/year-reviews/share-packages/{share_package_id}",
        headers={"X-Account-Id": other_account_id},
    )
    assert unauthorized_status_response.status_code == 404
    assert unauthorized_status_response.json()["detail"] == "Profile not found"
    unauthorized_open_response = client.post(
        f"/year-reviews/share-packages/{share_package_id}/result",
        headers={"X-Account-Id": other_account_id},
        json={"share_result": "opened"},
    )
    assert unauthorized_open_response.status_code == 404
    assert unauthorized_open_response.json()["detail"] == "Profile not found"
    unauthorized_revoke_response = client.post(
        f"/year-reviews/share-packages/{share_package_id}/revoke",
        headers={"X-Account-Id": other_account_id},
    )
    assert unauthorized_revoke_response.status_code == 404
    assert unauthorized_revoke_response.json()["detail"] == "Profile not found"
    owner_status_after_unauthorized_response = client.get(
        f"/year-reviews/share-packages/{share_package_id}",
        headers={"X-Account-Id": account_id},
    )
    assert owner_status_after_unauthorized_response.status_code == 200
    owner_status_after_unauthorized = owner_status_after_unauthorized_response.json()
    assert owner_status_after_unauthorized["status"] == "confirmed"
    assert owner_status_after_unauthorized["shared_at"] is None
    assert owner_status_after_unauthorized["revoked_at"] is None

    invalid_share_result_response = client.post(
        f"/year-reviews/share-packages/{share_package_id}/result",
        headers={"X-Account-Id": account_id},
        json={"share_result": "posted"},
    )
    assert invalid_share_result_response.status_code == 422
    owner_status_after_invalid_result_response = client.get(
        f"/year-reviews/share-packages/{share_package_id}",
        headers={"X-Account-Id": account_id},
    )
    assert owner_status_after_invalid_result_response.status_code == 200
    owner_status_after_invalid_result = owner_status_after_invalid_result_response.json()
    assert owner_status_after_invalid_result["status"] == "confirmed"
    assert owner_status_after_invalid_result["shared_at"] is None
    assert owner_status_after_invalid_result["revoked_at"] is None

    opened_response = client.post(
        f"/year-reviews/share-packages/{share_package_id}/result",
        headers={"X-Account-Id": account_id},
        json={"share_result": "opened"},
    )
    assert opened_response.status_code == 200
    opened_package = opened_response.json()
    assert opened_package["status"] == "opened"
    assert opened_package["shared_at"]

    opened_then_dismissed_response = client.post(
        f"/year-reviews/share-packages/{share_package_id}/result",
        headers={"X-Account-Id": account_id},
        json={"share_result": "dismissed"},
    )
    assert opened_then_dismissed_response.status_code == 200
    opened_then_dismissed_package = opened_then_dismissed_response.json()
    assert opened_then_dismissed_package["status"] == "opened"
    assert opened_then_dismissed_package["shared_at"] == opened_package["shared_at"]
    with SessionLocal() as db:
        opened_share_package_row = db.get(YearReviewSharePackage, UUID(share_package_id))
        assert opened_share_package_row is not None
        assert opened_share_package_row.status == "opened"
        assert opened_share_package_row.last_share_result == "dismissed"

    dismissed_confirm_response = client.post(
        f"/year-reviews/2025/share-card/confirm?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
        json={"privacy_acknowledged": True},
    )
    assert dismissed_confirm_response.status_code == 200
    dismissed_share_package_id = dismissed_confirm_response.json()["share_package_id"]
    dismissed_response = client.post(
        f"/year-reviews/share-packages/{dismissed_share_package_id}/result",
        headers={"X-Account-Id": account_id},
        json={"share_result": "dismissed"},
    )
    assert dismissed_response.status_code == 200
    dismissed_package = dismissed_response.json()
    assert dismissed_package["status"] == "dismissed"
    assert dismissed_package["shared_at"] is None
    assert dismissed_package["revoked_at"] is None
    with SessionLocal() as db:
        dismissed_share_package_row = db.get(YearReviewSharePackage, UUID(dismissed_share_package_id))
        assert dismissed_share_package_row is not None
        assert dismissed_share_package_row.status == "dismissed"
        assert dismissed_share_package_row.last_share_result == "dismissed"

    revoked_response = client.post(
        f"/year-reviews/share-packages/{share_package_id}/revoke",
        headers={"X-Account-Id": account_id},
    )
    assert revoked_response.status_code == 200
    revoked_package = revoked_response.json()
    assert revoked_package["status"] == "revoked"
    assert revoked_package["revoked_at"]

    second_revoked_response = client.post(
        f"/year-reviews/share-packages/{share_package_id}/revoke",
        headers={"X-Account-Id": account_id},
    )
    assert second_revoked_response.status_code == 200
    second_revoked_package = second_revoked_response.json()
    assert second_revoked_package["status"] == "revoked"
    assert second_revoked_package["revoked_at"] == revoked_package["revoked_at"]

    revoked_update_response = client.post(
        f"/year-reviews/share-packages/{share_package_id}/result",
        headers={"X-Account-Id": account_id},
        json={"share_result": "dismissed"},
    )
    assert revoked_update_response.status_code == 409
    assert revoked_update_response.json()["detail"]["code"] == "share_package_revoked"


def test_year_review_uses_deepseek_for_bounded_ai_summary_when_configured(
    monkeypatch: MonkeyPatch,
) -> None:
    from app.services import year_review_snapshots

    captured_requests: list[dict[str, object]] = []

    class FakeResponse:
        def __enter__(self) -> "FakeResponse":
            return self

        def __exit__(self, *args: object) -> Literal[False]:
            return False

        def raise_for_status(self) -> None:
            return None

        def iter_text(self) -> list[str]:
            return [
                json.dumps(
                    {
                        "choices": [
                            {
                                "message": {
                                    "content": json.dumps(
                                        {
                                            "important_observation": "DeepSeek 年度觀察：記錄天數穩定，血糖紀錄可形成年度趨勢。",
                                            "encouragement": "DeepSeek 年度鼓勵：持續用簡短紀錄累積下一年度回顧。",
                                        },
                                        ensure_ascii=False,
                                    )
                                }
                            }
                        ]
                    },
                    ensure_ascii=False,
                )
            ]

    class FakeClient:
        def __init__(self, *, timeout: float) -> None:
            assert timeout == get_settings().local_llm_timeout_seconds

        def __enter__(self) -> "FakeClient":
            return self

        def __exit__(self, *args: object) -> Literal[False]:
            return False

        def stream(self, method: str, url: str, **kwargs: object) -> FakeResponse:
            assert method == "POST"
            assert url == "https://api.deepseek.com/v1/chat/completions"
            captured_requests.append(kwargs)
            return FakeResponse()

    monkeypatch.setattr(
        year_review_snapshots,
        "get_settings",
        lambda: get_settings().model_copy(
            update={
                "deepseek_parser_url": "https://api.deepseek.com/v1/chat/completions",
                "deepseek_api_key": "sk-year-review-test",
                "deepseek_model_id": "deepseek-chat",
            }
        ),
    )
    monkeypatch.setattr(httpx, "Client", FakeClient)

    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "year-review-deepseek")
    occurred_at = datetime(2025, 3, 2, 8, 0, tzinfo=UTC)
    create_record(
        client,
        account_id,
        profile_id,
        "glucose",
        occurred_at,
        {"value": 132, "unit": "mg/dL", "meal_timing": "before_meal"},
    )
    create_record(
        client,
        account_id,
        profile_id,
        "meal",
        occurred_at + timedelta(hours=1),
        {"food_items": [{"name": "測試飯糰"}], "meal_type": "breakfast"},
    )

    response = client.get(
        f"/year-reviews/2025?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
    )

    assert response.status_code == 200
    body = response.json()
    ai_summary_by_kind = {item["kind"]: item["text"] for item in body["ai_summary"]}
    assert ai_summary_by_kind == {
        "important_observation": "DeepSeek 年度觀察：記錄天數穩定，血糖紀錄可形成年度趨勢。",
        "encouragement": "DeepSeek 年度鼓勵：持續用簡短紀錄累積下一年度回顧。",
    }
    assert len(captured_requests) == 1
    request_body = captured_requests[0]["json"]
    assert isinstance(request_body, dict)
    assert request_body["model"] == "deepseek-chat"
    assert request_body["response_format"] == {"type": "json_object"}
    messages = request_body["messages"]
    assert isinstance(messages, list)
    assert "不可提供診療建議" in messages[0]["content"]
    aggregate_prompt = messages[1]["content"]
    assert "annual_stats" in aggregate_prompt
    assert "health_outcomes" in aggregate_prompt
    aggregate_payload = json.loads(aggregate_prompt)
    assert set(aggregate_payload) == {"year", "annual_stats", "health_outcomes", "instructions"}
    assert "只能使用上述聚合統計" in aggregate_payload["instructions"]
    assert "raw records" in aggregate_payload["instructions"]
    assert "測試飯糰" not in aggregate_prompt
    assert "food_items" not in aggregate_prompt
    assert "occurred_at" not in aggregate_prompt
    assert "profile_id" not in aggregate_prompt
    assert "raw_transcript" not in aggregate_prompt
    assert "raw prompt" not in aggregate_prompt
    assert "raw model output" not in aggregate_prompt


def test_year_review_reads_legacy_snapshot_with_badge_metrics() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "year-review-legacy-snapshot")
    legacy_annual_stats = [
        {"key": "record_days", "label": "本年度總記錄天數", "value": 2},
        {"key": "glucose_count", "label": "本年度血糖記錄次數", "value": 0},
        {"key": "meal_count", "label": "本年度飲食記錄次數", "value": 1},
        {"key": "exercise_count", "label": "本年度運動記錄次數", "value": 1},
        {"key": "longest_streak_days", "label": "最長連續記錄天數", "value": 2},
        {"key": "achieved_badges", "label": "達成徽章數量", "value": 1},
        {"key": "highest_badge_level", "label": "解鎖最高等級徽章", "value": 10},
    ]
    with SessionLocal() as db:
        db.add(
            YearReviewSnapshot(
                profile_id=UUID(profile_id),
                year=2024,
                summary_json={
                    "year": 2024,
                    "generated_for_previous_year": True,
                    "annual_stats": legacy_annual_stats,
                    "health_outcomes": [
                        {"key": "average_glucose", "label": "年平均血糖", "value": 0},
                        {"key": "highest_glucose", "label": "年度最高血糖", "value": 0},
                        {"key": "lowest_glucose", "label": "年度最低血糖", "value": 0},
                    ],
                    "ai_summary": [
                        {"kind": "important_observation", "text": "synthetic observation"},
                        {"kind": "encouragement", "text": "synthetic encouragement"},
                    ],
                },
                generated_at=datetime(2025, 1, 1, 0, 15, tzinfo=UTC),
            )
        )
        db.commit()

    response = client.get(
        f"/year-reviews/2024?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
    )
    assert response.status_code == 200
    assert len(response.json()["annual_stats"]) == 7

    share_card_response = client.get(
        f"/year-reviews/2024/share-card?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
    )
    assert share_card_response.status_code == 200
    share_card = share_card_response.json()
    assert {item["key"] for item in share_card["metrics"]} == {
        "record_days",
        "longest_streak_days",
        "meal_count",
        "exercise_count",
    }
    assert "徽章" not in share_card["share_text"]


def test_year_review_rejects_unfinished_year_before_snapshot_creation() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "year-review-unfinished-year")
    unfinished_year = datetime.now(UTC).year
    expected_detail = {
        "code": "year_review_year_not_completed",
        "message": "Year review can only be generated for completed calendar years.",
        "latest_completed_year": unfinished_year - 1,
    }

    for path, method, json_payload in (
        (f"/year-reviews/{unfinished_year}?profile_id={profile_id}", "get", None),
        (f"/year-reviews/{unfinished_year}/share-card?profile_id={profile_id}", "get", None),
        (f"/year-reviews/{unfinished_year}/share-card/asset?profile_id={profile_id}", "get", None),
        (
            f"/year-reviews/{unfinished_year}/share-card/confirm?profile_id={profile_id}",
            "post",
            {"privacy_acknowledged": True},
        ),
    ):
        if method == "post":
            response = client.post(path, headers={"X-Account-Id": account_id}, json=json_payload)
        else:
            response = client.get(path, headers={"X-Account-Id": account_id})
        assert response.status_code == 422
        assert response.json()["detail"] == expected_detail

    with SessionLocal() as db:
        snapshot = db.scalar(
            select(YearReviewSnapshot).where(
                YearReviewSnapshot.profile_id == UUID(profile_id),
                YearReviewSnapshot.year == unfinished_year,
            )
        )
        share_packages = list(
            db.scalars(
                select(YearReviewSharePackage).where(
                    YearReviewSharePackage.profile_id == UUID(profile_id),
                    YearReviewSharePackage.year == unfinished_year,
                )
            )
        )
    assert snapshot is None
    assert share_packages == []


def test_year_review_health_outcomes_ignore_bool_and_parse_numeric_strings() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "year-review-value-parsing")

    with SessionLocal() as db:
        db.add_all(
            [
                Record(
                    profile_id=UUID(profile_id),
                    record_type="glucose",
                    occurred_at=datetime(2025, 4, 1, 8, 0, tzinfo=UTC),
                    payload={"value": True, "unit": "mg/dL"},
                    metadata_json={},
                    source="legacy_import",
                ),
                Record(
                    profile_id=UUID(profile_id),
                    record_type="glucose",
                    occurred_at=datetime(2025, 4, 2, 8, 0, tzinfo=UTC),
                    payload={"value": " 120 ", "unit": "mg/dL"},
                    metadata_json={},
                    source="legacy_import",
                ),
                Record(
                    profile_id=UUID(profile_id),
                    record_type="glucose",
                    occurred_at=datetime(2025, 4, 3, 8, 0, tzinfo=UTC),
                    payload={"value": "not-a-number", "unit": "mg/dL"},
                    metadata_json={},
                    source="legacy_import",
                ),
                Record(
                    profile_id=UUID(profile_id),
                    record_type="glucose",
                    occurred_at=datetime(2025, 4, 4, 8, 0, tzinfo=UTC),
                    payload={"value": 160, "unit": "mg/dL"},
                    metadata_json={},
                    source="legacy_import",
                ),
            ]
        )
        db.commit()

    response = client.get(
        f"/year-reviews/2025?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
    )

    assert response.status_code == 200
    body = response.json()
    annual_stats = {item["key"]: item["value"] for item in body["annual_stats"]}
    health_outcomes = {item["key"]: item["value"] for item in body["health_outcomes"]}
    assert annual_stats["glucose_count"] == 4
    assert health_outcomes == {
        "average_glucose": 140.0,
        "highest_glucose": 160,
        "lowest_glucose": 120,
    }
    assert "年平均血糖 140.0 mg/dL" in body["ai_summary"][0]["text"]


def test_year_review_batch_generation_creates_missing_snapshots_once() -> None:
    client = TestClient(app)
    first_account_id, first_profile_id = create_account_and_profile(client, "year-review-batch-a")
    _, second_profile_id = create_account_and_profile(client, "year-review-batch-b")
    create_record(
        client,
        first_account_id,
        first_profile_id,
        "glucose",
        datetime(2024, 1, 1, 8, 0, tzinfo=UTC),
        {"value": 118, "unit": "mg/dL", "meal_timing": "before_meal"},
    )

    with SessionLocal() as db:
        created_count = 0
        scanned_count = 0
        while True:
            batch_created_count, batch_scanned_count = generate_missing_year_review_snapshots(
                year=2024,
                db=db,
                batch_size=500,
            )
            db.commit()
            created_count += batch_created_count
            scanned_count += batch_scanned_count
            if batch_scanned_count == 0:
                break
        first_snapshot = db.scalar(
            select(YearReviewSnapshot).where(
                YearReviewSnapshot.profile_id == UUID(first_profile_id),
                YearReviewSnapshot.year == 2024,
            )
        )
        second_snapshot = db.scalar(
            select(YearReviewSnapshot).where(
                YearReviewSnapshot.profile_id == UUID(second_profile_id),
                YearReviewSnapshot.year == 2024,
            )
        )
        assert first_snapshot is not None
        first_snapshot_id = first_snapshot.id
        first_generated_at = first_snapshot.generated_at
        first_summary_json = deepcopy(first_snapshot.summary_json)

    create_record(
        client,
        first_account_id,
        first_profile_id,
        "glucose",
        datetime(2024, 1, 2, 8, 0, tzinfo=UTC),
        {"value": 130, "unit": "mg/dL", "meal_timing": "after_meal"},
    )

    with SessionLocal() as db:
        second_created_count, second_scanned_count = generate_missing_year_review_snapshots(
            year=2024,
            db=db,
            batch_size=500,
        )
        db.commit()
        unchanged_first_snapshot = db.scalar(
            select(YearReviewSnapshot).where(
                YearReviewSnapshot.profile_id == UUID(first_profile_id),
                YearReviewSnapshot.year == 2024,
            )
        )

    assert created_count >= 2
    assert scanned_count >= 2
    assert second_snapshot is not None
    assert first_summary_json["annual_stats"][1]["value"] == 1
    assert second_snapshot.summary_json["annual_stats"][1]["value"] == 0
    assert second_created_count == 0
    assert second_scanned_count == 0
    assert unchanged_first_snapshot is not None
    assert unchanged_first_snapshot.id == first_snapshot_id
    assert unchanged_first_snapshot.generated_at == first_generated_at
    assert unchanged_first_snapshot.summary_json == first_summary_json


def test_year_review_batch_generation_rejects_invalid_batch_size() -> None:
    with SessionLocal() as db:
        with raises(ValueError, match="batch_size must be positive"):
            generate_missing_year_review_snapshots(year=2024, db=db, batch_size=0)
        with raises(ValueError, match="batch_size exceeds maximum"):
            generate_missing_year_review_snapshots(
                year=2024,
                db=db,
                batch_size=YEAR_REVIEW_GENERATION_BATCH_SIZE + 1,
            )


def test_year_review_batch_generation_rejects_unfinished_year_before_snapshot_creation() -> None:
    client = TestClient(app)
    _, profile_id = create_account_and_profile(client, "year-review-batch-unfinished")
    unfinished_year = datetime.now(UTC).year

    with SessionLocal() as db:
        with raises(ValueError, match="year_review_year_not_completed"):
            generate_missing_year_review_snapshots(year=unfinished_year, db=db, batch_size=1)
        snapshot = db.scalar(
            select(YearReviewSnapshot).where(
                YearReviewSnapshot.profile_id == UUID(profile_id),
                YearReviewSnapshot.year == unfinished_year,
            )
        )

    assert snapshot is None
