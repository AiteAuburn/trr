from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from fastapi.testclient import TestClient
from pydantic import ValidationError
from pytest import MonkeyPatch, raises
from sqlalchemy import delete, select

from app.core.auth import AuthTokenError, ISSUED_JWT_ID_MAX_LENGTH, claims_from_bearer_token, issue_hs256_access_token
from app.core.config import get_settings
from app.db.session import SessionLocal
from app.main import app
from app.models import RateLimitCounter, RevokedJwt
from app.schemas.auth import (
    ACCESS_TOKEN_MAX_LENGTH,
    AUTH_DISPLAY_NAME_MAX_LENGTH,
    AUTH_SESSION_LIST_MAX_COUNT,
    AuthSessionRead,
    AuthSessionsResponse,
    DevLoginResponse,
    LOGOUT_ALL_REVOKED_SESSIONS_MAX_COUNT,
    LogoutAllResponse,
    RefreshTokenResponse,
)
from app.services.auth_sessions import create_auth_session, find_active_session_by_refresh_token
from app.services import rate_limits
from app.services.rate_limits import (
    MAX_RATE_LIMIT_KEY_LENGTH,
    MAX_RATE_LIMIT_RETRY_AFTER_SECONDS,
    RATE_LIMIT_PRUNE_BATCH_SIZE,
    consume_fixed_window_rate_limit,
    normalize_retry_after_seconds,
    prune_rate_limit_counters,
    rate_limit_key_hash,
)
from app.services.token_revocation import jwt_id_hash
from tests.helpers import create_account_and_profile

STRONG_TEST_JWT_SECRET = "refresh-secret-with-at-least-32-characters"
TEST_JWT_ISSUER = "https://issuer.example.com"
TEST_JWT_AUDIENCE = "bloodsugar-api"


def test_auth_response_schemas_bound_token_and_session_metadata() -> None:
    session_read = AuthSessionRead(
        id=uuid4(),
        created_at=datetime.now(UTC),
        expires_at=datetime.now(UTC) + timedelta(days=7),
        has_device_fingerprint=False,
    )

    assert AuthSessionsResponse(root=[session_read]).root == [session_read]
    with raises(ValidationError):
        AuthSessionsResponse(root=[session_read] * (AUTH_SESSION_LIST_MAX_COUNT + 1))
    with raises(ValidationError):
        DevLoginResponse(
            id=uuid4(),
            email="schema-bound@example.com",
            display_name="a" * (AUTH_DISPLAY_NAME_MAX_LENGTH + 1),
        )
    with raises(ValidationError):
        RefreshTokenResponse(
            access_token="a" * (ACCESS_TOKEN_MAX_LENGTH + 1),
            refresh_token=f"refresh-response-token-{uuid4()}",
            expires_in=900,
        )
    with raises(ValidationError):
        RefreshTokenResponse(
            access_token="access-token",
            refresh_token=f"refresh response token with spaces {uuid4()}",
            expires_in=900,
        )
    with raises(ValidationError):
        RefreshTokenResponse(
            access_token="access-token",
            refresh_token=f"refresh-response-token-{uuid4()}",
            token_type="basic",
            expires_in=900,
        )
    with raises(ValidationError):
        RefreshTokenResponse(
            access_token="access-token",
            refresh_token=f"refresh-response-token-{uuid4()}",
            expires_in=0,
        )
    with raises(ValidationError):
        LogoutAllResponse(revoked_sessions=-1)
    with raises(ValidationError):
        LogoutAllResponse(revoked_sessions=LOGOUT_ALL_REVOKED_SESSIONS_MAX_COUNT + 1)


def test_rate_limit_key_hash_normalizes_whitespace() -> None:
    key = f"rate-limit-key-{uuid4()}"

    assert rate_limit_key_hash(f"  {key}\n") == rate_limit_key_hash(key)


def test_rate_limit_key_hash_rejects_oversized_value_before_hashing(
    monkeypatch: MonkeyPatch,
) -> None:
    def fail_hash(_: bytes) -> object:
        raise AssertionError("oversized rate-limit key should not be hashed")

    monkeypatch.setattr(rate_limits.hashlib, "sha256", fail_hash)

    with raises(ValueError, match="rate limit key"):
        rate_limit_key_hash("k" * (MAX_RATE_LIMIT_KEY_LENGTH + 1))


