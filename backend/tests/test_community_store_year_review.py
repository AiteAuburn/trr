from copy import deepcopy
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from fastapi.testclient import TestClient
from pytest import raises
from sqlalchemy import select

from app.db.session import SessionLocal
from app.jobs.generate_year_review_snapshots import default_target_year
from app.main import app
from app.models import AchievementUnlock, FoodItem, Record, StoreRedemption, YearReviewSharePackage, YearReviewSnapshot
from app.services.year_review_snapshots import (
    YEAR_REVIEW_GENERATION_BATCH_SIZE,
    generate_missing_year_review_snapshots,
    validate_completed_year_review_year,
)
from tests.helpers import create_account_and_profile, create_record


def test_year_review_scheduler_defaults_to_previous_calendar_year() -> None:
    assert default_target_year(datetime(2026, 1, 1, 0, 15, tzinfo=UTC)) == 2025
    assert default_target_year(datetime(2026, 12, 31, 23, 59, tzinfo=UTC)) == 2025
    assert validate_completed_year_review_year(2025, datetime(2026, 1, 1, 0, 15, tzinfo=UTC)) == 2025
    with raises(ValueError, match="year_review_year_not_completed"):
        validate_completed_year_review_year(2026, datetime(2026, 1, 1, 0, 15, tzinfo=UTC))


def test_achievement_summary_calculates_mvp_badge_progress() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "achievement-summary")
    first_day = datetime(2026, 2, 1, 8, 0, tzinfo=UTC)

    for offset in range(10):
        create_record(
            client,
            account_id,
            profile_id,
            "glucose",
            first_day + timedelta(days=offset),
            {"value": 100 + offset, "unit": "mg/dL", "meal_timing": "before_meal"},
        )

    create_record(
        client,
        account_id,
        profile_id,
        "meal",
        first_day,
        {"meal_type": "breakfast", "food_items": [{"name": "飯"}]},
    )

    response = client.get(
        f"/achievements/summary?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["levels"] == [10, 50, 100, 150, 200, 250]
    assert body["unlocked_count"] == 2
    assert body["persisted_unlocked_count"] == 0
    assert body["newly_unlocked_count"] == 0
    assert body["next_remaining"] == 9
    assert len(body["items"]) == 36
    by_id = {item["id"]: item for item in body["items"]}
    assert by_id["glucose-cumulative-10"]["progress"] == 10
    assert by_id["glucose-cumulative-10"]["target"] == 10
    assert by_id["glucose-cumulative-10"]["unlocked"] is True
    assert by_id["glucose-cumulative-10"]["unlocked_at"] is None
    assert by_id["glucose-streak-10"]["progress"] == 10
    assert by_id["glucose-streak-10"]["badge_color"] == "#8B5CF6"
    assert by_id["meal-cumulative-10"]["progress"] == 1
    assert by_id["exercise-cumulative-10"]["progress"] == 0
    expected_levels = [10, 50, 100, 150, 200, 250]
    expected_level_colors = ["#8DB7A5", "#3FA67F", "#2F8F72", "#D97706", "#B45309", "#2563EB"]
    expected_category_icons = {
        "glucose": "血",
        "meal": "食",
        "exercise": "動",
    }
    for category, icon in expected_category_icons.items():
        category_items = [item for item in body["items"] if item["category"] == category]
        assert len(category_items) == 12
        cumulative_items = [item for item in category_items if item["kind"] == "cumulative"]
        streak_items = [item for item in category_items if item["kind"] == "streak"]
        assert [item["level"] for item in cumulative_items] == expected_levels
        assert [item["level"] for item in streak_items] == expected_levels
        assert [item["badge_color"] for item in cumulative_items] == expected_level_colors
        assert {item["icon"] for item in cumulative_items} == {icon}
        assert {item["kind_label"] for item in cumulative_items} == {"累積型"}
        assert {item["icon"] for item in streak_items} == {"連"}
        assert {item["badge_color"] for item in streak_items} == {"#8B5CF6"}
        assert {item["kind_label"] for item in streak_items} == {"連續型"}

    sync_response = client.post(
        f"/achievements/sync?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
    )
    assert sync_response.status_code == 200
    synced_body = sync_response.json()
    assert synced_body["unlocked_count"] == 2
    assert synced_body["persisted_unlocked_count"] == 2
    assert synced_body["newly_unlocked_count"] == 2
    synced_by_id = {item["id"]: item for item in synced_body["items"]}
    assert synced_by_id["glucose-cumulative-10"]["unlocked_at"]
    assert synced_by_id["glucose-cumulative-10"]["newly_unlocked"] is True
    assert synced_by_id["glucose-streak-10"]["unlocked_at"]
    assert synced_by_id["glucose-streak-10"]["newly_unlocked"] is True

    unlocks_response = client.get(
        f"/achievements/unlocks?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
    )
    assert unlocks_response.status_code == 200
    unlocked_items = unlocks_response.json()
    assert [item["id"] for item in unlocked_items] == [
        "glucose-streak-10",
        "glucose-cumulative-10",
    ]
    assert all(item["unlocked"] is True for item in unlocked_items)
    assert all(item["unlocked_at"] for item in unlocked_items)

    second_sync_response = client.post(
        f"/achievements/sync?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
    )
    assert second_sync_response.status_code == 200
    second_synced_body = second_sync_response.json()
    assert second_synced_body["persisted_unlocked_count"] == 2
    assert second_synced_body["newly_unlocked_count"] == 0
    assert not any(item["newly_unlocked"] for item in second_synced_body["items"])

    with SessionLocal() as db:
        unlocks = list(
            db.scalars(
                select(AchievementUnlock).where(AchievementUnlock.profile_id == UUID(profile_id))
            )
        )
    assert {unlock.achievement_id for unlock in unlocks} == {
        "glucose-cumulative-10",
        "glucose-streak-10",
    }

    with SessionLocal() as db:
        soft_deleted_record = db.scalar(
            select(Record)
            .where(
                Record.profile_id == UUID(profile_id),
                Record.record_type == "glucose",
                Record.deleted_at.is_(None),
            )
            .order_by(Record.occurred_at.asc())
        )
        assert soft_deleted_record is not None
        soft_deleted_record.deleted_at = datetime.now(UTC)
        db.commit()

    after_delete_response = client.get(
        f"/achievements/summary?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
    )
    assert after_delete_response.status_code == 200
    after_delete_body = after_delete_response.json()
    assert after_delete_body["unlocked_count"] == 2
    assert after_delete_body["persisted_unlocked_count"] == 2
    after_delete_by_id = {item["id"]: item for item in after_delete_body["items"]}
    assert after_delete_by_id["glucose-cumulative-10"]["progress"] == 9
    assert after_delete_by_id["glucose-cumulative-10"]["unlocked"] is True
    assert after_delete_by_id["glucose-cumulative-10"]["unlocked_at"]
    assert after_delete_by_id["glucose-streak-10"]["progress"] == 9
    assert after_delete_by_id["glucose-streak-10"]["unlocked"] is True
    assert after_delete_by_id["glucose-streak-10"]["unlocked_at"]


def test_achievement_summary_extends_levels_after_base_ladder() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "achievement-dynamic-levels")
    first_day = datetime(2026, 3, 1, 8, 0, tzinfo=UTC)

    with SessionLocal() as db:
        db.add_all(
            Record(
                profile_id=UUID(profile_id),
                record_type="glucose",
                occurred_at=first_day + timedelta(days=offset),
                payload={"value": 100 + (offset % 40), "unit": "mg/dL", "meal_timing": "before_meal"},
                metadata_json={},
                source="manual",
            )
            for offset in range(250)
        )
        db.commit()

    response = client.get(
        f"/achievements/summary?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["levels"] == [10, 50, 100, 150, 200, 250, 300]
    assert body["unlocked_count"] == 12
    assert body["next_remaining"] == 10
    assert len(body["items"]) == 42
    by_id = {item["id"]: item for item in body["items"]}
    assert by_id["glucose-cumulative-250"]["unlocked"] is True
    assert by_id["glucose-streak-250"]["unlocked"] is True
    assert by_id["glucose-cumulative-300"]["progress"] == 250
    assert by_id["glucose-cumulative-300"]["target"] == 300
    assert by_id["glucose-cumulative-300"]["unlocked"] is False
    assert by_id["glucose-streak-300"]["progress"] == 250
    assert by_id["glucose-streak-300"]["target"] == 300
    assert by_id["glucose-streak-300"]["unlocked"] is False

    sync_response = client.post(
        f"/achievements/sync?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
    )
    assert sync_response.status_code == 200
    synced_body = sync_response.json()
    assert synced_body["persisted_unlocked_count"] == 12
    assert synced_body["newly_unlocked_count"] == 12
    assert not any(item["id"].endswith("-300") and item["unlocked_at"] for item in synced_body["items"])


def test_food_categories_endpoint_returns_required_taxonomy() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "community-food-categories")

    response = client.get(
        "/community/foods/categories",
        headers={"X-Account-Id": account_id},
    )

    assert response.status_code == 200
    body = response.json()
    assert [(item["code"], item["label"]) for item in body] == [
        ("vegetables", "蔬菜"),
        ("meat", "肉類"),
        ("seafood", "海鮮"),
        ("eggs", "蛋類"),
        ("beans", "豆類"),
        ("starches", "澱粉類"),
        ("drinks", "飲料"),
        ("fruit", "水果"),
        ("snacks", "零食"),
        ("supplements", "保健食品"),
    ]
    assert all(item["food_count"] >= 0 for item in body)
    assert all(len(item["sample_foods"]) <= 3 for item in body)


