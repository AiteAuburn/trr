from datetime import UTC, datetime, timedelta
from time import time
from uuid import uuid4

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient
from pytest import MonkeyPatch
from sqlalchemy import select

import app.core.auth as auth_core
from app.core.auth import AuthTokenError, claims_from_jwks_bearer_token
from app.core.config import get_settings
from app.db.session import SessionLocal
from app.main import app
from app.models import RevokedJwt
from app.services.token_revocation import jwt_id_hash
from tests.helpers import create_account_and_profile

TEST_JWT_ISSUER = "https://issuer.example.com"
TEST_JWT_AUDIENCE = "bloodsugar-api"


class _FakeSigningKey:
    def __init__(self, key: object) -> None:
        self.key = key


class _FakeJwksClient:
    public_key: object | None = None
    tokens_seen: list[str] = []

    def __init__(self, *_: object, **__: object) -> None:
        pass

    def get_signing_key_from_jwt(self, token: str) -> _FakeSigningKey:
        self.tokens_seen.append(token)
        if self.public_key is None:
            raise AssertionError("test public key was not configured")
        return _FakeSigningKey(self.public_key)


def test_claims_from_jwks_bearer_token_accepts_rs256_token() -> None:
    private_key = _rsa_private_key()
    public_key = private_key.public_key()
    account_id = uuid4()
    token = _rs256_token(private_key, account_id=account_id)

    claims = claims_from_jwks_bearer_token(
        f"Bearer {token}",
        jwks_url="https://issuer.example.com/.well-known/jwks.json",
        issuer=TEST_JWT_ISSUER,
        audience=TEST_JWT_AUDIENCE,
        signing_key_resolver=lambda _: public_key,
    )

    assert claims["sub"] == str(account_id)
    assert claims["iss"] == TEST_JWT_ISSUER
    assert claims["aud"] == TEST_JWT_AUDIENCE


def test_claims_from_jwks_bearer_token_rejects_hs256_before_key_lookup() -> None:
    token = jwt.encode(
        {
            "sub": str(uuid4()),
            "iss": TEST_JWT_ISSUER,
            "aud": TEST_JWT_AUDIENCE,
            "iat": int(time()),
            "exp": int(time()) + 300,
            "jti": f"jwt-{uuid4()}",
        },
        "not-used-for-jwks",
        algorithm="HS256",
        headers={"kid": "symmetric-key"},
    )

    try:
        claims_from_jwks_bearer_token(
            f"Bearer {token}",
            jwks_url="https://issuer.example.com/.well-known/jwks.json",
            issuer=TEST_JWT_ISSUER,
            audience=TEST_JWT_AUDIENCE,
            signing_key_resolver=lambda _: (_ for _ in ()).throw(
                AssertionError("unsupported alg should not fetch a signing key")
            ),
        )
    except AuthTokenError as exc:
        assert "algorithm" in str(exc)
    else:
        raise AssertionError("HS256 token should not be accepted by JWKS validation")


def test_protected_endpoint_accepts_jwks_bearer_token(monkeypatch: MonkeyPatch) -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "jwks-protected")
    private_key = _rsa_private_key()
    token = _rs256_token(private_key, account_id=account_id)
    _FakeJwksClient.public_key = private_key.public_key()
    _FakeJwksClient.tokens_seen = []

    monkeypatch.setattr(auth_core, "PyJWKClient", _FakeJwksClient)
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("AUTH_JWKS_URL", "https://issuer.example.com/.well-known/jwks.json")
    monkeypatch.setenv("AUTH_JWT_ISSUER", TEST_JWT_ISSUER)
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", TEST_JWT_AUDIENCE)
    monkeypatch.setenv("AUTH_JWT_REQUIRE_JTI", "true")
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()

    response = client.get("/profiles", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert _FakeJwksClient.tokens_seen == [token]

    monkeypatch.delenv("APP_ENV")
    monkeypatch.delenv("ALLOW_DEV_AUTH")
    monkeypatch.delenv("AUTH_JWKS_URL")
    monkeypatch.delenv("AUTH_JWT_ISSUER")
    monkeypatch.delenv("AUTH_JWT_AUDIENCE")
    monkeypatch.delenv("AUTH_JWT_REQUIRE_JTI")
    monkeypatch.delenv("BACKEND_CORS_ORIGINS")
    get_settings.cache_clear()


def test_logout_all_revokes_current_jwks_access_token(monkeypatch: MonkeyPatch) -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "jwks-logout")
    private_key = _rsa_private_key()
    jwt_id = f"jwt-{uuid4()}"
    token = _rs256_token(private_key, account_id=account_id, jwt_id=jwt_id)
    _FakeJwksClient.public_key = private_key.public_key()
    _FakeJwksClient.tokens_seen = []

    monkeypatch.setattr(auth_core, "PyJWKClient", _FakeJwksClient)
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("AUTH_JWKS_URL", "https://issuer.example.com/.well-known/jwks.json")
    monkeypatch.setenv("AUTH_JWT_ISSUER", TEST_JWT_ISSUER)
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", TEST_JWT_AUDIENCE)
    monkeypatch.setenv("AUTH_JWT_REQUIRE_JTI", "true")
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()

    response = client.post("/auth/logout-all", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    with SessionLocal() as db:
        revoked = db.scalar(
            select(RevokedJwt).where(
                RevokedJwt.jti_hash == jwt_id_hash(jwt_id),
                RevokedJwt.expires_at > datetime.now(UTC),
            )
        )
        assert revoked is not None
        assert jwt_id not in revoked.jti_hash

    monkeypatch.delenv("APP_ENV")
    monkeypatch.delenv("ALLOW_DEV_AUTH")
    monkeypatch.delenv("AUTH_JWKS_URL")
    monkeypatch.delenv("AUTH_JWT_ISSUER")
    monkeypatch.delenv("AUTH_JWT_AUDIENCE")
    monkeypatch.delenv("AUTH_JWT_REQUIRE_JTI")
    monkeypatch.delenv("BACKEND_CORS_ORIGINS")
    get_settings.cache_clear()


def _rsa_private_key() -> rsa.RSAPrivateKey:
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


def _rs256_token(
    private_key: rsa.RSAPrivateKey,
    *,
    account_id: object,
    jwt_id: str | None = None,
) -> str:
    now = datetime.now(UTC)
    return jwt.encode(
        {
            "sub": str(account_id),
            "iss": TEST_JWT_ISSUER,
            "aud": TEST_JWT_AUDIENCE,
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(minutes=5)).timestamp()),
            "jti": f"jwt-{uuid4()}" if jwt_id is None else jwt_id,
        },
        private_key,
        algorithm="RS256",
        headers={"kid": "test-rsa-key"},
    )