def test_rate_limit_retry_after_seconds_is_bounded_for_public_responses() -> None:
    assert normalize_retry_after_seconds(0) == 1
    assert normalize_retry_after_seconds(-10) == 1
    assert normalize_retry_after_seconds(60) == 60
    assert (
        normalize_retry_after_seconds(MAX_RATE_LIMIT_RETRY_AFTER_SECONDS + 1)
        == MAX_RATE_LIMIT_RETRY_AFTER_SECONDS
    )


def test_rate_limit_consume_rejects_invalid_limits_before_db_work() -> None:
    with SessionLocal() as db:
        with raises(ValueError, match="positive"):
            consume_fixed_window_rate_limit(
                scope="auth_refresh",
                key=f"rate-limit-invalid-{uuid4()}",
                limit=0,
                window_seconds=60,
                db=db,
            )
        with raises(ValueError, match="window_seconds"):
            consume_fixed_window_rate_limit(
                scope="auth_refresh",
                key=f"rate-limit-invalid-{uuid4()}",
                limit=1,
                window_seconds=0,
                db=db,
            )


def test_issue_access_token_bounds_caller_provided_jwt_id() -> None:
    account_id = uuid4()

    token = issue_hs256_access_token(
        account_id=account_id,
        secret=STRONG_TEST_JWT_SECRET,
        expires_in_seconds=900,
        jwt_id="  caller-jti  ",
    )
    claims = claims_from_bearer_token(
        f"Bearer {token}",
        secret=STRONG_TEST_JWT_SECRET,
        max_age_seconds=900,
    )
    assert claims["jti"] == "caller-jti"

    with raises(AuthTokenError, match="jwt id"):
        issue_hs256_access_token(
            account_id=account_id,
            secret=STRONG_TEST_JWT_SECRET,
            expires_in_seconds=900,
            jwt_id=" ",
        )
    with raises(AuthTokenError, match="jwt id"):
        issue_hs256_access_token(
            account_id=account_id,
            secret=STRONG_TEST_JWT_SECRET,
            expires_in_seconds=900,
            jwt_id="j" * (ISSUED_JWT_ID_MAX_LENGTH + 1),
        )


def test_refresh_endpoint_rotates_refresh_token_and_issues_access_token(
    monkeypatch: MonkeyPatch,
) -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "refresh-endpoint")
    refresh_token = f"initial-refresh-token-{uuid4()}-with-enough-length"

    with SessionLocal() as db:
        create_auth_session(
            account_id=UUID(account_id),
            refresh_token=refresh_token,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            db=db,
        )
        db.commit()

    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("AUTH_JWT_SECRET", STRONG_TEST_JWT_SECRET)
    monkeypatch.setenv("AUTH_JWT_ISSUER", TEST_JWT_ISSUER)
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", TEST_JWT_AUDIENCE)
    monkeypatch.setenv("AUTH_JWT_REQUIRE_JTI", "true")
    monkeypatch.setenv("AUTH_JWT_MAX_AGE_SECONDS", "900")
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()

    response = client.post("/auth/refresh", json={"refresh_token": refresh_token})

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["expires_in"] == 900
    assert body["refresh_token"] != refresh_token

    claims = claims_from_bearer_token(
        f"Bearer {body['access_token']}",
        secret=STRONG_TEST_JWT_SECRET,
        issuer=TEST_JWT_ISSUER,
        audience=TEST_JWT_AUDIENCE,
        max_age_seconds=900,
    )
    assert claims["sub"] == account_id
    assert isinstance(claims["jti"], str)

    with SessionLocal() as db:
        assert find_active_session_by_refresh_token(refresh_token, db) is None
        assert find_active_session_by_refresh_token(body["refresh_token"], db) is not None

    old_token_response = client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert old_token_response.status_code == 401
    assert old_token_response.json()["detail"]["code"] == "invalid_refresh_token"

    monkeypatch.delenv("APP_ENV")
    monkeypatch.delenv("ALLOW_DEV_AUTH")
    monkeypatch.delenv("AUTH_JWT_SECRET")
    monkeypatch.delenv("AUTH_JWT_ISSUER")
    monkeypatch.delenv("AUTH_JWT_AUDIENCE")
    monkeypatch.delenv("AUTH_JWT_REQUIRE_JTI")
    monkeypatch.delenv("AUTH_JWT_MAX_AGE_SECONDS")
    monkeypatch.delenv("BACKEND_CORS_ORIGINS")
    get_settings.cache_clear()