def test_food_categories_include_individual_food_summary() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "community-food-category-summary")
    names = [f"分類青菜 {index} {uuid4()}" for index in range(4)]
    before_response = client.get(
        "/community/foods/categories",
        headers={"X-Account-Id": account_id},
    )
    assert before_response.status_code == 200
    before_categories = {item["code"]: item for item in before_response.json()}
    previous_count = before_categories["vegetables"]["food_count"]

    with SessionLocal() as db:
        latest_created_at = db.scalar(
            select(FoodItem.created_at)
            .where(FoodItem.category == "vegetables")
            .order_by(FoodItem.created_at.desc())
            .limit(1)
        )
        created_at = (latest_created_at or datetime(2099, 1, 3, 8, 0, tzinfo=UTC)) + timedelta(minutes=1)
        db.add_all(
            FoodItem(
                category="vegetables",
                name=name,
                normalized_name=name.lower(),
                created_by_account_id=UUID(account_id),
                created_at=created_at + timedelta(minutes=index),
            )
            for index, name in enumerate(names)
        )
        db.commit()

    response = client.get(
        "/community/foods/categories",
        headers={"X-Account-Id": account_id},
    )

    assert response.status_code == 200
    categories = {item["code"]: item for item in response.json()}
    assert categories["vegetables"]["food_count"] == previous_count + 4
    assert categories["vegetables"]["sample_foods"] == list(reversed(names[-3:]))


