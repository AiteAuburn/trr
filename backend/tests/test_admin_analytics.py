from datetime import UTC, datetime

from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from app.api import admin as admin_api
from app.core.config import get_settings
from app.db.session import SessionLocal
from app.main import app
from app.models import AiTokenUsageDaily, ApiUsageDaily, RateLimitCounter
from app.services.admin_auth import hash_admin_password, verify_admin_password
from app.services.usage_analytics import record_ai_token_usage, record_api_usage


TEST_ADMIN_PASSWORD = "test-admin-password"


def _admin_settings(**updates: object):
    return get_settings().model_copy(
        update={
            "app_env": "test",
            "admin_username": "admin",
            "admin_password_hash": hash_admin_password(
                TEST_ADMIN_PASSWORD, salt=b"0123456789abcdef"
            ),
            "admin_session_secret": "test-admin-session-secret-at-least-32-characters",
            "admin_session_seconds": 3600,
            **updates,
        }
    )


def _clear_admin_test_rows() -> None:
    with SessionLocal() as db:
        db.execute(delete(ApiUsageDaily))
        db.execute(delete(AiTokenUsageDaily))
        db.execute(delete(RateLimitCounter).where(RateLimitCounter.scope == "admin_login_client"))
        db.commit()


def _login(client: TestClient) -> None:
    response = client.post(
        "/admin/login",
        json={"username": "admin", "password": TEST_ADMIN_PASSWORD},
    )
    assert response.status_code == 200


def test_admin_password_hash_is_salted_and_never_stores_plaintext() -> None:
    first_hash = hash_admin_password(TEST_ADMIN_PASSWORD, salt=b"0123456789abcdef")
    second_hash = hash_admin_password(TEST_ADMIN_PASSWORD, salt=b"fedcba9876543210")

    assert first_hash != second_hash
    assert TEST_ADMIN_PASSWORD not in first_hash
    assert verify_admin_password(TEST_ADMIN_PASSWORD, first_hash) is True
    assert verify_admin_password("wrong-password", first_hash) is False
    assert verify_admin_password(TEST_ADMIN_PASSWORD, "malformed") is False


def test_admin_login_sets_http_only_session_and_protects_usage(monkeypatch) -> None:
    _clear_admin_test_rows()
    monkeypatch.setattr(admin_api, "get_settings", _admin_settings)
    client = TestClient(app)

    denied = client.get("/admin/usage")
    assert denied.status_code == 401
    assert denied.json()["detail"]["code"] == "admin_auth_required"

    login = client.post(
        "/admin/login",
        json={"username": "admin", "password": TEST_ADMIN_PASSWORD},
    )
    assert login.status_code == 200
    assert login.json() == {"authenticated": True, "username": "admin"}
    set_cookie = login.headers["set-cookie"]
    assert "HttpOnly" in set_cookie
    assert "SameSite=strict" in set_cookie
    assert TEST_ADMIN_PASSWORD not in set_cookie

    session = client.get("/admin/session")
    assert session.status_code == 200
    assert session.json()["authenticated"] is True

    logout = client.post("/admin/logout")
    assert logout.status_code == 200
    assert client.get("/admin/session").status_code == 401


def test_admin_login_is_rate_limited_and_does_not_echo_password(monkeypatch) -> None:
    _clear_admin_test_rows()
    monkeypatch.setattr(
        admin_api,
        "get_settings",
        lambda: _admin_settings(admin_login_rate_limit_count=1),
    )
    client = TestClient(app)
    bad_password = "not-the-admin-password"

    first = client.post("/admin/login", json={"username": "admin", "password": bad_password})
    second = client.post("/admin/login", json={"username": "admin", "password": bad_password})

    assert first.status_code == 401
    assert second.status_code == 429
    assert bad_password not in first.text
    assert bad_password not in second.text


def test_daily_usage_upserts_compact_rows_and_admin_returns_model_tokens(monkeypatch) -> None:
    _clear_admin_test_rows()
    today = datetime.now(UTC).date()
    with SessionLocal() as db:
        record_api_usage(
            method="GET",
            route="/records",
            status_code=200,
            duration_seconds=0.012,
            bucket_date=today,
            db=db,
        )
        record_api_usage(
            method="GET",
            route="/records",
            status_code=500,
            duration_seconds=0.028,
            bucket_date=today,
            db=db,
        )
        record_ai_token_usage(
            provider="deepseek",
            model_id="deepseek-v4-flash",
            succeeded=True,
            usage={"prompt_tokens": 21, "completion_tokens": 9, "total_tokens": 30},
            bucket_date=today,
            db=db,
        )
        record_ai_token_usage(
            provider="deepseek",
            model_id="deepseek-v4-flash",
            succeeded=False,
            usage=None,
            bucket_date=today,
            db=db,
        )
        db.commit()

        assert len(list(db.scalars(select(ApiUsageDaily)))) == 2
        model_row = db.scalar(select(AiTokenUsageDaily))
        assert model_row is not None
        assert model_row.request_count == 2
        assert model_row.total_tokens == 30

    monkeypatch.setattr(admin_api, "get_settings", _admin_settings)
    client = TestClient(app)
    _login(client)
    response = client.get("/admin/usage?days=30")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total_requests"] == 2
    assert payload["total_errors"] == 1
    assert payload["total_tokens"] == 30
    assert payload["endpoints"] == [
        {
            "method": "GET",
            "route": "/records",
            "request_count": 2,
            "error_count": 1,
            "average_duration_ms": 20.0,
            "max_duration_ms": 28.0,
        }
    ]
    assert payload["models"][0]["model_id"] == "deepseek-v4-flash"
    assert payload["models"][0]["input_tokens"] == 21
    assert payload["models"][0]["output_tokens"] == 9
    assert payload["models"][0]["success_count"] == 1
    assert payload["models"][0]["failure_count"] == 1

    _clear_admin_test_rows()


def test_admin_is_fail_closed_when_server_credentials_are_absent(monkeypatch) -> None:
    _clear_admin_test_rows()
    monkeypatch.setattr(
        admin_api,
        "get_settings",
        lambda: get_settings().model_copy(
            update={
                "admin_username": "",
                "admin_password_hash": "",
                "admin_session_secret": "",
            }
        ),
    )

    response = TestClient(app).post(
        "/admin/login",
        json={"username": "admin", "password": TEST_ADMIN_PASSWORD},
    )

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "admin_not_configured"