def test_refresh_endpoint_fails_closed_without_jwt_secret(monkeypatch: MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()

    response = TestClient(app).post(
        "/auth/refresh",
        json={"refresh_token": f"unconfigured-refresh-token-{uuid4()}"},
    )

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "auth_not_configured"

    monkeypatch.delenv("APP_ENV")
    monkeypatch.delenv("ALLOW_DEV_AUTH")
    monkeypatch.delenv("BACKEND_CORS_ORIGINS")
    get_settings.cache_clear()


def test_refresh_endpoint_rejects_invalid_token_shape_before_rate_limit(
    monkeypatch: MonkeyPatch,
) -> None:
    invalid_refresh_token = f"invalid refresh token with spaces {uuid4()}"
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("AUTH_JWT_SECRET", STRONG_TEST_JWT_SECRET)
    monkeypatch.setenv("AUTH_JWT_ISSUER", TEST_JWT_ISSUER)
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", TEST_JWT_AUDIENCE)
    monkeypatch.setenv("AUTH_JWT_REQUIRE_JTI", "true")
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()

    response = TestClient(app).post(
        "/auth/refresh",
        json={"refresh_token": invalid_refresh_token},
    )

    assert response.status_code == 422
    assert invalid_refresh_token not in response.text
    with SessionLocal() as db:
        counter = db.scalar(
            select(RateLimitCounter).where(
                RateLimitCounter.scope == "auth_refresh",
                RateLimitCounter.key_hash == rate_limit_key_hash(invalid_refresh_token),
            )
        )
    assert counter is None

    monkeypatch.delenv("APP_ENV")
    monkeypatch.delenv("ALLOW_DEV_AUTH")
    monkeypatch.delenv("AUTH_JWT_SECRET")
    monkeypatch.delenv("AUTH_JWT_ISSUER")
    monkeypatch.delenv("AUTH_JWT_AUDIENCE")
    monkeypatch.delenv("AUTH_JWT_REQUIRE_JTI")
    monkeypatch.delenv("BACKEND_CORS_ORIGINS")
    get_settings.cache_clear()


def test_refresh_endpoint_rejects_oversized_token_before_rate_limit(
    monkeypatch: MonkeyPatch,
) -> None:
    oversized_refresh_token = "a" * 513
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("AUTH_JWT_SECRET", STRONG_TEST_JWT_SECRET)
    monkeypatch.setenv("AUTH_JWT_ISSUER", TEST_JWT_ISSUER)
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", TEST_JWT_AUDIENCE)
    monkeypatch.setenv("AUTH_JWT_REQUIRE_JTI", "true")
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()

    response = TestClient(app).post(
        "/auth/refresh",
        json={"refresh_token": oversized_refresh_token},
    )

    assert response.status_code == 422
    assert oversized_refresh_token not in response.text
    with SessionLocal() as db:
        counter = db.scalar(
            select(RateLimitCounter).where(
                RateLimitCounter.scope == "auth_refresh",
                RateLimitCounter.key_hash == rate_limit_key_hash(oversized_refresh_token),
            )
        )
    assert counter is None

    monkeypatch.delenv("APP_ENV")
    monkeypatch.delenv("ALLOW_DEV_AUTH")
    monkeypatch.delenv("AUTH_JWT_SECRET")
    monkeypatch.delenv("AUTH_JWT_ISSUER")
    monkeypatch.delenv("AUTH_JWT_AUDIENCE")
    monkeypatch.delenv("AUTH_JWT_REQUIRE_JTI")
    monkeypatch.delenv("BACKEND_CORS_ORIGINS")
    get_settings.cache_clear()


def test_refresh_endpoint_rate_limits_invalid_token_attempts(monkeypatch: MonkeyPatch) -> None:
    refresh_token = f"invalid-refresh-token-{uuid4()}-with-enough-length"
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("AUTH_JWT_SECRET", STRONG_TEST_JWT_SECRET)
    monkeypatch.setenv("AUTH_JWT_ISSUER", TEST_JWT_ISSUER)
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", TEST_JWT_AUDIENCE)
    monkeypatch.setenv("AUTH_JWT_REQUIRE_JTI", "true")
    monkeypatch.setenv("AUTH_REFRESH_RATE_LIMIT_COUNT", "2")
    monkeypatch.setenv("AUTH_REFRESH_RATE_LIMIT_WINDOW_SECONDS", "60")
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()

    client = TestClient(app)
    first_response = client.post("/auth/refresh", json={"refresh_token": refresh_token})
    second_response = client.post("/auth/refresh", json={"refresh_token": refresh_token})
    third_response = client.post("/auth/refresh", json={"refresh_token": refresh_token})

    assert first_response.status_code == 401
    assert second_response.status_code == 401
    assert third_response.status_code == 429
    assert third_response.json()["detail"]["code"] == "rate_limit_exceeded"
    assert int(third_response.headers["Retry-After"]) >= 1
    assert refresh_token not in third_response.text
    with SessionLocal() as db:
        counter = db.scalar(
            select(RateLimitCounter).where(
                RateLimitCounter.scope == "auth_refresh",
                RateLimitCounter.key_hash == rate_limit_key_hash(refresh_token),
            )
        )
    assert counter is not None
    assert counter.count == 2
    assert counter.key_hash == rate_limit_key_hash(refresh_token)
    assert refresh_token not in counter.key_hash

    monkeypatch.delenv("APP_ENV")
    monkeypatch.delenv("ALLOW_DEV_AUTH")
    monkeypatch.delenv("AUTH_JWT_SECRET")
    monkeypatch.delenv("AUTH_JWT_ISSUER")
    monkeypatch.delenv("AUTH_JWT_AUDIENCE")
    monkeypatch.delenv("AUTH_JWT_REQUIRE_JTI")
    monkeypatch.delenv("AUTH_REFRESH_RATE_LIMIT_COUNT")
    monkeypatch.delenv("AUTH_REFRESH_RATE_LIMIT_WINDOW_SECONDS")
    monkeypatch.delenv("BACKEND_CORS_ORIGINS")
    get_settings.cache_clear()


def test_refresh_endpoint_rate_limits_distinct_invalid_tokens_by_client(
    monkeypatch: MonkeyPatch,
) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("AUTH_JWT_SECRET", STRONG_TEST_JWT_SECRET)
    monkeypatch.setenv("AUTH_JWT_ISSUER", TEST_JWT_ISSUER)
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", TEST_JWT_AUDIENCE)
    monkeypatch.setenv("AUTH_JWT_REQUIRE_JTI", "true")
    monkeypatch.setenv("AUTH_REFRESH_RATE_LIMIT_COUNT", "100")
    monkeypatch.setenv("AUTH_REFRESH_RATE_LIMIT_WINDOW_SECONDS", "60")
    monkeypatch.setenv("AUTH_REFRESH_CLIENT_RATE_LIMIT_COUNT", "2")
    monkeypatch.setenv("AUTH_REFRESH_CLIENT_RATE_LIMIT_WINDOW_SECONDS", "60")
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()

    with SessionLocal() as db:
        prune_rate_limit_counters(older_than=datetime.now(UTC) + timedelta(days=1), db=db)
        db.commit()

    client = TestClient(app)
    responses = [
        client.post(
            "/auth/refresh",
            json={"refresh_token": f"distinct-invalid-refresh-token-{uuid4()}"},
        )
        for _ in range(3)
    ]

    assert [response.status_code for response in responses] == [401, 401, 429]
    assert responses[2].json()["detail"]["code"] == "rate_limit_exceeded"
    assert int(responses[2].headers["Retry-After"]) >= 1
    assert "distinct-invalid-refresh-token" not in responses[2].text
    with SessionLocal() as db:
        client_counters = list(
            db.scalars(
                select(RateLimitCounter).where(RateLimitCounter.scope == "auth_refresh_client")
            )
        )
    assert len(client_counters) == 1
    assert client_counters[0].count == 2
    assert len(client_counters[0].key_hash) == 64
    assert "testclient" not in client_counters[0].key_hash

    monkeypatch.delenv("APP_ENV")
    monkeypatch.delenv("ALLOW_DEV_AUTH")
    monkeypatch.delenv("AUTH_JWT_SECRET")
    monkeypatch.delenv("AUTH_JWT_ISSUER")
    monkeypatch.delenv("AUTH_JWT_AUDIENCE")
    monkeypatch.delenv("AUTH_JWT_REQUIRE_JTI")
    monkeypatch.delenv("AUTH_REFRESH_RATE_LIMIT_COUNT")
    monkeypatch.delenv("AUTH_REFRESH_RATE_LIMIT_WINDOW_SECONDS")
    monkeypatch.delenv("AUTH_REFRESH_CLIENT_RATE_LIMIT_COUNT")
    monkeypatch.delenv("AUTH_REFRESH_CLIENT_RATE_LIMIT_WINDOW_SECONDS")
    monkeypatch.delenv("BACKEND_CORS_ORIGINS")
    get_settings.cache_clear()


def test_rate_limit_counters_can_be_pruned_by_retention_cutoff() -> None:
    old_token = f"old-rate-limit-token-{uuid4()}-with-enough-length"
    current_token = f"current-rate-limit-token-{uuid4()}-with-enough-length"
    cutoff = datetime.now(UTC) - timedelta(days=1)

    with SessionLocal() as db:
        prune_rate_limit_counters(older_than=datetime.now(UTC) + timedelta(days=1), db=db)
        db.commit()
        db.add_all(
            [
                RateLimitCounter(
                    scope="auth_refresh",
                    key_hash=rate_limit_key_hash(old_token),
                    window_start=cutoff - timedelta(minutes=5),
                    window_seconds=60,
                    count=3,
                ),
                RateLimitCounter(
                    scope="auth_refresh",
                    key_hash=rate_limit_key_hash(current_token),
                    window_start=cutoff + timedelta(minutes=5),
                    window_seconds=60,
                    count=1,
                ),
            ]
        )
        db.commit()

        deleted_count = prune_rate_limit_counters(older_than=cutoff, db=db)
        db.commit()
        remaining_hashes = set(
            db.scalars(
                select(RateLimitCounter.key_hash).where(
                    RateLimitCounter.key_hash.in_(
                        [rate_limit_key_hash(old_token), rate_limit_key_hash(current_token)]
                    )
                )
            )
        )

    assert deleted_count == 1
    assert rate_limit_key_hash(old_token) not in remaining_hashes
    assert rate_limit_key_hash(current_token) in remaining_hashes


def test_rate_limit_counter_pruning_rejects_naive_cutoff_before_query(
    monkeypatch: MonkeyPatch,
) -> None:
    def fail_select(*_: object, **__: object) -> object:
        raise AssertionError("naive cutoff should be rejected before query construction")

    monkeypatch.setattr(rate_limits, "select", fail_select)

    with SessionLocal() as db:
        with raises(ValueError, match="older_than"):
            prune_rate_limit_counters(older_than=datetime(2026, 5, 28, 10, 0, 0), db=db)


def test_rate_limit_counter_pruning_rejects_oversized_batch_before_query(
    monkeypatch: MonkeyPatch,
) -> None:
    def fail_select(*_: object, **__: object) -> object:
        raise AssertionError("oversized batch should be rejected before query construction")

    monkeypatch.setattr(rate_limits, "select", fail_select)

    with SessionLocal() as db:
        with raises(ValueError, match="batch_size"):
            prune_rate_limit_counters(
                older_than=datetime.now(UTC) - timedelta(days=1),
                db=db,
                batch_size=RATE_LIMIT_PRUNE_BATCH_SIZE + 1,
            )


def test_rate_limit_counter_pruning_is_batched() -> None:
    cutoff = datetime.now(UTC) - timedelta(days=1)
    old_tokens = [f"old-rate-limit-batch-token-{index}-{uuid4()}" for index in range(3)]
    current_token = f"current-rate-limit-batch-token-{uuid4()}"

    with SessionLocal() as db:
        prune_rate_limit_counters(older_than=datetime.now(UTC) + timedelta(days=1), db=db)
        db.commit()
        db.add_all(
            [
                RateLimitCounter(
                    scope="auth_refresh",
                    key_hash=rate_limit_key_hash(token),
                    window_start=cutoff - timedelta(minutes=index + 1),
                    window_seconds=60,
                    count=1,
                )
                for index, token in enumerate(old_tokens)
            ]
        )
        db.add(
            RateLimitCounter(
                scope="auth_refresh",
                key_hash=rate_limit_key_hash(current_token),
                window_start=cutoff + timedelta(minutes=5),
                window_seconds=60,
                count=1,
            )
        )
        db.commit()

        first_deleted_count = prune_rate_limit_counters(
            older_than=cutoff,
            db=db,
            batch_size=2,
        )
        db.commit()
        second_deleted_count = prune_rate_limit_counters(
            older_than=cutoff,
            db=db,
            batch_size=2,
        )
        db.commit()
        current_counter = db.scalar(
            select(RateLimitCounter).where(
                RateLimitCounter.key_hash == rate_limit_key_hash(current_token)
            )
        )

    assert first_deleted_count == 2
    assert second_deleted_count == 1
    assert current_counter is not None


def test_logout_endpoint_revokes_refresh_session() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "logout")
    refresh_token = f"logout-refresh-token-{uuid4()}-with-enough-length"

    with SessionLocal() as db:
        create_auth_session(
            account_id=UUID(account_id),
            refresh_token=refresh_token,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            db=db,
        )
        db.commit()

    response = client.post("/auth/logout", json={"refresh_token": refresh_token})

    assert response.status_code == 200
    assert response.json() == {"revoked": True}
    with SessionLocal() as db:
        assert find_active_session_by_refresh_token(refresh_token, db) is None