def test_food_share_normalizes_text_fields_and_rejects_blank_names() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "community-food-normalization")
    food_name = f"side-effect-food-{uuid4()}"
    invalid_glucose_food_name = f"invalid-glucose-food-{uuid4()}"

    blank_response = client.post(
        "/community/foods/shares",
        headers={"X-Account-Id": account_id},
        json={
            "food_name": "   ",
            "category": "vegetables",
            "eaten_at": datetime(2026, 1, 2, 12, 0, tzinfo=UTC).isoformat(),
            "before_glucose": 100,
            "after_glucose": 110,
        },
    )
    assert blank_response.status_code == 422
    assert blank_response.json()["detail"] == {
        "code": "food_name_blank",
        "message": "Food share name must not be blank.",
    }
    blank_name_foods_response = client.get(
        "/community/foods?query=food_name_blank",
        headers={"X-Account-Id": account_id},
    )
    assert blank_name_foods_response.status_code == 200
    assert blank_name_foods_response.json() == []
    blank_name_points_response = client.get("/store/points", headers={"X-Account-Id": account_id})
    assert blank_name_points_response.status_code == 200
    assert blank_name_points_response.json() == {
        "balance": 0,
        "lifetime_earned": 0,
        "lifetime_redeemed": 0,
    }

    null_name_response = client.post(
        "/community/foods/shares",
        headers={"X-Account-Id": account_id},
        json={
            "food_name": None,
            "category": "vegetables",
            "eaten_at": datetime(2026, 1, 2, 12, 30, tzinfo=UTC).isoformat(),
            "before_glucose": 100,
            "after_glucose": 110,
        },
    )
    assert null_name_response.status_code == 422

    future_time_response = client.post(
        "/community/foods/shares",
        headers={"X-Account-Id": account_id},
        json={
            "food_name": food_name,
            "category": "vegetables",
            "eaten_at": (datetime.now(UTC) + timedelta(days=1)).isoformat(),
            "before_glucose": 100,
            "after_glucose": 110,
        },
    )
    assert future_time_response.status_code == 400
    assert future_time_response.json()["detail"] == {
        "code": "invalid_record_time",
        "message": "eaten_at must not be in the future.",
    }

    naive_time_response = client.post(
        "/community/foods/shares",
        headers={"X-Account-Id": account_id},
        json={
            "food_name": food_name,
            "category": "vegetables",
            "eaten_at": "2026-01-02T13:00:00",
            "before_glucose": 100,
            "after_glucose": 110,
        },
    )
    assert naive_time_response.status_code == 400
    assert naive_time_response.json()["detail"] == {
        "code": "invalid_datetime",
        "field": "eaten_at",
        "message": "datetime must include a timezone.",
    }

    rejected_time_foods_response = client.get(
        f"/community/foods?query={food_name}",
        headers={"X-Account-Id": account_id},
    )
    assert rejected_time_foods_response.status_code == 200
    assert rejected_time_foods_response.json() == []
    rejected_time_points_response = client.get("/store/points", headers={"X-Account-Id": account_id})
    assert rejected_time_points_response.status_code == 200
    assert rejected_time_points_response.json() == {
        "balance": 0,
        "lifetime_earned": 0,
        "lifetime_redeemed": 0,
    }

    invalid_glucose_response = client.post(
        "/community/foods/shares",
        headers={"X-Account-Id": account_id},
        json={
            "food_name": invalid_glucose_food_name,
            "category": "vegetables",
            "eaten_at": datetime(2026, 1, 2, 13, 30, tzinfo=UTC).isoformat(),
            "before_glucose": 19,
            "after_glucose": 110,
        },
    )
    assert invalid_glucose_response.status_code == 422
    assert "before_glucose" in invalid_glucose_response.text
    invalid_glucose_foods_response = client.get(
        f"/community/foods?query={invalid_glucose_food_name}",
        headers={"X-Account-Id": account_id},
    )
    assert invalid_glucose_foods_response.status_code == 200
    assert invalid_glucose_foods_response.json() == []
    invalid_glucose_points_response = client.get("/store/points", headers={"X-Account-Id": account_id})
    assert invalid_glucose_points_response.status_code == 200
    assert invalid_glucose_points_response.json() == {
        "balance": 0,
        "lifetime_earned": 0,
        "lifetime_redeemed": 0,
    }

    response = client.post(
        "/community/foods/shares",
        headers={"X-Account-Id": account_id},
        json={
            "food_name": f"  {food_name}  ",
            "category": "vegetables",
            "eaten_at": datetime(2026, 1, 2, 13, 0, tzinfo=UTC).isoformat(),
            "before_glucose": 101,
            "after_glucose": 108,
            "serving_description": "   ",
            "public_note": "   ",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["food"]["name"] == food_name
    assert body["share"]["serving_description"] is None
    assert body["share"]["public_note"] is None


def test_food_share_creates_food_stats_points_and_leaderboards() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "community-food")
    food_name = f"糙米飯 {uuid4()}"
    display_name = f"公開糖友 {uuid4()}"

    response = client.post(
        "/community/foods/shares",
        headers={"X-Account-Id": account_id},
        json={
            "food_name": food_name,
            "category": "starches",
            "eaten_at": datetime(2026, 1, 2, 12, 0, tzinfo=UTC).isoformat(),
            "before_glucose": 108,
            "after_glucose": 154,
            "serving_description": "半碗",
            "public_note": "飯後散步 15 分鐘",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["awarded_points"] == 10
    assert body["share"]["glucose_delta"] == 46
    assert body["share"]["glucose_delta"] == body["share"]["after_glucose"] - body["share"]["before_glucose"]
    assert body["food"]["name"] == food_name
    assert body["food"]["category_label"] == "澱粉類"
    assert body["food"]["stats"] == {
        "share_count": 1,
        "average_glucose_delta": 46.0,
        "max_glucose_delta": 46,
        "min_glucose_delta": 46,
    }

    list_response = client.get(
        f"/community/foods?query={food_name}&category=starches",
        headers={"X-Account-Id": account_id},
    )
    assert list_response.status_code == 200
    assert [item["id"] for item in list_response.json()] == [body["food"]["id"]]

    points_response = client.get("/store/points", headers={"X-Account-Id": account_id})
    assert points_response.status_code == 200
    assert points_response.json()["balance"] == 10

    leaderboard_response = client.get(
        "/community/leaderboards?leaderboard_type=share_count",
        headers={"X-Account-Id": account_id},
    )
    assert leaderboard_response.status_code == 200
    assert all(item["account_id"] is None for item in leaderboard_response.json()["entries"])

    settings_response = client.patch(
        "/community/settings",
        headers={"X-Account-Id": account_id},
        json={"display_name": f"  {display_name}  ", "leaderboard_opt_in": True},
    )
    assert settings_response.status_code == 200
    assert settings_response.json() == {
        "display_name": display_name,
        "leaderboard_opt_in": True,
    }

    blank_settings_response = client.patch(
        "/community/settings",
        headers={"X-Account-Id": account_id},
        json={"display_name": "   "},
    )
    assert blank_settings_response.status_code == 422
    assert blank_settings_response.json()["detail"] == {
        "code": "community_display_name_blank",
        "message": "Community display name must not be blank.",
    }
    unchanged_settings_response = client.get("/community/settings", headers={"X-Account-Id": account_id})
    assert unchanged_settings_response.status_code == 200
    assert unchanged_settings_response.json() == {
        "display_name": display_name,
        "leaderboard_opt_in": True,
    }

    for offset in range(12):
        extra_response = client.post(
            "/community/foods/shares",
            headers={"X-Account-Id": account_id},
            json={
                "food_name": f"排行榜測試食物 {uuid4()}",
                "category": "vegetables",
                "eaten_at": (datetime(2026, 1, 3, 12, 0, tzinfo=UTC) + timedelta(minutes=offset)).isoformat(),
                "before_glucose": 100,
                "after_glucose": 110,
            },
        )
        assert extra_response.status_code == 201

    repeat_food_response = client.post(
        "/community/foods/shares",
        headers={"X-Account-Id": account_id},
        json={
            "food_name": food_name,
            "category": "starches",
            "eaten_at": datetime(2026, 1, 3, 14, 0, tzinfo=UTC).isoformat(),
            "before_glucose": 112,
            "after_glucose": 150,
        },
    )
    assert repeat_food_response.status_code == 201
    assert repeat_food_response.json()["food"]["id"] == body["food"]["id"]

    opted_in_leaderboard_response = client.get(
        "/community/leaderboards?leaderboard_type=share_count&limit=50",
        headers={"X-Account-Id": account_id},
    )
    assert opted_in_leaderboard_response.status_code == 200
    leaderboard_entries = opted_in_leaderboard_response.json()["entries"]
    matching_entry = next(item for item in leaderboard_entries if item["display_name"] == display_name)
    assert matching_entry["account_id"] is None
    assert matching_entry["score"] == 14
    assert matching_entry["display_name"] == display_name

    contribution_response = client.get(
        "/community/leaderboards?leaderboard_type=contribution&limit=50",
        headers={"X-Account-Id": account_id},
    )
    assert contribution_response.status_code == 200
    contribution_entries = contribution_response.json()["entries"]
    matching_contribution = next(item for item in contribution_entries if item["display_name"] == display_name)
    assert matching_contribution["account_id"] is None
    assert matching_contribution["score"] == 140
    assert matching_contribution["display_name"] == display_name

    food_tester_response = client.get(
        "/community/leaderboards?leaderboard_type=food_tester&limit=50",
        headers={"X-Account-Id": account_id},
    )
    assert food_tester_response.status_code == 200
    food_tester_entries = food_tester_response.json()["entries"]
    matching_food_tester = next(item for item in food_tester_entries if item["display_name"] == display_name)
    assert matching_food_tester["account_id"] is None
    assert matching_food_tester["score"] == 13
    assert matching_food_tester["display_name"] == display_name

    opt_out_response = client.patch(
        "/community/settings",
        headers={"X-Account-Id": account_id},
        json={"leaderboard_opt_in": False},
    )
    assert opt_out_response.status_code == 200
    assert opt_out_response.json() == {
        "display_name": display_name,
        "leaderboard_opt_in": False,
    }

    for leaderboard_type in ("share_count", "contribution", "food_tester"):
        opted_out_response = client.get(
            f"/community/leaderboards?leaderboard_type={leaderboard_type}&limit=50",
            headers={"X-Account-Id": account_id},
        )
        assert opted_out_response.status_code == 200
        assert all(item["display_name"] != display_name for item in opted_out_response.json()["entries"])


def test_food_share_merges_same_category_name_case_and_whitespace() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "community-food-normalized-name")
    food_name = f"Case Food {uuid4()}"

    first_response = client.post(
        "/community/foods/shares",
        headers={"X-Account-Id": account_id},
        json={
            "food_name": food_name,
            "category": "starches",
            "eaten_at": datetime(2026, 1, 2, 12, 0, tzinfo=UTC).isoformat(),
            "before_glucose": 100,
            "after_glucose": 140,
        },
    )
    assert first_response.status_code == 201
    first_body = first_response.json()

    second_response = client.post(
        "/community/foods/shares",
        headers={"X-Account-Id": account_id},
        json={
            "food_name": f"  {food_name.upper()}  ",
            "category": "starches",
            "eaten_at": datetime(2026, 1, 3, 12, 0, tzinfo=UTC).isoformat(),
            "before_glucose": 110,
            "after_glucose": 150,
        },
    )
    assert second_response.status_code == 201
    second_body = second_response.json()

    assert second_body["food"]["id"] == first_body["food"]["id"]
    assert second_body["food"]["name"] == food_name
    assert second_body["food"]["stats"] == {
        "share_count": 2,
        "average_glucose_delta": 40.0,
        "max_glucose_delta": 40,
        "min_glucose_delta": 40,
    }


def test_food_share_rejects_client_supplied_glucose_delta_without_side_effects() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "community-food-client-delta")
    food_name = f"client delta food {uuid4()}"

    response = client.post(
        "/community/foods/shares",
        headers={"X-Account-Id": account_id},
        json={
            "food_name": food_name,
            "category": "starches",
            "eaten_at": datetime(2026, 1, 2, 12, 0, tzinfo=UTC).isoformat(),
            "before_glucose": 108,
            "after_glucose": 154,
            "glucose_delta": -999,
            "serving_description": "半碗",
            "public_note": "飯後散步 15 分鐘",
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"] == {
        "code": "food_glucose_delta_client_supplied",
        "message": "glucose_delta is calculated by the server and must not be supplied.",
    }
    assert food_name not in response.text
    assert "飯後散步" not in response.text

    list_response = client.get(
        f"/community/foods?query={food_name}",
        headers={"X-Account-Id": account_id},
    )
    assert list_response.status_code == 200
    assert list_response.json() == []

    points_response = client.get("/store/points", headers={"X-Account-Id": account_id})
    assert points_response.status_code == 200
    assert points_response.json() == {
        "balance": 0,
        "lifetime_earned": 0,
        "lifetime_redeemed": 0,
    }


def test_food_detail_returns_share_records_stats_and_cross_category_search() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "community-food-detail")
    food_name = f"社群測試食物 {uuid4()}"

    first_response = client.post(
        "/community/foods/shares",
        headers={"X-Account-Id": account_id},
        json={
            "food_name": food_name,
            "category": "drinks",
            "eaten_at": datetime(2026, 1, 4, 12, 0, tzinfo=UTC).isoformat(),
            "before_glucose": 104,
            "after_glucose": 150,
            "serving_description": "一杯",
            "public_note": "飯後一小時測量",
        },
    )
    assert first_response.status_code == 201
    first_body = first_response.json()
    food_id = first_body["food"]["id"]

    second_response = client.post(
        "/community/foods/shares",
        headers={"X-Account-Id": account_id},
        json={
            "food_name": food_name,
            "category": "drinks",
            "eaten_at": datetime(2026, 1, 5, 12, 0, tzinfo=UTC).isoformat(),
            "before_glucose": 110,
            "after_glucose": 135,
            "serving_description": "半杯",
            "public_note": "份量較少",
        },
    )
    assert second_response.status_code == 201
    second_body = second_response.json()
    assert second_body["food"]["id"] == food_id
    assert second_body["share"]["glucose_delta"] == 25

    cross_category_response = client.post(
        "/community/foods/shares",
        headers={"X-Account-Id": account_id},
        json={
            "food_name": food_name,
            "category": "snacks",
            "eaten_at": datetime(2026, 1, 6, 12, 0, tzinfo=UTC).isoformat(),
            "before_glucose": 100,
            "after_glucose": 120,
            "serving_description": "一份",
            "public_note": "同名但不同分類",
        },
    )
    assert cross_category_response.status_code == 201
    cross_category_body = cross_category_response.json()
    assert cross_category_body["food"]["id"] != food_id
    assert cross_category_body["food"]["category"] == "snacks"
    assert cross_category_body["food"]["stats"] == {
        "share_count": 1,
        "average_glucose_delta": 20.0,
        "max_glucose_delta": 20,
        "min_glucose_delta": 20,
    }

    lower_after_response = client.post(
        "/community/foods/shares",
        headers={"X-Account-Id": account_id},
        json={
            "food_name": food_name,
            "category": "drinks",
            "eaten_at": datetime(2026, 1, 7, 12, 0, tzinfo=UTC).isoformat(),
            "before_glucose": 130,
            "after_glucose": 110,
            "serving_description": "少量",
            "public_note": "飯後有散步，血糖下降",
        },
    )
    assert lower_after_response.status_code == 201
    lower_after_body = lower_after_response.json()
    assert lower_after_body["food"]["id"] == food_id
    assert lower_after_body["share"]["glucose_delta"] == -20

    fuzzy_name = f"{food_name} 加料"
    fuzzy_response = client.post(
        "/community/foods/shares",
        headers={"X-Account-Id": account_id},
        json={
            "food_name": fuzzy_name,
            "category": "drinks",
            "eaten_at": datetime(2026, 1, 8, 12, 0, tzinfo=UTC).isoformat(),
            "before_glucose": 100,
            "after_glucose": 121,
            "serving_description": "加料版本",
            "public_note": "名稱包含原食物但不是同一項",
        },
    )
    assert fuzzy_response.status_code == 201
    fuzzy_body = fuzzy_response.json()

    search_response = client.get(
        f"/community/foods?query={food_name}",
        headers={"X-Account-Id": account_id},
    )
    assert search_response.status_code == 200
    search_items = search_response.json()
    assert {item["id"] for item in search_items} == {
        food_id,
        cross_category_body["food"]["id"],
        fuzzy_body["food"]["id"],
    }
    search_items_by_id = {item["id"]: item for item in search_items}
    assert search_items_by_id[food_id]["stats"] == {
        "share_count": 3,
        "average_glucose_delta": 17.0,
        "max_glucose_delta": 46,
        "min_glucose_delta": -20,
    }
    assert search_items_by_id[cross_category_body["food"]["id"]]["stats"] == {
        "share_count": 1,
        "average_glucose_delta": 20.0,
        "max_glucose_delta": 20,
        "min_glucose_delta": 20,
    }
    assert search_items_by_id[fuzzy_body["food"]["id"]]["stats"] == {
        "share_count": 1,
        "average_glucose_delta": 21.0,
        "max_glucose_delta": 21,
        "min_glucose_delta": 21,
    }
    assert search_items[-1]["id"] == fuzzy_body["food"]["id"]
    assert all("created_by_account_id" not in item for item in search_items)

    blank_search_response = client.get(
        "/community/foods?query=%20%20%20",
        headers={"X-Account-Id": account_id},
    )
    assert blank_search_response.status_code == 422
    assert blank_search_response.json()["detail"] == {
        "code": "food_query_blank",
        "message": "Food search query must not be blank.",
    }

    category_search_response = client.get(
        f"/community/foods?query={food_name}&category=drinks",
        headers={"X-Account-Id": account_id},
    )
    assert category_search_response.status_code == 200
    category_search_items = category_search_response.json()
    assert [item["id"] for item in category_search_items] == [food_id, fuzzy_body["food"]["id"]]

    detail_response = client.get(
        f"/community/foods/{food_id}",
        headers={"X-Account-Id": account_id},
    )
    assert detail_response.status_code == 200
    detail = detail_response.json()
    assert detail["name"] == food_name
    assert detail["category"] == "drinks"
    assert detail["category_label"] == "飲料"
    assert "created_by_account_id" not in detail
    assert detail["stats"] == {
        "share_count": 3,
        "average_glucose_delta": 17.0,
        "max_glucose_delta": 46,
        "min_glucose_delta": -20,
    }
    shares_by_id = {share["id"]: share for share in detail["shares"]}
    assert set(shares_by_id) == {first_body["share"]["id"], second_body["share"]["id"], lower_after_body["share"]["id"]}
    assert [share["id"] for share in detail["shares"]] == [
        lower_after_body["share"]["id"],
        second_body["share"]["id"],
        first_body["share"]["id"],
    ]
    assert shares_by_id[first_body["share"]["id"]]["glucose_delta"] == 46
    assert shares_by_id[first_body["share"]["id"]]["serving_description"] == "一杯"
    assert shares_by_id[first_body["share"]["id"]]["public_note"] == "飯後一小時測量"
    assert shares_by_id[second_body["share"]["id"]]["glucose_delta"] == 25
    assert shares_by_id[second_body["share"]["id"]]["serving_description"] == "半杯"
    assert shares_by_id[second_body["share"]["id"]]["public_note"] == "份量較少"
    assert shares_by_id[lower_after_body["share"]["id"]]["glucose_delta"] == -20
    assert shares_by_id[lower_after_body["share"]["id"]]["serving_description"] == "少量"
    assert shares_by_id[lower_after_body["share"]["id"]]["public_note"] == "飯後有散步，血糖下降"
    assert all("account_id" not in share for share in detail["shares"])
    assert all("profile_id" not in share for share in detail["shares"])

    missing_food_id = uuid4()
    missing_detail_response = client.get(
        f"/community/foods/{missing_food_id}",
        headers={"X-Account-Id": account_id},
    )
    assert missing_detail_response.status_code == 404
    assert missing_detail_response.json()["detail"] == {
        "code": "food_not_found",
        "message": "Food item not found.",
        "food_item_id": str(missing_food_id),
    }


def test_food_detail_limits_individual_share_records_to_latest_50() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "community-food-detail-limit")
    food_name = f"社群分享列表上限 {uuid4()}"
    created_share_ids: list[str] = []

    for offset in range(55):
        response = client.post(
            "/community/foods/shares",
            headers={"X-Account-Id": account_id},
            json={
                "food_name": food_name,
                "category": "snacks",
                "eaten_at": (
                    datetime(2026, 2, 1, 8, 0, tzinfo=UTC) + timedelta(hours=offset)
                ).isoformat(),
                "before_glucose": 100,
                "after_glucose": 110,
                "serving_description": f"第 {offset} 份",
                "public_note": f"第 {offset} 筆分享",
            },
        )
        assert response.status_code == 201
        body = response.json()
        food_id = body["food"]["id"]
        created_share_ids.append(body["share"]["id"])

    detail_response = client.get(
        f"/community/foods/{food_id}",
        headers={"X-Account-Id": account_id},
    )
    assert detail_response.status_code == 200
    detail = detail_response.json()

    assert detail["stats"] == {
        "share_count": 55,
        "average_glucose_delta": 10.0,
        "max_glucose_delta": 10,
        "min_glucose_delta": 10,
    }
    returned_share_ids = [share["id"] for share in detail["shares"]]
    assert len(returned_share_ids) == 50
    assert returned_share_ids == list(reversed(created_share_ids[5:]))
    assert set(created_share_ids[:5]).isdisjoint(returned_share_ids)


