from uuid import uuid4

from fastapi.testclient import TestClient
from pytest import MonkeyPatch
from sqlalchemy import delete, select

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.main import app
from app.models import Account
from app.services.password_auth import hash_password, verify_password

TEST_JWT_SECRET = "email-password-test-secret-with-at-least-32-chars"


def test_password_hash_is_salted_and_verified() -> None:
    first = hash_password("correct horse battery staple")
    second = hash_password("correct horse battery staple")

    assert first != second
    assert verify_password("correct horse battery staple", first)
    assert not verify_password("wrong password", first)
    assert not verify_password("correct horse battery staple", "malformed")


def test_email_registration_login_and_duplicate_rejection(monkeypatch: MonkeyPatch) -> None:
    _configure_auth(monkeypatch)
    email = f"auth-{uuid4()}@example.com"
    client = TestClient(app)
    try:
        response = client.post(
            "/auth/register",
            json={"email": email.upper(), "password": "a long unique password", "display_name": "Example"},
        )
        assert response.status_code == 201
        tokens = response.json()
        assert tokens["token_type"] == "bearer"
        assert tokens["access_token"] and tokens["refresh_token"]

        me = client.get("/auth/me", headers={"Authorization": f"Bearer {tokens['access_token']}"})
        assert me.status_code == 200
        assert me.json()["email"] == email

        with SessionLocal() as db:
            account = db.scalar(select(Account).where(Account.email == email))
            assert account is not None
            assert account.password_hash is not None
            assert account.password_hash != "a long unique password"

        login = client.post("/auth/login", json={"email": email.upper(), "password": "a long unique password"})
        assert login.status_code == 200
        assert client.post("/auth/login", json={"email": email, "password": "wrong password value"}).status_code == 401
        duplicate = client.post("/auth/register", json={"email": email, "password": "another unique password"})
        assert duplicate.status_code == 409
    finally:
        with SessionLocal() as db:
            # A core DELETE lets the database cascade to auth_sessions; the ORM
            # delete would try to null the non-nullable session foreign key.
            db.execute(delete(Account).where(Account.email == email.lower()))
            db.commit()
        get_settings.cache_clear()


def test_email_password_rejects_short_password(monkeypatch: MonkeyPatch) -> None:
    _configure_auth(monkeypatch)
    response = TestClient(app).post(
        "/auth/register", json={"email": f"short-{uuid4()}@example.com", "password": "too-short"}
    )
    get_settings.cache_clear()
    assert response.status_code == 422


def _configure_auth(monkeypatch: MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "local")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("AUTH_JWT_SECRET", TEST_JWT_SECRET)
    monkeypatch.setenv("AUTH_JWT_ISSUER", "")
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", "")
    monkeypatch.setenv("AUTH_JWT_REQUIRE_JTI", "false")
    monkeypatch.setenv("AUTH_REGISTER_CLIENT_RATE_LIMIT_COUNT", "100")
    monkeypatch.setenv("AUTH_LOGIN_CLIENT_RATE_LIMIT_COUNT", "100")
    get_settings.cache_clear()