def test_logout_endpoint_revokes_valid_bearer_access_token_jti(
    monkeypatch: MonkeyPatch,
) -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "logout-access-token")
    refresh_token = f"logout-access-refresh-token-{uuid4()}-with-enough-length"
    jwt_id = f"logout-access-jti-{uuid4()}"
    access_token = issue_hs256_access_token(
        account_id=UUID(account_id),
        secret=STRONG_TEST_JWT_SECRET,
        expires_in_seconds=900,
        issuer=TEST_JWT_ISSUER,
        audience=TEST_JWT_AUDIENCE,
        jwt_id=jwt_id,
    )

    with SessionLocal() as db:
        create_auth_session(
            account_id=UUID(account_id),
            refresh_token=refresh_token,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            db=db,
        )
        db.commit()

    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("AUTH_JWT_SECRET", STRONG_TEST_JWT_SECRET)
    monkeypatch.setenv("AUTH_JWT_ISSUER", TEST_JWT_ISSUER)
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", TEST_JWT_AUDIENCE)
    monkeypatch.setenv("AUTH_JWT_REQUIRE_JTI", "true")
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()

    response = client.post(
        "/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"refresh_token": refresh_token},
    )

    assert response.status_code == 200
    assert response.json() == {"revoked": True}
    assert access_token not in response.text
    assert jwt_id not in response.text
    with SessionLocal() as db:
        assert find_active_session_by_refresh_token(refresh_token, db) is None
        revoked_jwt = db.scalar(
            select(RevokedJwt).where(RevokedJwt.jti_hash == jwt_id_hash(jwt_id))
        )
        assert revoked_jwt is not None
        assert jwt_id not in revoked_jwt.jti_hash

    protected_response = client.get(
        "/profiles",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert protected_response.status_code == 401
    assert protected_response.json()["detail"]["code"] == "invalid_auth_token"

    monkeypatch.delenv("APP_ENV")
    monkeypatch.delenv("ALLOW_DEV_AUTH")
    monkeypatch.delenv("AUTH_JWT_SECRET")
    monkeypatch.delenv("AUTH_JWT_ISSUER")
    monkeypatch.delenv("AUTH_JWT_AUDIENCE")
    monkeypatch.delenv("AUTH_JWT_REQUIRE_JTI")
    monkeypatch.delenv("BACKEND_CORS_ORIGINS")
    get_settings.cache_clear()


def test_logout_endpoint_is_idempotent_for_unknown_refresh_token() -> None:
    response = TestClient(app).post(
        "/auth/logout",
        json={"refresh_token": f"unknown-refresh-token-{uuid4()}-with-enough-length"},
    )

    assert response.status_code == 200
    assert response.json() == {"revoked": True}


def test_logout_endpoint_rate_limits_by_client_before_session_lookup(
    monkeypatch: MonkeyPatch,
) -> None:
    from app.api import auth as auth_api

    calls = 0

    def unknown_session(_: str, __: object) -> None:
        nonlocal calls
        calls += 1
        return None

    monkeypatch.setenv("AUTH_LOGOUT_CLIENT_RATE_LIMIT_COUNT", "2")
    monkeypatch.setenv("AUTH_LOGOUT_CLIENT_RATE_LIMIT_WINDOW_SECONDS", "60")
    get_settings.cache_clear()
    monkeypatch.setattr(auth_api, "find_active_session_by_refresh_token", unknown_session)

    with SessionLocal() as db:
        db.execute(delete(RateLimitCounter).where(RateLimitCounter.scope == "auth_logout_client"))
        db.commit()

    client = TestClient(app)
    responses = [
        client.post(
            "/auth/logout",
            json={"refresh_token": f"logout-rate-limit-{index}-{uuid4()}"},
        )
        for index in range(3)
    ]

    assert [response.status_code for response in responses] == [200, 200, 429]
    assert responses[2].json()["detail"]["code"] == "rate_limit_exceeded"
    assert int(responses[2].headers["Retry-After"]) >= 1
    assert calls == 2
    with SessionLocal() as db:
        counters = list(
            db.scalars(
                select(RateLimitCounter).where(RateLimitCounter.scope == "auth_logout_client")
            )
        )
    assert counters
    assert all(len(counter.key_hash) == 64 for counter in counters)

    monkeypatch.delenv("AUTH_LOGOUT_CLIENT_RATE_LIMIT_COUNT")
    monkeypatch.delenv("AUTH_LOGOUT_CLIENT_RATE_LIMIT_WINDOW_SECONDS")
    get_settings.cache_clear()


def test_logout_all_endpoint_revokes_only_current_account_sessions() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "logout-all")
    other_account_id, _ = create_account_and_profile(client, "logout-all-other")
    first_token = f"logout-all-first-{uuid4()}-with-enough-length"
    second_token = f"logout-all-second-{uuid4()}-with-enough-length"
    other_token = f"logout-all-other-{uuid4()}-with-enough-length"

    with SessionLocal() as db:
        create_auth_session(
            account_id=UUID(account_id),
            refresh_token=first_token,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            db=db,
        )
        create_auth_session(
            account_id=UUID(account_id),
            refresh_token=second_token,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            db=db,
        )
        create_auth_session(
            account_id=UUID(other_account_id),
            refresh_token=other_token,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            db=db,
        )
        db.commit()

    response = client.post("/auth/logout-all", headers={"X-Account-Id": account_id})

    assert response.status_code == 200
    assert response.json() == {"revoked_sessions": 2}
    with SessionLocal() as db:
        assert find_active_session_by_refresh_token(first_token, db) is None
        assert find_active_session_by_refresh_token(second_token, db) is None
        assert find_active_session_by_refresh_token(other_token, db) is not None


