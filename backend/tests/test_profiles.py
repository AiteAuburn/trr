import base64
import hashlib
import hmac
import json
from datetime import UTC, datetime, timedelta
from time import time
from uuid import UUID, uuid4

from fastapi.testclient import TestClient
from pydantic import ValidationError
from pytest import MonkeyPatch, raises
from sqlalchemy import select

from app.core.auth import JWT_AUDIENCE_LIST_MAX_ITEMS, JWT_JSON_MAX_KEYS
from app.core.config import get_settings
from app.db.session import SessionLocal
from app.main import app
from app.models import RevokedJwt
from app.schemas.profile import (
    PROFILE_DISPLAY_NAME_MAX_LENGTH,
    PROFILE_GRANT_SCOPES_MAX_COUNT,
    ProfileAccessGrantRead,
    ProfileRead,
    SharedProfileRead,
)
from app.services import token_revocation
from app.services.token_revocation import (
    MAX_JWT_ID_LENGTH,
    REVOKED_JWT_PRUNE_BATCH_SIZE,
    jwt_id_hash,
    prune_expired_revoked_jwts,
    revoke_jwt_id,
)

STRONG_TEST_JWT_SECRET = "test-secret-with-at-least-32-characters"
TEST_JWT_ISSUER = "https://issuer.example.com"
TEST_JWT_AUDIENCE = "bloodsugar-api"
OVERSIZED_AUTHORIZATION = f"Bearer {'a' * 4097}"
OVERSIZED_JWT_PAYLOAD_AUTHORIZATION = f"Bearer eyJhbGciOiJIUzI1NiJ9.{'a' * 2049}.signature"


def test_jwt_id_hash_normalizes_whitespace() -> None:
    jwt_id = f"jwt-{uuid4()}"

    assert jwt_id_hash(f"  {jwt_id}\n") == jwt_id_hash(jwt_id)


def test_jwt_id_hash_rejects_oversized_value_before_hashing(
    monkeypatch: MonkeyPatch,
) -> None:
    def fail_hash(_: bytes) -> object:
        raise AssertionError("oversized jti should not be hashed")

    monkeypatch.setattr(token_revocation.hashlib, "sha256", fail_hash)

    try:
        jwt_id_hash("j" * (MAX_JWT_ID_LENGTH + 1))
    except ValueError as exc:
        assert "jti" in str(exc)
    else:
        raise AssertionError("oversized jti should be rejected")


def test_revoke_jwt_id_rejects_naive_expiration_before_hashing(
    monkeypatch: MonkeyPatch,
) -> None:
    def fail_hash(_: str) -> str:
        raise AssertionError("naive expiration should be rejected before jti hashing")

    monkeypatch.setattr(token_revocation, "jwt_id_hash", fail_hash)

    with SessionLocal() as db:
        try:
            revoke_jwt_id(
                f"jwt-{uuid4()}",
                datetime(2026, 5, 28, 10, 0, 0),
                db,
            )
        except ValueError as exc:
            assert "expires_at" in str(exc)
        else:
            raise AssertionError("naive expiration should be rejected")


def _jwt_for_account(
    account_id: str,
    *,
    secret: str,
    expires_in_seconds: int = 300,
    issuer: str = TEST_JWT_ISSUER,
    audience: str = TEST_JWT_AUDIENCE,
    include_jti: bool = True,
    extra_claims: dict[str, object] | None = None,
) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    issued_at = int(time())
    payload = {
        "sub": account_id,
        "iat": issued_at,
        "exp": issued_at + expires_in_seconds,
        "iss": issuer,
        "aud": audience,
    }
    if include_jti:
        payload["jti"] = f"jwt-{uuid4()}"
    if extra_claims:
        payload.update(extra_claims)
    encoded_header = _base64url_json(header)
    encoded_payload = _base64url_json(payload)
    signing_input = f"{encoded_header}.{encoded_payload}".encode()
    signature = hmac.new(secret.encode(), signing_input, hashlib.sha256).digest()
    return f"{encoded_header}.{encoded_payload}.{_base64url(signature)}"