def test_food_search_limits_results_to_latest_matching_items() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "community-food-search-limit")
    food_prefix = f"large-db-search-{uuid4().hex}"
    created_food_ids: list[str] = []

    for offset in range(5):
        response = client.post(
            "/community/foods/shares",
            headers={"X-Account-Id": account_id},
            json={
                "food_name": f"{food_prefix}-{offset}",
                "category": "fruit",
                "eaten_at": (
                    datetime(2026, 2, 2, 8, 0, tzinfo=UTC) + timedelta(minutes=offset)
                ).isoformat(),
                "before_glucose": 100,
                "after_glucose": 108,
            },
        )
        assert response.status_code == 201
        created_food_ids.append(response.json()["food"]["id"])

    base_created_at = datetime(2026, 2, 3, 8, 0, tzinfo=UTC)
    with SessionLocal() as db:
        food_items = {
            str(food_item.id): food_item
            for food_item in db.scalars(
                select(FoodItem).where(FoodItem.id.in_([UUID(value) for value in created_food_ids]))
            )
        }
        for offset, food_id in enumerate(created_food_ids):
            food_items[food_id].created_at = base_created_at + timedelta(minutes=offset)
        db.commit()

    search_response = client.get(
        f"/community/foods?query={food_prefix}&limit=3",
        headers={"X-Account-Id": account_id},
    )
    assert search_response.status_code == 200
    search_items = search_response.json()
    assert len(search_items) == 3
    assert [item["id"] for item in search_items] == list(reversed(created_food_ids[-3:]))
    assert all(item["category"] == "fruit" for item in search_items)
    assert all(item["stats"]["share_count"] == 1 for item in search_items)
    assert set(created_food_ids[:2]).isdisjoint({item["id"] for item in search_items})