def test_logout_all_endpoint_revokes_current_bearer_access_token_jti(
    monkeypatch: MonkeyPatch,
) -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "logout-all-access-token")
    first_token = f"logout-all-access-first-{uuid4()}-with-enough-length"
    second_token = f"logout-all-access-second-{uuid4()}-with-enough-length"
    jwt_id = f"logout-all-access-jti-{uuid4()}"
    access_token = issue_hs256_access_token(
        account_id=UUID(account_id),
        secret=STRONG_TEST_JWT_SECRET,
        expires_in_seconds=900,
        issuer=TEST_JWT_ISSUER,
        audience=TEST_JWT_AUDIENCE,
        jwt_id=jwt_id,
    )

    with SessionLocal() as db:
        create_auth_session(
            account_id=UUID(account_id),
            refresh_token=first_token,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            db=db,
        )
        create_auth_session(
            account_id=UUID(account_id),
            refresh_token=second_token,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            db=db,
        )
        db.commit()

    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("AUTH_JWT_SECRET", STRONG_TEST_JWT_SECRET)
    monkeypatch.setenv("AUTH_JWT_ISSUER", TEST_JWT_ISSUER)
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", TEST_JWT_AUDIENCE)
    monkeypatch.setenv("AUTH_JWT_REQUIRE_JTI", "true")
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()

    response = client.post(
        "/auth/logout-all",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert response.status_code == 200
    assert response.json() == {"revoked_sessions": 2}
    assert access_token not in response.text
    assert jwt_id not in response.text
    with SessionLocal() as db:
        assert find_active_session_by_refresh_token(first_token, db) is None
        assert find_active_session_by_refresh_token(second_token, db) is None
        revoked_jwt = db.scalar(
            select(RevokedJwt).where(RevokedJwt.jti_hash == jwt_id_hash(jwt_id))
        )
        assert revoked_jwt is not None
        assert jwt_id not in revoked_jwt.jti_hash

    protected_response = client.get(
        "/profiles",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert protected_response.status_code == 401
    assert protected_response.json()["detail"]["code"] == "invalid_auth_token"

    monkeypatch.delenv("APP_ENV")
    monkeypatch.delenv("ALLOW_DEV_AUTH")
    monkeypatch.delenv("AUTH_JWT_SECRET")
    monkeypatch.delenv("AUTH_JWT_ISSUER")
    monkeypatch.delenv("AUTH_JWT_AUDIENCE")
    monkeypatch.delenv("AUTH_JWT_REQUIRE_JTI")
    monkeypatch.delenv("BACKEND_CORS_ORIGINS")
    get_settings.cache_clear()


def test_logout_all_endpoint_requires_authentication() -> None:
    response = TestClient(app).post("/auth/logout-all")

    assert response.status_code == 401


def test_list_sessions_returns_active_current_account_metadata_only() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "sessions")
    other_account_id, _ = create_account_and_profile(client, "sessions-other")
    active_token = f"sessions-active-{uuid4()}-with-enough-length"
    expired_token = f"sessions-expired-{uuid4()}-with-enough-length"
    other_token = f"sessions-other-{uuid4()}-with-enough-length"
    device_fingerprint = f"sessions-device-{uuid4()}"

    with SessionLocal() as db:
        active_session = create_auth_session(
            account_id=UUID(account_id),
            refresh_token=active_token,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            db=db,
            device_fingerprint=device_fingerprint,
        )
        create_auth_session(
            account_id=UUID(account_id),
            refresh_token=expired_token,
            expires_at=datetime.now(UTC) - timedelta(minutes=5),
            db=db,
        )
        create_auth_session(
            account_id=UUID(other_account_id),
            refresh_token=other_token,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            db=db,
        )
        db.commit()
        db.refresh(active_session)
        active_session_id = str(active_session.id)

    response = client.get("/auth/sessions", headers={"X-Account-Id": account_id})

    assert response.status_code == 200
    sessions = response.json()
    assert [session["id"] for session in sessions] == [active_session_id]
    assert sessions[0]["has_device_fingerprint"] is True
    response_text = response.text
    assert active_token not in response_text
    assert expired_token not in response_text
    assert other_token not in response_text
    assert device_fingerprint not in response_text
    assert "refresh_token_hash" not in response_text
    assert "device_fingerprint_hash" not in response_text


def test_list_sessions_applies_bounded_limit() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "sessions-limit")

    with SessionLocal() as db:
        sessions = [
            create_auth_session(
                account_id=UUID(account_id),
                refresh_token=f"sessions-limit-{index}-{uuid4()}-with-enough-length",
                expires_at=datetime.now(UTC) + timedelta(days=7),
                db=db,
            )
            for index in range(3)
        ]
        db.commit()
        for session in sessions:
            db.refresh(session)
        session_ids = {str(session.id) for session in sessions}

    response = client.get("/auth/sessions?limit=2", headers={"X-Account-Id": account_id})

    assert response.status_code == 200
    listed_ids = {session["id"] for session in response.json()}
    assert len(listed_ids) == 2
    assert listed_ids <= session_ids