def _base64url_json(value: dict[str, object]) -> str:
    return _base64url(json.dumps(value, separators=(",", ":")).encode())


def _base64url(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode().rstrip("=")


def test_dev_login_and_profile_flow() -> None:
    client = TestClient(app)
    email = f"profile-{uuid4()}@example.com"

    login_response = client.post(
        "/auth/dev-login",
        json={"email": email, "display_name": "Profile Tester"},
    )
    assert login_response.status_code == 200
    account_id = login_response.json()["id"]

    empty_profiles_response = client.get("/profiles", headers={"X-Account-Id": account_id})
    assert empty_profiles_response.status_code == 200
    assert empty_profiles_response.json() == []

    create_response = client.post(
        "/profiles",
        headers={"X-Account-Id": account_id},
        json={"display_name": "媽媽", "relationship": "mother"},
    )
    assert create_response.status_code == 201
    profile = create_response.json()
    assert profile["display_name"] == "媽媽"
    assert profile["relationship"] == "mother"

    list_response = client.get("/profiles", headers={"X-Account-Id": account_id})
    assert list_response.status_code == 200
    assert [item["id"] for item in list_response.json()] == [profile["id"]]


def test_dev_login_and_profile_text_fields_are_normalized() -> None:
    client = TestClient(app)
    email = f"profile-normalized-{uuid4()}@example.com"

    login_response = client.post(
        "/auth/dev-login",
        json={"email": email, "display_name": "  Profile Tester  "},
    )
    assert login_response.status_code == 200
    account_id = login_response.json()["id"]
    assert login_response.json()["display_name"] == "Profile Tester"

    create_response = client.post(
        "/profiles",
        headers={"X-Account-Id": account_id},
        json={"display_name": "  媽媽  ", "relationship": "  mother  "},
    )
    assert create_response.status_code == 201
    profile = create_response.json()
    assert profile["display_name"] == "媽媽"
    assert profile["relationship"] == "mother"


def test_dev_login_and_profile_reject_blank_text_fields() -> None:
    client = TestClient(app)
    login_response = client.post(
        "/auth/dev-login",
        json={"email": f"profile-blank-{uuid4()}@example.com", "display_name": "   "},
    )
    assert login_response.status_code == 422
    assert "display_name" in login_response.text

    account_response = client.post(
        "/auth/dev-login",
        json={"email": f"profile-valid-{uuid4()}@example.com", "display_name": "Valid"},
    )
    assert account_response.status_code == 200
    profile_response = client.post(
        "/profiles",
        headers={"X-Account-Id": account_response.json()["id"]},
        json={"display_name": "   ", "relationship": "self"},
    )
    assert profile_response.status_code == 422
    assert "profile text must not be blank" in profile_response.text


def test_profile_response_schemas_bound_public_text_and_grant_scopes() -> None:
    with raises(ValidationError):
        ProfileRead(
            id=UUID(int=1),
            account_id=UUID(int=2),
            display_name="x" * (PROFILE_DISPLAY_NAME_MAX_LENGTH + 1),
            relationship="self",
            created_at=datetime(2026, 4, 30, 8, 0, tzinfo=UTC),
            updated_at=datetime(2026, 4, 30, 8, 0, tzinfo=UTC),
        )

    with raises(ValidationError):
        ProfileAccessGrantRead(
            id=UUID(int=1),
            profile_id=UUID(int=2),
            grantee_account_id=UUID(int=3),
            grant_type="caregiver",
            scopes=["profile:read" for _ in range(PROFILE_GRANT_SCOPES_MAX_COUNT + 1)],
            expires_at=None,
            revoked_at=None,
            created_at=datetime(2026, 4, 30, 8, 0, tzinfo=UTC),
            updated_at=datetime(2026, 4, 30, 8, 0, tzinfo=UTC),
        )

    with raises(ValidationError):
        SharedProfileRead(
            profile_id=UUID(int=2),
            display_name="媽媽",
            relationship="mother",
            grant_id=UUID(int=1),
            grant_type="caregiver",
            scopes=["profile:unknown"],
            expires_at=None,
            created_at=datetime(2026, 4, 30, 8, 0, tzinfo=UTC),
        )


def test_profile_list_is_bounded_and_supports_before_cursor() -> None:
    client = TestClient(app)
    login_response = client.post(
        "/auth/dev-login",
        json={"email": f"profile-list-{uuid4()}@example.com", "display_name": "Profile List"},
    )
    assert login_response.status_code == 200
    account_id = login_response.json()["id"]

    created_profiles: list[dict[str, object]] = []
    for index in range(3):
        response = client.post(
            "/profiles",
            headers={"X-Account-Id": account_id},
            json={"display_name": f"家人 {index}", "relationship": "family"},
        )
        assert response.status_code == 201
        created_profiles.append(response.json())

    first_page = client.get("/profiles?limit=2", headers={"X-Account-Id": account_id})
    too_large = client.get("/profiles?limit=501", headers={"X-Account-Id": account_id})
    assert first_page.status_code == 200
    assert too_large.status_code == 422
    first_page_items = first_page.json()
    next_page = client.get(
        f"/profiles?limit=2&before={first_page_items[-1]['created_at']}",
        headers={"X-Account-Id": account_id},
    )

    assert next_page.status_code == 200
    assert [item["id"] for item in first_page_items] == [
        created_profiles[2]["id"],
        created_profiles[1]["id"],
    ]
    assert [item["id"] for item in next_page.json()] == [created_profiles[0]["id"]]


def test_profile_list_rejects_naive_cursor_before_query() -> None:
    client = TestClient(app)
    login_response = client.post(
        "/auth/dev-login",
        json={"email": f"profile-naive-cursor-{uuid4()}@example.com", "display_name": "Profile"},
    )
    assert login_response.status_code == 200
    account_id = login_response.json()["id"]

    response = client.get(
        "/profiles?before=2026-04-30T08:00:00",
        headers={"X-Account-Id": account_id},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "invalid_datetime",
        "field": "before",
        "message": "datetime must include a timezone.",
    }


def test_dev_auth_is_disabled_in_production(monkeypatch: MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()

    client = TestClient(app)
    login_response = client.post(
        "/auth/dev-login",
        json={"email": "disabled@example.com", "display_name": "Disabled"},
    )

    assert login_response.status_code == 404

    profiles_response = client.get(
        "/profiles",
        headers={"X-Account-Id": str(uuid4())},
    )
    assert profiles_response.status_code == 401
    assert profiles_response.json()["detail"] == {
        "code": "production_auth_not_configured",
        "message": "Production authentication is not configured.",
        "hint": "configure_jwt_or_oidc_auth",
    }

    monkeypatch.delenv("APP_ENV")
    monkeypatch.delenv("ALLOW_DEV_AUTH")
    monkeypatch.delenv("BACKEND_CORS_ORIGINS")
    get_settings.cache_clear()


def test_bearer_token_auth_is_not_silently_accepted_before_real_auth(
    monkeypatch: MonkeyPatch,
) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()

    response = TestClient(app).get(
        "/profiles",
        headers={"Authorization": "Bearer placeholder"},
    )

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "production_auth_not_configured"

    monkeypatch.delenv("APP_ENV")
    monkeypatch.delenv("ALLOW_DEV_AUTH")
    monkeypatch.delenv("BACKEND_CORS_ORIGINS")
    get_settings.cache_clear()


def test_production_bearer_jwt_can_authenticate_account(monkeypatch: MonkeyPatch) -> None:
    client = TestClient(app)
    email = f"jwt-{uuid4()}@example.com"
    login_response = client.post(
        "/auth/dev-login",
        json={"email": email, "display_name": "JWT Tester"},
    )
    assert login_response.status_code == 200
    account_id = login_response.json()["id"]

    create_response = client.post(
        "/profiles",
        headers={"X-Account-Id": account_id},
        json={"display_name": "自己", "relationship": "self"},
    )
    assert create_response.status_code == 201

    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("AUTH_JWT_SECRET", STRONG_TEST_JWT_SECRET)
    monkeypatch.setenv("AUTH_JWT_ISSUER", TEST_JWT_ISSUER)
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", TEST_JWT_AUDIENCE)
    monkeypatch.setenv("AUTH_JWT_REQUIRE_JTI", "true")
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()

    response = client.get(
        "/profiles",
        headers={
            "Authorization": f"Bearer {_jwt_for_account(account_id, secret=STRONG_TEST_JWT_SECRET)}"
        },
    )

    assert response.status_code == 200
    assert [profile["id"] for profile in response.json()] == [create_response.json()["id"]]

    monkeypatch.delenv("APP_ENV")
    monkeypatch.delenv("ALLOW_DEV_AUTH")
    monkeypatch.delenv("AUTH_JWT_SECRET")
    monkeypatch.delenv("AUTH_JWT_ISSUER")
    monkeypatch.delenv("AUTH_JWT_AUDIENCE")
    monkeypatch.delenv("AUTH_JWT_REQUIRE_JTI")
    monkeypatch.delenv("BACKEND_CORS_ORIGINS")
    get_settings.cache_clear()


def test_production_bearer_jwt_requires_jti_when_configured(monkeypatch: MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("AUTH_JWT_SECRET", STRONG_TEST_JWT_SECRET)
    monkeypatch.setenv("AUTH_JWT_ISSUER", TEST_JWT_ISSUER)
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", TEST_JWT_AUDIENCE)
    monkeypatch.setenv("AUTH_JWT_REQUIRE_JTI", "true")
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()

    response = TestClient(app).get(
        "/profiles",
        headers={
            "Authorization": (
                "Bearer "
                + _jwt_for_account(
                    str(uuid4()),
                    secret=STRONG_TEST_JWT_SECRET,
                    include_jti=False,
                )
            )
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "invalid_auth_token"

    monkeypatch.delenv("APP_ENV")
    monkeypatch.delenv("ALLOW_DEV_AUTH")
    monkeypatch.delenv("AUTH_JWT_SECRET")
    monkeypatch.delenv("AUTH_JWT_ISSUER")
    monkeypatch.delenv("AUTH_JWT_AUDIENCE")
    monkeypatch.delenv("AUTH_JWT_REQUIRE_JTI")
    monkeypatch.delenv("BACKEND_CORS_ORIGINS")
    get_settings.cache_clear()


def test_production_bearer_jwt_rejects_oversized_jti_before_lookup(
    monkeypatch: MonkeyPatch,
) -> None:
    from app.api import deps as auth_deps

    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("AUTH_JWT_SECRET", STRONG_TEST_JWT_SECRET)
    monkeypatch.setenv("AUTH_JWT_ISSUER", TEST_JWT_ISSUER)
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", TEST_JWT_AUDIENCE)
    monkeypatch.setenv("AUTH_JWT_REQUIRE_JTI", "true")
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()

    def revocation_lookup_should_not_run(*_: object, **__: object) -> object:
        raise AssertionError("revocation lookup should not run for oversized jwt id")

    def account_lookup_should_not_run(*_: object, **__: object) -> object:
        raise AssertionError("account lookup should not run for oversized jwt id")

    monkeypatch.setattr(auth_deps, "is_jwt_revoked", revocation_lookup_should_not_run)
    monkeypatch.setattr(auth_deps, "select", account_lookup_should_not_run)

    response = TestClient(app).get(
        "/profiles",
        headers={
            "Authorization": (
                "Bearer "
                + _jwt_for_account(
                    str(uuid4()),
                    secret=STRONG_TEST_JWT_SECRET,
                    extra_claims={"jti": "j" * 129},
                )
            )
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == {
        "code": "invalid_auth_token",
        "message": "Authentication token is invalid or expired.",
        "hint": "sign_in_again",
    }
    assert "j" * 129 not in response.text

    monkeypatch.delenv("APP_ENV")
    monkeypatch.delenv("ALLOW_DEV_AUTH")
    monkeypatch.delenv("AUTH_JWT_SECRET")
    monkeypatch.delenv("AUTH_JWT_ISSUER")
    monkeypatch.delenv("AUTH_JWT_AUDIENCE")
    monkeypatch.delenv("AUTH_JWT_REQUIRE_JTI")
    monkeypatch.delenv("BACKEND_CORS_ORIGINS")
    get_settings.cache_clear()


def test_production_bearer_jwt_rejects_invalid_signature(monkeypatch: MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("AUTH_JWT_SECRET", STRONG_TEST_JWT_SECRET)
    monkeypatch.setenv("AUTH_JWT_ISSUER", TEST_JWT_ISSUER)
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", TEST_JWT_AUDIENCE)
    monkeypatch.setenv("AUTH_JWT_REQUIRE_JTI", "true")
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()

    response = TestClient(app).get(
        "/profiles",
        headers={
            "Authorization": f"Bearer {_jwt_for_account(str(uuid4()), secret='wrong-secret')}"
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == {
        "code": "invalid_auth_token",
        "message": "Authentication token is invalid or expired.",
        "hint": "sign_in_again",
    }

    monkeypatch.delenv("APP_ENV")
    monkeypatch.delenv("ALLOW_DEV_AUTH")
    monkeypatch.delenv("AUTH_JWT_SECRET")
    monkeypatch.delenv("AUTH_JWT_ISSUER")
    monkeypatch.delenv("AUTH_JWT_AUDIENCE")
    monkeypatch.delenv("AUTH_JWT_REQUIRE_JTI")
    monkeypatch.delenv("BACKEND_CORS_ORIGINS")
    get_settings.cache_clear()


def test_production_bearer_jwt_rejects_oversized_authorization_before_lookup(
    monkeypatch: MonkeyPatch,
) -> None:
    from app.api import deps as auth_deps

    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("AUTH_JWT_SECRET", STRONG_TEST_JWT_SECRET)
    monkeypatch.setenv("AUTH_JWT_ISSUER", TEST_JWT_ISSUER)
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", TEST_JWT_AUDIENCE)
    monkeypatch.setenv("AUTH_JWT_REQUIRE_JTI", "true")
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()

    def db_lookup_should_not_run(*_: object, **__: object) -> object:
        raise AssertionError("account lookup should not run for oversized bearer token")

    monkeypatch.setattr(auth_deps, "select", db_lookup_should_not_run)

    response = TestClient(app).get(
        "/profiles",
        headers={"Authorization": OVERSIZED_AUTHORIZATION},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == {
        "code": "invalid_auth_token",
        "message": "Authentication token is invalid or expired.",
        "hint": "sign_in_again",
    }
    assert OVERSIZED_AUTHORIZATION not in response.text

    monkeypatch.delenv("APP_ENV")
    monkeypatch.delenv("ALLOW_DEV_AUTH")
    monkeypatch.delenv("AUTH_JWT_SECRET")
    monkeypatch.delenv("AUTH_JWT_ISSUER")
    monkeypatch.delenv("AUTH_JWT_AUDIENCE")
    monkeypatch.delenv("AUTH_JWT_REQUIRE_JTI")
    monkeypatch.delenv("BACKEND_CORS_ORIGINS")
    get_settings.cache_clear()


def test_production_bearer_jwt_rejects_oversized_payload_part_before_lookup(
    monkeypatch: MonkeyPatch,
) -> None:
    from app.api import deps as auth_deps

    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("AUTH_JWT_SECRET", STRONG_TEST_JWT_SECRET)
    monkeypatch.setenv("AUTH_JWT_ISSUER", TEST_JWT_ISSUER)
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", TEST_JWT_AUDIENCE)
    monkeypatch.setenv("AUTH_JWT_REQUIRE_JTI", "true")
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()

    def db_lookup_should_not_run(*_: object, **__: object) -> object:
        raise AssertionError("account lookup should not run for oversized jwt payload")

    monkeypatch.setattr(auth_deps, "select", db_lookup_should_not_run)

    response = TestClient(app).get(
        "/profiles",
        headers={"Authorization": OVERSIZED_JWT_PAYLOAD_AUTHORIZATION},
    )

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "invalid_auth_token"
    assert OVERSIZED_JWT_PAYLOAD_AUTHORIZATION not in response.text

    monkeypatch.delenv("APP_ENV")
    monkeypatch.delenv("ALLOW_DEV_AUTH")
    monkeypatch.delenv("AUTH_JWT_SECRET")
    monkeypatch.delenv("AUTH_JWT_ISSUER")
    monkeypatch.delenv("AUTH_JWT_AUDIENCE")
    monkeypatch.delenv("AUTH_JWT_REQUIRE_JTI")
    monkeypatch.delenv("BACKEND_CORS_ORIGINS")
    get_settings.cache_clear()


def test_production_bearer_jwt_rejects_too_many_claims_before_lookup(
    monkeypatch: MonkeyPatch,
) -> None:
    from app.api import deps as auth_deps

    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("AUTH_JWT_SECRET", STRONG_TEST_JWT_SECRET)
    monkeypatch.setenv("AUTH_JWT_ISSUER", TEST_JWT_ISSUER)
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", TEST_JWT_AUDIENCE)
    monkeypatch.setenv("AUTH_JWT_REQUIRE_JTI", "true")
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()

    def db_lookup_should_not_run(*_: object, **__: object) -> object:
        raise AssertionError("account lookup should not run for wide jwt claims")

    monkeypatch.setattr(auth_deps, "select", db_lookup_should_not_run)

    response = TestClient(app).get(
        "/profiles",
        headers={
            "Authorization": (
                "Bearer "
                + _jwt_for_account(
                    str(uuid4()),
                    secret=STRONG_TEST_JWT_SECRET,
                    extra_claims={
                        f"c{index}": index
                        for index in range(JWT_JSON_MAX_KEYS + 1)
                    },
                )
            )
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "invalid_auth_token"

    monkeypatch.delenv("APP_ENV")
    monkeypatch.delenv("ALLOW_DEV_AUTH")
    monkeypatch.delenv("AUTH_JWT_SECRET")
    monkeypatch.delenv("AUTH_JWT_ISSUER")
    monkeypatch.delenv("AUTH_JWT_AUDIENCE")
    monkeypatch.delenv("AUTH_JWT_REQUIRE_JTI")
    monkeypatch.delenv("BACKEND_CORS_ORIGINS")
    get_settings.cache_clear()


def test_production_bearer_jwt_rejects_wide_audience_before_lookup(
    monkeypatch: MonkeyPatch,
) -> None:
    from app.api import deps as auth_deps

    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("AUTH_JWT_SECRET", STRONG_TEST_JWT_SECRET)
    monkeypatch.setenv("AUTH_JWT_ISSUER", TEST_JWT_ISSUER)
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", TEST_JWT_AUDIENCE)
    monkeypatch.setenv("AUTH_JWT_REQUIRE_JTI", "true")
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()

    def db_lookup_should_not_run(*_: object, **__: object) -> object:
        raise AssertionError("account lookup should not run for wide jwt audience")

    monkeypatch.setattr(auth_deps, "select", db_lookup_should_not_run)

    response = TestClient(app).get(
        "/profiles",
        headers={
            "Authorization": (
                "Bearer "
                + _jwt_for_account(
                    str(uuid4()),
                    secret=STRONG_TEST_JWT_SECRET,
                    extra_claims={
                        "aud": [
                            f"audience-{index}"
                            for index in range(JWT_AUDIENCE_LIST_MAX_ITEMS + 1)
                        ]
                    },
                )
            )
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "invalid_auth_token"

    monkeypatch.delenv("APP_ENV")
    monkeypatch.delenv("ALLOW_DEV_AUTH")
    monkeypatch.delenv("AUTH_JWT_SECRET")
    monkeypatch.delenv("AUTH_JWT_ISSUER")
    monkeypatch.delenv("AUTH_JWT_AUDIENCE")
    monkeypatch.delenv("AUTH_JWT_REQUIRE_JTI")
    monkeypatch.delenv("BACKEND_CORS_ORIGINS")
    get_settings.cache_clear()


def test_production_bearer_jwt_rejects_future_nbf(monkeypatch: MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("AUTH_JWT_SECRET", STRONG_TEST_JWT_SECRET)
    monkeypatch.setenv("AUTH_JWT_ISSUER", TEST_JWT_ISSUER)
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", TEST_JWT_AUDIENCE)
    monkeypatch.setenv("AUTH_JWT_REQUIRE_JTI", "true")
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()

    response = TestClient(app).get(
        "/profiles",
        headers={
            "Authorization": (
                "Bearer "
                + _jwt_for_account(
                    str(uuid4()),
                    secret=STRONG_TEST_JWT_SECRET,
                    extra_claims={"nbf": int(time()) + 300},
                )
            )
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "invalid_auth_token"

    monkeypatch.delenv("APP_ENV")
    monkeypatch.delenv("ALLOW_DEV_AUTH")
    monkeypatch.delenv("AUTH_JWT_SECRET")
    monkeypatch.delenv("AUTH_JWT_ISSUER")
    monkeypatch.delenv("AUTH_JWT_AUDIENCE")
    monkeypatch.delenv("AUTH_JWT_REQUIRE_JTI")
    monkeypatch.delenv("BACKEND_CORS_ORIGINS")
    get_settings.cache_clear()


def test_production_bearer_jwt_rejects_long_lived_access_token(
    monkeypatch: MonkeyPatch,
) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_AUTH", "false")
    monkeypatch.setenv("AUTH_JWT_SECRET", STRONG_TEST_JWT_SECRET)
    monkeypatch.setenv("AUTH_JWT_ISSUER", TEST_JWT_ISSUER)
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", TEST_JWT_AUDIENCE)
    monkeypatch.setenv("AUTH_JWT_REQUIRE_JTI", "true")
    monkeypatch.setenv("AUTH_JWT_MAX_AGE_SECONDS", "900")
    monkeypatch.setenv("BACKEND_CORS_ORIGINS", "https://app.example.com")
    get_settings.cache_clear()

    response = TestClient(app).get(
        "/profiles",
        headers={
            "Authorization": (
                "Bearer "
                + _jwt_for_account(
                    str(uuid4()),
                    secret=STRONG_TEST_JWT_SECRET,
                    expires_in_seconds=3600,
                )
            )
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "invalid_auth_token"

    monkeypatch.delenv("APP_ENV")
    monkeypatch.delenv("ALLOW_DEV_AUTH")
    monkeypatch.delenv("AUTH_JWT_SECRET")
    monkeypatch.delenv("AUTH_JWT_ISSUER")
    monkeypatch.delenv("AUTH_JWT_AUDIENCE")
    monkeypatch.delenv("AUTH_JWT_REQUIRE_JTI")
    monkeypatch.delenv("AUTH_JWT_MAX_AGE_SECONDS")
    monkeypatch.delenv("BACKEND_CORS_ORIGINS")
    get_settings.cache_clear()


def test_production_bearer_jwt_rejects_revoked_jti(monkeypatch: MonkeyPatch) -> None:
    client = TestClient(app)
    login_response = client.post(
        "/auth/dev-login",
        json={"email": f"revoked-{uuid4()}@example.com", "display_name": "Revoked"},
    )
    assert login_response.status_code == 200
    account_id = login_response.json()["id"]
    jwt_id = f"jwt-{uuid4()}"

    with SessionLocal() as db:
        db.add(
            RevokedJwt(
                jti_hash=jwt_id_hash(jwt_id),
                expires_at=datetime.now(UTC) + timedelta(minutes=5),
            )
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

    response = client.get(
        "/profiles",
        headers={
            "Authorization": (
                "Bearer "
                + _jwt_for_account(
                    account_id,
                    secret=STRONG_TEST_JWT_SECRET,
                    extra_claims={"jti": jwt_id},
                )
            )
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "invalid_auth_token"

    monkeypatch.delenv("APP_ENV")
    monkeypatch.delenv("ALLOW_DEV_AUTH")
    monkeypatch.delenv("AUTH_JWT_SECRET")
    monkeypatch.delenv("AUTH_JWT_ISSUER")
    monkeypatch.delenv("AUTH_JWT_AUDIENCE")
    monkeypatch.delenv("AUTH_JWT_REQUIRE_JTI")
    monkeypatch.delenv("BACKEND_CORS_ORIGINS")
    get_settings.cache_clear()


def test_expired_revoked_jwts_can_be_pruned() -> None:
    expired_jwt_id = f"expired-{uuid4()}"
    active_jwt_id = f"active-{uuid4()}"

    with SessionLocal() as db:
        prune_expired_revoked_jwts(db)
        db.commit()
        db.add_all(
            [
                RevokedJwt(
                    jti_hash=jwt_id_hash(expired_jwt_id),
                    expires_at=datetime.now(UTC) - timedelta(minutes=5),
                ),
                RevokedJwt(
                    jti_hash=jwt_id_hash(active_jwt_id),
                    expires_at=datetime.now(UTC) + timedelta(minutes=5),
                ),
            ]
        )
        db.commit()

        deleted_count = prune_expired_revoked_jwts(db)
        db.commit()
        remaining_hashes = set(db.scalars(select(RevokedJwt.jti_hash)))

    assert deleted_count == 1
    assert jwt_id_hash(expired_jwt_id) not in remaining_hashes
    assert jwt_id_hash(active_jwt_id) in remaining_hashes


def test_expired_revoked_jwt_pruning_is_batched() -> None:
    expired_jwt_ids = [f"expired-batch-{index}-{uuid4()}" for index in range(3)]

    with SessionLocal() as db:
        prune_expired_revoked_jwts(db)
        db.commit()
        db.add_all(
            [
                RevokedJwt(
                    jti_hash=jwt_id_hash(jwt_id),
                    expires_at=datetime.now(UTC) - timedelta(minutes=index + 1),
                )
                for index, jwt_id in enumerate(expired_jwt_ids)
            ]
        )
        db.commit()

        first_deleted_count = prune_expired_revoked_jwts(db, batch_size=2)
        db.commit()
        second_deleted_count = prune_expired_revoked_jwts(db, batch_size=2)
        db.commit()

    assert first_deleted_count == 2
    assert second_deleted_count == 1


def test_expired_revoked_jwt_pruning_rejects_oversized_batch_before_query(
    monkeypatch: MonkeyPatch,
) -> None:
    def fail_select(*_: object, **__: object) -> object:
        raise AssertionError("oversized batch should be rejected before query construction")

    monkeypatch.setattr(token_revocation, "select", fail_select)

    with SessionLocal() as db:
        try:
            prune_expired_revoked_jwts(db, batch_size=REVOKED_JWT_PRUNE_BATCH_SIZE + 1)
        except ValueError as exc:
            assert "batch_size" in str(exc)
        else:
            raise AssertionError("oversized batch should be rejected")