def test_food_search_treats_like_wildcards_as_literal_characters() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "community-food-search-literal")
    unique_suffix = str(uuid4())
    plain_name = f"literal search plain {unique_suffix}"
    percent_name = f"literal search 100% yogurt {unique_suffix}"
    underscore_name = f"literal search low_gi snack {unique_suffix}"
    backslash_name = f"literal search slash\\snack {unique_suffix}"

    for food_name in (plain_name, percent_name, underscore_name, backslash_name):
        response = client.post(
            "/community/foods/shares",
            headers={"X-Account-Id": account_id},
            json={
                "food_name": food_name,
                "category": "supplements",
                "eaten_at": datetime(2026, 2, 4, 8, 0, tzinfo=UTC).isoformat(),
                "before_glucose": 100,
                "after_glucose": 108,
            },
        )
        assert response.status_code == 201

    wildcard_response = client.get(
        "/community/foods",
        params={"query": "%", "category": "supplements"},
        headers={"X-Account-Id": account_id},
    )
    assert wildcard_response.status_code == 200
    wildcard_items = wildcard_response.json()
    wildcard_names = {item["name"] for item in wildcard_items}
    assert percent_name in wildcard_names
    assert plain_name not in wildcard_names
    assert underscore_name not in wildcard_names
    assert backslash_name not in wildcard_names

    literal_response = client.get(
        "/community/foods",
        params={"query": f"100% yogurt {unique_suffix}", "category": "supplements"},
        headers={"X-Account-Id": account_id},
    )
    assert literal_response.status_code == 200
    assert [item["name"] for item in literal_response.json()] == [percent_name]

    underscore_response = client.get(
        "/community/foods",
        params={"query": "_", "category": "supplements"},
        headers={"X-Account-Id": account_id},
    )
    assert underscore_response.status_code == 200
    underscore_names = {item["name"] for item in underscore_response.json()}
    assert underscore_name in underscore_names
    assert plain_name not in underscore_names
    assert percent_name not in underscore_names
    assert backslash_name not in underscore_names

    backslash_response = client.get(
        "/community/foods",
        params={"query": "\\", "category": "supplements"},
        headers={"X-Account-Id": account_id},
    )
    assert backslash_response.status_code == 200
    backslash_names = {item["name"] for item in backslash_response.json()}
    assert backslash_name in backslash_names
    assert plain_name not in backslash_names
    assert percent_name not in backslash_names
    assert underscore_name not in backslash_names