def test_list_sessions_rejects_limit_above_maximum() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "sessions-limit-too-large")

    response = client.get("/auth/sessions?limit=501", headers={"X-Account-Id": account_id})

    assert response.status_code == 422


def test_list_sessions_requires_authentication() -> None:
    response = TestClient(app).get("/auth/sessions")

    assert response.status_code == 401


def test_revoke_session_endpoint_revokes_only_current_account_session() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "session-revoke")
    other_account_id, _ = create_account_and_profile(client, "session-revoke-other")
    current_token = f"session-revoke-current-{uuid4()}-with-enough-length"
    other_token = f"session-revoke-other-{uuid4()}-with-enough-length"

    with SessionLocal() as db:
        current_session = create_auth_session(
            account_id=UUID(account_id),
            refresh_token=current_token,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            db=db,
        )
        other_session = create_auth_session(
            account_id=UUID(other_account_id),
            refresh_token=other_token,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            db=db,
        )
        db.commit()
        db.refresh(current_session)
        db.refresh(other_session)
        current_session_id = str(current_session.id)
        other_session_id = str(other_session.id)

    response = client.delete(
        f"/auth/sessions/{current_session_id}",
        headers={"X-Account-Id": account_id},
    )

    assert response.status_code == 200
    assert response.json() == {"revoked": True}
    with SessionLocal() as db:
        assert find_active_session_by_refresh_token(current_token, db) is None
        assert find_active_session_by_refresh_token(other_token, db) is not None

    other_account_response = client.delete(
        f"/auth/sessions/{other_session_id}",
        headers={"X-Account-Id": account_id},
    )
    assert other_account_response.status_code == 200
    assert other_account_response.json() == {"revoked": True}
    with SessionLocal() as db:
        assert find_active_session_by_refresh_token(other_token, db) is not None


def test_revoke_session_endpoint_is_idempotent_for_unknown_session_id() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "session-revoke-unknown")

    response = client.delete(
        f"/auth/sessions/{uuid4()}",
        headers={"X-Account-Id": account_id},
    )

    assert response.status_code == 200
    assert response.json() == {"revoked": True}


def test_revoke_session_endpoint_requires_authentication() -> None:
    response = TestClient(app).delete(f"/auth/sessions/{uuid4()}")

    assert response.status_code == 401
