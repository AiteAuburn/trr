from uuid import uuid4

from fastapi.testclient import TestClient
from pydantic import ValidationError
from pytest import MonkeyPatch, raises
from sqlalchemy import select

from app.api import auth as auth_api
from app.core.auth import claims_from_bearer_token
from app.core.config import get_settings
from app.db.session import SessionLocal
from app.main import app
from app.models import Account
from app.schemas.auth import (
    DEVICE_FINGERPRINT_MAX_LENGTH,
    ID_TOKEN_MAX_LENGTH,
    OIDC_NONCE_MAX_LENGTH,
    OIDC_PROVIDER_MAX_LENGTH,
    OidcLoginRequest,
)
from app.services.auth_sessions import find_active_session_by_refresh_token

STRONG_TEST_JWT_SECRET = "oidc-login-secret-with-at-least-32-characters"
TEST_APP_ISSUER = "https://api.example.com"
TEST_APP_AUDIENCE = "bloodsugar-api"
TEST_OIDC_ISSUER = "https://accounts.example.com"
TEST_OIDC_AUDIENCE = "bloodsugar-mobile"
TEST_OIDC_NONCE = "nonce-for-oidc-login-test-123"


def test_oidc_login_request_schema_bounds_provider_token_and_fingerprint() -> None:
    request = OidcLoginRequest(
        provider="  Google  ",
        id_token="aaa.bbb.ccc",
        nonce=f"  {TEST_OIDC_NONCE}  ",
        device_fingerprint="  device-1  ",
    )

    assert request.provider == "google"
    assert request.id_token == "aaa.bbb.ccc"
    assert request.nonce == TEST_OIDC_NONCE
    assert request.device_fingerprint == "device-1"

    with raises(ValidationError):
        OidcLoginRequest(provider="g" * (OIDC_PROVIDER_MAX_LENGTH + 1), id_token="aaa.bbb.ccc", nonce=TEST_OIDC_NONCE)
    with raises(ValidationError):
        OidcLoginRequest(provider="google oauth", id_token="aaa.bbb.ccc", nonce=TEST_OIDC_NONCE)
    with raises(ValidationError):
        OidcLoginRequest(provider="google", id_token="not-a-jwt", nonce=TEST_OIDC_NONCE)
    with raises(ValidationError):
        OidcLoginRequest(provider="google", id_token=("a" * ID_TOKEN_MAX_LENGTH) + ".bbb.ccc", nonce=TEST_OIDC_NONCE)
    with raises(ValidationError):
        OidcLoginRequest(provider="google", id_token="aaa.bbb.ccc", nonce="short")
    with raises(ValidationError):
        OidcLoginRequest(provider="google", id_token="aaa.bbb.ccc", nonce="n" * (OIDC_NONCE_MAX_LENGTH + 1))
    with raises(ValidationError):
        OidcLoginRequest(provider="google", id_token="aaa.bbb.ccc", nonce="nonce with spaces")
    with raises(ValidationError):
        OidcLoginRequest(
            provider="google",
            id_token="aaa.bbb.ccc",
            nonce=TEST_OIDC_NONCE,
            device_fingerprint="d" * (DEVICE_FINGERPRINT_MAX_LENGTH + 1),
        )