def test_community_leaderboard_ties_are_stably_ordered_by_public_name() -> None:
    client = TestClient(app)
    run_id = uuid4()
    alpha_account_id, _ = create_account_and_profile(client, "community-leaderboard-alpha")
    beta_account_id, _ = create_account_and_profile(client, "community-leaderboard-beta")
    alpha_display_name = f"tie-a-{run_id}"
    beta_display_name = f"tie-b-{run_id}"

    for account_id, display_name in (
        (beta_account_id, beta_display_name),
        (alpha_account_id, alpha_display_name),
    ):
        settings_response = client.patch(
            "/community/settings",
            headers={"X-Account-Id": account_id},
            json={"display_name": display_name, "leaderboard_opt_in": True},
        )
        assert settings_response.status_code == 200
        for offset in range(2):
            response = client.post(
                "/community/foods/shares",
                headers={"X-Account-Id": account_id},
                json={
                    "food_name": f"{display_name}-food-{offset}",
                    "category": "vegetables",
                    "eaten_at": (datetime(2026, 1, 5, 12, 0, tzinfo=UTC) + timedelta(minutes=offset)).isoformat(),
                    "before_glucose": 100,
                    "after_glucose": 110,
                },
            )
            assert response.status_code == 201

    for leaderboard_type in ("share_count", "contribution", "food_tester"):
        response = client.get(
            f"/community/leaderboards?leaderboard_type={leaderboard_type}&limit=50",
            headers={"X-Account-Id": alpha_account_id},
        )
        assert response.status_code == 200
        entries = response.json()["entries"]
        matching_entries = [
            entry for entry in entries if entry["display_name"] in {alpha_display_name, beta_display_name}
        ]
        assert all(entry["account_id"] is None for entry in matching_entries)
        assert [entry["display_name"] for entry in matching_entries] == [alpha_display_name, beta_display_name]


def test_community_leaderboard_limit_caps_entries_and_masks_accounts() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "community-leaderboard-limit")
    display_name = f"leaderboard-limit-{uuid4()}"

    settings_response = client.patch(
        "/community/settings",
        headers={"X-Account-Id": account_id},
        json={"display_name": display_name, "leaderboard_opt_in": True},
    )
    assert settings_response.status_code == 200
    for offset in range(2):
        response = client.post(
            "/community/foods/shares",
            headers={"X-Account-Id": account_id},
            json={
                "food_name": f"{display_name}-food-{offset}",
                "category": "vegetables",
                "eaten_at": (datetime(2026, 1, 6, 12, 0, tzinfo=UTC) + timedelta(minutes=offset)).isoformat(),
                "before_glucose": 100,
                "after_glucose": 112,
            },
        )
        assert response.status_code == 201

    for leaderboard_type in ("share_count", "contribution", "food_tester"):
        response = client.get(
            f"/community/leaderboards?leaderboard_type={leaderboard_type}&limit=1",
            headers={"X-Account-Id": account_id},
        )
        assert response.status_code == 200
        entries = response.json()["entries"]
        assert len(entries) == 1
        assert entries[0]["account_id"] is None
        assert entries[0]["score"] >= 1


