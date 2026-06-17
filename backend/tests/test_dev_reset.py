from datetime import UTC, datetime
from uuid import UUID

from fastapi.testclient import TestClient
from pytest import MonkeyPatch
from sqlalchemy import select

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.main import app
from app.models import AchievementUnlock, YearReviewSharePackage, YearReviewSnapshot
from tests.helpers import create_account_and_profile, create_record


def test_dev_reset_requires_confirmation_header() -> None:
    response = TestClient(app).post("/dev/reset-data")

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "missing_dev_reset_confirmation"


def test_dev_reset_clears_development_data() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "dev-reset")
    create_record(
        client,
        account_id,
        profile_id,
        "glucose",
        datetime(2026, 1, 1, 8, 0, tzinfo=UTC),
        {"value": 120, "unit": "mg/dL"},
    )
    with SessionLocal() as db:
        db.add(
            AchievementUnlock(
                profile_id=UUID(profile_id),
                achievement_id="glucose-cumulative-10",
                category="glucose",
                kind="cumulative",
                level=10,
                unlocked_at=datetime(2026, 1, 2, 8, 0, tzinfo=UTC),
            )
        )
        snapshot = YearReviewSnapshot(
            profile_id=UUID(profile_id),
            year=2025,
            summary_json={
                "year": 2025,
                "generated_for_previous_year": True,
                "annual_stats": [],
                "health_outcomes": [],
                "ai_summary": [],
            },
            generated_at=datetime(2026, 1, 1, 0, 15, tzinfo=UTC),
        )
        db.add(snapshot)
        db.flush()
        db.add(
            YearReviewSharePackage(
                snapshot_id=snapshot.id,
                profile_id=UUID(profile_id),
                year=2025,
                privacy_level="public_summary",
                asset_kind="svg_card",
                asset_checksum_sha256="a" * 64,
                share_text="public summary",
                status="confirmed",
                confirmed_at=datetime(2026, 1, 1, 0, 20, tzinfo=UTC),
            )
        )
        db.commit()

    response = client.post("/dev/reset-data", headers={"X-Dev-Reset-Confirm": "reset-all-data"})

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "reset"
    assert body["deleted_counts"]["achievement_unlocks"] >= 1
    assert body["deleted_counts"]["year_review_share_packages"] >= 1
    assert body["deleted_counts"]["year_review_snapshots"] >= 1
    assert body["deleted_counts"]["records"] >= 1
    assert body["deleted_counts"]["accounts"] >= 1
    with SessionLocal() as db:
        assert list(db.scalars(select(AchievementUnlock).where(AchievementUnlock.profile_id == UUID(profile_id)))) == []
        assert list(db.scalars(select(YearReviewSharePackage).where(YearReviewSharePackage.profile_id == UUID(profile_id)))) == []
        assert list(db.scalars(select(YearReviewSnapshot).where(YearReviewSnapshot.profile_id == UUID(profile_id)))) == []


def test_dev_reset_is_disabled_in_production(monkeypatch: MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()

    response = TestClient(app).post("/dev/reset-data", headers={"X-Dev-Reset-Confirm": "reset-all-data"})

    assert response.status_code == 404

    monkeypatch.delenv("APP_ENV")
    monkeypatch.delenv("ALLOW_DEV_AUTH")
    monkeypatch.delenv("BACKEND_CORS_ORIGINS")
    get_settings.cache_clear()
