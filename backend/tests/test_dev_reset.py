from datetime import UTC, datetime

from fastapi.testclient import TestClient
from pytest import MonkeyPatch

from app.core.config import get_settings
from app.main import app
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

    response = client.post("/dev/reset-data", headers={"X-Dev-Reset-Confirm": "reset-all-data"})

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "reset"
    assert body["deleted_counts"]["records"] >= 1
    assert body["deleted_counts"]["accounts"] >= 1


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