def test_store_redemption_deducts_points_and_reserves_fulfillment_rewards() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "store-redemption")

    rewards_response = client.get("/store/rewards", headers={"X-Account-Id": account_id})
    assert rewards_response.status_code == 200
    rewards_by_code = {reward["code"]: reward for reward in rewards_response.json()}
    assert {
        code: {
            "title": reward["title"],
            "category": reward["category"],
            "points_cost": reward["points_cost"],
            "status": reward["status"],
        }
        for code, reward in rewards_by_code.items()
    } == {
        "coupon_50": {
            "title": "合作通路 50 元優惠券",
            "category": "coupons",
            "points_cost": 100,
            "status": "redeemable",
        },
        "supplement_discount_10": {
            "title": "保健食品 9 折折扣",
            "category": "supplement_discounts",
            "points_cost": 150,
            "status": "redeemable",
        },
        "partner_product_trial": {
            "title": "合作商品體驗兌換",
            "category": "partner_products",
            "points_cost": 300,
            "status": "redeemable",
        },
        "annual_member_badge": {
            "title": "特殊會員徽章",
            "category": "special_badges",
            "points_cost": 80,
            "status": "redeemable",
        },
        "member_benefit_pack": {
            "title": "特殊會員福利包",
            "category": "member_benefits",
            "points_cost": 500,
            "status": "redeemable",
        },
    }

    for offset in range(113):
        response = client.post(
            "/community/foods/shares",
            headers={"X-Account-Id": account_id},
            json={
                "food_name": f"測試食物 {offset}",
                "category": "vegetables",
                "eaten_at": (datetime(2026, 1, 2, 12, 0, tzinfo=UTC) + timedelta(minutes=offset)).isoformat(),
                "before_glucose": 100,
                "after_glucose": 105,
            },
        )
        assert response.status_code == 201

    unknown_reward_response = client.post(
        "/store/redemptions",
        headers={"X-Account-Id": account_id},
        json={"reward_code": "unknown_reward"},
    )
    assert unknown_reward_response.status_code == 404
    assert unknown_reward_response.json()["detail"] == {
        "code": "reward_not_found",
        "message": "Store reward not found.",
        "reward_code": "unknown_reward",
    }
    pre_redemptions_response = client.get("/store/redemptions", headers={"X-Account-Id": account_id})
    assert pre_redemptions_response.status_code == 200
    assert pre_redemptions_response.json() == []
    pre_points_response = client.get("/store/points", headers={"X-Account-Id": account_id})
    assert pre_points_response.status_code == 200
    assert pre_points_response.json() == {
        "balance": 1130,
        "lifetime_earned": 1130,
        "lifetime_redeemed": 0,
    }

    blank_reward_response = client.post(
        "/store/redemptions",
        headers={"X-Account-Id": account_id},
        json={"reward_code": "   "},
    )
    assert blank_reward_response.status_code == 422
    blank_reward_redemptions_response = client.get("/store/redemptions", headers={"X-Account-Id": account_id})
    assert blank_reward_redemptions_response.status_code == 200
    assert blank_reward_redemptions_response.json() == []
    blank_reward_points_response = client.get("/store/points", headers={"X-Account-Id": account_id})
    assert blank_reward_points_response.status_code == 200
    assert blank_reward_points_response.json() == pre_points_response.json()

    missing_redemption_id = uuid4()
    missing_use_response = client.post(
        f"/store/redemptions/{missing_redemption_id}/use",
        headers={"X-Account-Id": account_id},
    )
    assert missing_use_response.status_code == 404
    assert missing_use_response.json()["detail"] == {
        "code": "redemption_not_found",
        "message": "Store redemption not found.",
        "redemption_id": str(missing_redemption_id),
    }
    after_missing_use_redemptions_response = client.get("/store/redemptions", headers={"X-Account-Id": account_id})
    assert after_missing_use_redemptions_response.status_code == 200
    assert after_missing_use_redemptions_response.json() == []
    after_missing_use_points_response = client.get("/store/points", headers={"X-Account-Id": account_id})
    assert after_missing_use_points_response.status_code == 200
    assert after_missing_use_points_response.json() == pre_points_response.json()

    redeem_response = client.post(
        "/store/redemptions",
        headers={"X-Account-Id": account_id},
        json={"reward_code": "  coupon_50  "},
    )
    assert redeem_response.status_code == 201
    redemption = redeem_response.json()
    assert redemption["reward_code"] == "coupon_50"
    assert redemption["points_cost"] == 100
    assert redemption["status"] == "issued"
    assert redemption["fulfillment_type"] == "coupon"
    assert redemption["fulfillment_code"].startswith("TL-COUPON-50-")
    assert redemption["fulfilled_at"] is not None
    assert redemption["used_at"] is None

    other_account_id, _ = create_account_and_profile(client, "store-redemption-other")
    cross_account_use_response = client.post(
        f"/store/redemptions/{redemption['id']}/use",
        headers={"X-Account-Id": other_account_id},
    )
    assert cross_account_use_response.status_code == 404
    assert cross_account_use_response.json()["detail"] == {
        "code": "redemption_not_found",
        "message": "Store redemption not found.",
        "redemption_id": redemption["id"],
    }
    owner_redemptions_after_cross_account_response = client.get(
        "/store/redemptions",
        headers={"X-Account-Id": account_id},
    )
    assert owner_redemptions_after_cross_account_response.status_code == 200
    owner_redemptions_after_cross_account = owner_redemptions_after_cross_account_response.json()
    assert len(owner_redemptions_after_cross_account) == 1
    assert owner_redemptions_after_cross_account[0]["id"] == redemption["id"]
    assert owner_redemptions_after_cross_account[0]["status"] == "issued"
    other_redemptions_response = client.get("/store/redemptions", headers={"X-Account-Id": other_account_id})
    assert other_redemptions_response.status_code == 200
    assert other_redemptions_response.json() == []
    other_points_response = client.get("/store/points", headers={"X-Account-Id": other_account_id})
    assert other_points_response.status_code == 200
    assert other_points_response.json() == {
        "balance": 0,
        "lifetime_earned": 0,
        "lifetime_redeemed": 0,
    }

    supplement_response = client.post(
        "/store/redemptions",
        headers={"X-Account-Id": account_id},
        json={"reward_code": "supplement_discount_10"},
    )
    assert supplement_response.status_code == 201
    supplement_redemption = supplement_response.json()
    assert supplement_redemption["points_cost"] == 150
    assert supplement_redemption["status"] == "issued"
    assert supplement_redemption["fulfillment_type"] == "discount_code"
    assert supplement_redemption["fulfillment_code"].startswith("TL-SUPPLEMENT-DISCOUNT-10-")
    assert supplement_redemption["fulfilled_at"] is not None

    partner_response = client.post(
        "/store/redemptions",
        headers={"X-Account-Id": account_id},
        json={"reward_code": "partner_product_trial"},
    )
    assert partner_response.status_code == 201
    partner_redemption = partner_response.json()
    assert partner_redemption["points_cost"] == 300
    assert partner_redemption["status"] == "reserved"
    assert partner_redemption["fulfillment_type"] is None
    assert partner_redemption["fulfillment_code"] is None

    badge_response = client.post(
        "/store/redemptions",
        headers={"X-Account-Id": account_id},
        json={"reward_code": "annual_member_badge"},
    )
    assert badge_response.status_code == 201
    badge_redemption = badge_response.json()
    assert badge_redemption["points_cost"] == 80
    assert badge_redemption["status"] == "reserved"
    assert badge_redemption["fulfillment_type"] is None
    assert badge_redemption["fulfillment_code"] is None

    member_response = client.post(
        "/store/redemptions",
        headers={"X-Account-Id": account_id},
        json={"reward_code": "member_benefit_pack"},
    )
    assert member_response.status_code == 201
    member_redemption = member_response.json()
    assert member_redemption["points_cost"] == 500
    assert member_redemption["status"] == "reserved"
    assert member_redemption["fulfillment_type"] is None
    assert member_redemption["fulfillment_code"] is None
    points_after_reserved_rewards_response = client.get("/store/points", headers={"X-Account-Id": account_id})
    assert points_after_reserved_rewards_response.status_code == 200
    assert points_after_reserved_rewards_response.json() == {
        "balance": 0,
        "lifetime_earned": 1130,
        "lifetime_redeemed": 1130,
    }

    for reserved_redemption in (partner_redemption, badge_redemption, member_redemption):
        reserved_use_response = client.post(
            f"/store/redemptions/{reserved_redemption['id']}/use",
            headers={"X-Account-Id": account_id},
        )
        assert reserved_use_response.status_code == 409
        assert reserved_use_response.json()["detail"] == {
            "code": "redemption_not_usable",
            "message": "This redemption is not an unused issued coupon or discount code.",
        }
    reserved_after_use_response = client.get("/store/redemptions", headers={"X-Account-Id": account_id})
    assert reserved_after_use_response.status_code == 200
    reserved_after_use_by_code = {item["reward_code"]: item for item in reserved_after_use_response.json()}
    assert reserved_after_use_by_code["partner_product_trial"]["status"] == "reserved"
    assert reserved_after_use_by_code["partner_product_trial"]["used_at"] is None
    assert reserved_after_use_by_code["annual_member_badge"]["status"] == "reserved"
    assert reserved_after_use_by_code["annual_member_badge"]["used_at"] is None
    assert reserved_after_use_by_code["member_benefit_pack"]["status"] == "reserved"
    assert reserved_after_use_by_code["member_benefit_pack"]["used_at"] is None
    points_after_reserved_use_response = client.get("/store/points", headers={"X-Account-Id": account_id})
    assert points_after_reserved_use_response.status_code == 200
    assert points_after_reserved_use_response.json() == points_after_reserved_rewards_response.json()

    use_response = client.post(
        f"/store/redemptions/{redemption['id']}/use",
        headers={"X-Account-Id": account_id},
    )
    assert use_response.status_code == 200
    used_redemption = use_response.json()
    assert used_redemption["status"] == "used"
    assert used_redemption["used_at"] is not None
    points_after_first_use_response = client.get("/store/points", headers={"X-Account-Id": account_id})
    assert points_after_first_use_response.status_code == 200
    assert points_after_first_use_response.json() == points_after_reserved_rewards_response.json()

    reuse_response = client.post(
        f"/store/redemptions/{redemption['id']}/use",
        headers={"X-Account-Id": account_id},
    )
    assert reuse_response.status_code == 409
    assert reuse_response.json()["detail"]["code"] == "redemption_not_usable"
    after_reuse_response = client.get("/store/redemptions", headers={"X-Account-Id": account_id})
    assert after_reuse_response.status_code == 200
    after_reuse_by_code = {item["reward_code"]: item for item in after_reuse_response.json()}
    assert after_reuse_by_code["coupon_50"]["status"] == "used"
    assert after_reuse_by_code["coupon_50"]["used_at"] == used_redemption["used_at"]
    points_after_reuse_response = client.get("/store/points", headers={"X-Account-Id": account_id})
    assert points_after_reuse_response.status_code == 200
    assert points_after_reuse_response.json() == points_after_first_use_response.json()

    redemptions_response = client.get("/store/redemptions", headers={"X-Account-Id": account_id})
    assert redemptions_response.status_code == 200
    redemptions_by_code = {item["reward_code"]: item for item in redemptions_response.json()}
    assert set(redemptions_by_code) == {
        "coupon_50",
        "supplement_discount_10",
        "partner_product_trial",
        "annual_member_badge",
        "member_benefit_pack",
    }
    assert redemptions_by_code["coupon_50"]["fulfillment_code"] == redemption["fulfillment_code"]
    assert redemptions_by_code["supplement_discount_10"]["fulfillment_code"] == supplement_redemption["fulfillment_code"]
    assert redemptions_by_code["partner_product_trial"]["status"] == "reserved"
    assert redemptions_by_code["annual_member_badge"]["status"] == "reserved"
    assert redemptions_by_code["member_benefit_pack"]["status"] == "reserved"

    points_response = client.get("/store/points", headers={"X-Account-Id": account_id})
    assert points_response.status_code == 200
    assert points_response.json() == {
        "balance": 0,
        "lifetime_earned": 1130,
        "lifetime_redeemed": 1130,
    }

    insufficient_response = client.post(
        "/store/redemptions",
        headers={"X-Account-Id": account_id},
        json={"reward_code": "coupon_50"},
    )
    assert insufficient_response.status_code == 409
    assert insufficient_response.json()["detail"] == {
        "code": "insufficient_points",
        "message": "Not enough points to redeem this reward.",
        "required_points": 100,
        "available_points": 0,
    }

    unchanged_redemptions_response = client.get("/store/redemptions", headers={"X-Account-Id": account_id})
    assert unchanged_redemptions_response.status_code == 200
    assert [item["reward_code"] for item in unchanged_redemptions_response.json()].count("coupon_50") == 1

    unchanged_points_response = client.get("/store/points", headers={"X-Account-Id": account_id})
    assert unchanged_points_response.status_code == 200
    assert unchanged_points_response.json() == points_response.json()