def test_oidc_login_returns_503_when_not_configured(monkeypatch: MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("AUTH_JWT_SECRET", STRONG_TEST_JWT_SECRET)
    monkeypatch.setenv("AUTH_JWT_ISSUER", TEST_APP_ISSUER)
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", TEST_APP_AUDIENCE)
    monkeypatch.setenv("AUTH_JWT_REQUIRE_JTI", "true")
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()

    try:
        response = TestClient(app).post(
            "/auth/oidc-login",
            json={"provider": "google", "id_token": "aaa.bbb.ccc", "nonce": TEST_OIDC_NONCE},
        )
    finally:
        get_settings.cache_clear()

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "oidc_login_not_configured"


def test_oidc_login_creates_account_session_and_app_tokens(monkeypatch: MonkeyPatch) -> None:
    email = f"oidc-{uuid4()}@example.com"
    captured_authorization: list[str] = []

    def fake_claims_from_jwks_bearer_token(authorization: str | None, **_: object) -> dict[str, object]:
        assert authorization is not None
        captured_authorization.append(authorization)
        return {
            "sub": f"provider-sub-{uuid4()}",
            "email": email,
            "email_verified": True,
            "nonce": TEST_OIDC_NONCE,
            "name": "OIDC Test User",
            "iss": TEST_OIDC_ISSUER,
            "aud": TEST_OIDC_AUDIENCE,
            "exp": 4_102_444_800,
        }

    monkeypatch.setattr(auth_api, "claims_from_jwks_bearer_token", fake_claims_from_jwks_bearer_token)
    _configure_oidc_login(monkeypatch)

    try:
        response = TestClient(app).post(
            "/auth/oidc-login",
            json={
                "provider": "google",
                "id_token": "aaa.bbb.ccc",
                "nonce": TEST_OIDC_NONCE,
                "device_fingerprint": "device-1",
            },
        )
        body = response.json()
        with SessionLocal() as db:
            account = db.scalar(select(Account).where(Account.email == email))
            session = find_active_session_by_refresh_token(body["refresh_token"], db)
    finally:
        get_settings.cache_clear()

    assert response.status_code == 200
    assert captured_authorization == ["Bearer aaa.bbb.ccc"]
    assert body["token_type"] == "bearer"
    assert account is not None
    assert account.display_name == "OIDC Test User"
    assert session is not None
    assert session.account_id == account.id
    assert session.device_fingerprint_hash is not None

    claims = claims_from_bearer_token(
        f"Bearer {body['access_token']}",
        secret=STRONG_TEST_JWT_SECRET,
        issuer=TEST_APP_ISSUER,
        audience=TEST_APP_AUDIENCE,
        max_age_seconds=900,
    )
    assert claims["sub"] == str(account.id)

    me_response = TestClient(app).get(
        "/auth/me",
        headers={"Authorization": f"Bearer {body['access_token']}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["id"] == str(account.id)
    assert me_response.json()["email"] == email


def test_oidc_login_rejects_unverified_email_claim(monkeypatch: MonkeyPatch) -> None:
    def fake_claims_from_jwks_bearer_token(_: str | None, **__: object) -> dict[str, object]:
        return {
            "sub": f"provider-sub-{uuid4()}",
            "email": f"oidc-unverified-{uuid4()}@example.com",
            "email_verified": False,
            "nonce": TEST_OIDC_NONCE,
            "iss": TEST_OIDC_ISSUER,
            "aud": TEST_OIDC_AUDIENCE,
            "exp": 4_102_444_800,
        }

    monkeypatch.setattr(auth_api, "claims_from_jwks_bearer_token", fake_claims_from_jwks_bearer_token)
    _configure_oidc_login(monkeypatch)

    try:
        response = TestClient(app).post(
            "/auth/oidc-login",
            json={"provider": "google", "id_token": "aaa.bbb.ccc", "nonce": TEST_OIDC_NONCE},
        )
    finally:
        get_settings.cache_clear()

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "invalid_oidc_token"


def test_oidc_login_rejects_nonce_mismatch(monkeypatch: MonkeyPatch) -> None:
    def fake_claims_from_jwks_bearer_token(_: str | None, **__: object) -> dict[str, object]:
        return {
            "sub": f"provider-sub-{uuid4()}",
            "email": f"oidc-nonce-{uuid4()}@example.com",
            "email_verified": True,
            "nonce": "different-nonce-value",
            "iss": TEST_OIDC_ISSUER,
            "aud": TEST_OIDC_AUDIENCE,
            "exp": 4_102_444_800,
        }

    monkeypatch.setattr(auth_api, "claims_from_jwks_bearer_token", fake_claims_from_jwks_bearer_token)
    _configure_oidc_login(monkeypatch)

    try:
        response = TestClient(app).post(
            "/auth/oidc-login",
            json={"provider": "google", "id_token": "aaa.bbb.ccc", "nonce": TEST_OIDC_NONCE},
        )
    finally:
        get_settings.cache_clear()

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "invalid_oidc_token"


def _configure_oidc_login(monkeypatch: MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("AUTH_JWT_SECRET", STRONG_TEST_JWT_SECRET)
    monkeypatch.setenv("AUTH_JWT_ISSUER", TEST_APP_ISSUER)
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", TEST_APP_AUDIENCE)
    monkeypatch.setenv("AUTH_JWT_REQUIRE_JTI", "true")
    monkeypatch.setenv("AUTH_JWT_MAX_AGE_SECONDS", "900")
    monkeypatch.setenv("AUTH_OIDC_JWKS_URL", "https://accounts.example.com/.well-known/jwks.json")
    monkeypatch.setenv("AUTH_OIDC_ISSUER", TEST_OIDC_ISSUER)
    monkeypatch.setenv("AUTH_OIDC_AUDIENCE", TEST_OIDC_AUDIENCE)
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()