def test_store_redemption_list_limits_to_latest_records() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "store-redemption-list-limit")

    for offset in range(40):
        response = client.post(
            "/community/foods/shares",
            headers={"X-Account-Id": account_id},
            json={
                "food_name": f"商城列表測試食物 {offset}",
                "category": "vegetables",
                "eaten_at": (
                    datetime(2026, 3, 1, 12, 0, tzinfo=UTC) + timedelta(minutes=offset)
                ).isoformat(),
                "before_glucose": 100,
                "after_glucose": 105,
            },
        )
        assert response.status_code == 201

    redemption_ids: list[str] = []
    for _ in range(5):
        redeem_response = client.post(
            "/store/redemptions",
            headers={"X-Account-Id": account_id},
            json={"reward_code": "annual_member_badge"},
        )
        assert redeem_response.status_code == 201
        redemption_ids.append(redeem_response.json()["id"])

    base_created_at = datetime(2026, 3, 2, 8, 0, tzinfo=UTC)
    with SessionLocal() as db:
        redemptions = {
            str(redemption.id): redemption
            for redemption in db.scalars(
                select(StoreRedemption).where(StoreRedemption.id.in_([UUID(value) for value in redemption_ids]))
            )
        }
        for offset, redemption_id in enumerate(redemption_ids):
            redemptions[redemption_id].created_at = base_created_at + timedelta(minutes=offset)
        db.commit()

    list_response = client.get("/store/redemptions?limit=3", headers={"X-Account-Id": account_id})
    assert list_response.status_code == 200
    redemptions = list_response.json()
    assert len(redemptions) == 3
    assert [item["id"] for item in redemptions] == list(reversed(redemption_ids[-3:]))
    assert all(item["reward_code"] == "annual_member_badge" for item in redemptions)
    assert all(item["status"] == "reserved" for item in redemptions)
    assert set(redemption_ids[:2]).isdisjoint({item["id"] for item in redemptions})


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
        "achieved_badges": 0,
        "highest_badge_level": 0,
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
        "achieved_badges": 0,
        "highest_badge_level": 0,
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
        "achieved_badges",
        "highest_badge_level",
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


def test_year_review_badge_metrics_include_cumulative_and_streak_achievements() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "year-review-badges")
    first_day = datetime(2025, 3, 1, 8, 0, tzinfo=UTC)

    for offset in range(10):
        create_record(
            client,
            account_id,
            profile_id,
            "glucose",
            first_day + timedelta(days=offset),
            {"value": 100 + offset, "unit": "mg/dL", "meal_timing": "before_meal"},
        )

    response = client.get(
        f"/year-reviews/2025?profile_id={profile_id}",
        headers={"X-Account-Id": account_id},
    )

    assert response.status_code == 200
    annual_stats = {item["key"]: item["value"] for item in response.json()["annual_stats"]}
    assert annual_stats["glucose_count"] == 10
    assert annual_stats["longest_streak_days"] == 10
    assert annual_stats["achieved_badges"] == 2
    assert annual_stats["highest_badge_level"] == 10


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
        created_count, scanned_count = generate_missing_year_review_snapshots(
            year=2024,
            db=db,
            batch_size=500,
        )
        db.commit()
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
