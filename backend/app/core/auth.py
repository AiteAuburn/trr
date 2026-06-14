import base64
import binascii
import hashlib
import hmac
import json
import re
from time import time
from typing import Any, Callable
from uuid import UUID, uuid4

import jwt
from jwt import PyJWKClient
from jwt.exceptions import PyJWTError


TOKEN_CLOCK_SKEW_SECONDS = 60
AUTHORIZATION_HEADER_MAX_LENGTH = 4096
JWT_JSON_PART_MAX_LENGTH = 2048
JWT_SIGNATURE_PART_MAX_LENGTH = 512
JWT_DECODED_JSON_MAX_BYTES = 2048
JWT_JSON_MAX_KEYS = 32
JWT_CLAIM_STRING_MAX_LENGTH = 256
ISSUED_JWT_ID_MAX_LENGTH = 128
JWT_AUDIENCE_LIST_MAX_ITEMS = 8
JWT_ALLOWED_JWKS_ALGORITHMS = ("RS256",)
BASE64URL_PATTERN = re.compile(r"^[A-Za-z0-9_-]+$")
SigningKeyResolver = Callable[[str], Any]


class AuthTokenError(ValueError):
    pass


def issue_hs256_access_token(
    *,
    account_id: UUID,
    secret: str,
    expires_in_seconds: int,
    issuer: str = "",
    audience: str = "",
    jwt_id: str | None = None,
) -> str:
    issued_at = int(time())
    payload: dict[str, Any] = {
        "sub": str(account_id),
        "iat": issued_at,
        "exp": issued_at + expires_in_seconds,
        "jti": str(uuid4()) if jwt_id is None else _normalize_issued_jwt_id(jwt_id),
    }
    if issuer:
        payload["iss"] = issuer
    if audience:
        payload["aud"] = audience
    encoded_header = _base64url_json({"alg": "HS256", "typ": "JWT"})
    encoded_payload = _base64url_json(payload)
    signing_input = f"{encoded_header}.{encoded_payload}".encode()
    signature = hmac.new(secret.encode(), signing_input, hashlib.sha256).digest()
    return f"{encoded_header}.{encoded_payload}.{_base64url(signature)}"


def _normalize_issued_jwt_id(jwt_id: str) -> str:
    normalized = jwt_id.strip()
    if not normalized:
        raise AuthTokenError("jwt id must not be empty")
    if len(normalized) > ISSUED_JWT_ID_MAX_LENGTH:
        raise AuthTokenError("jwt id is too long")
    return normalized


def claims_from_bearer_token(
    authorization: str | None,
    *,
    secret: str,
    issuer: str = "",
    audience: str = "",
    max_age_seconds: int = 900,
) -> dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise AuthTokenError("missing bearer token")
    if len(authorization) > AUTHORIZATION_HEADER_MAX_LENGTH:
        raise AuthTokenError("authorization header too long")
    token = authorization.removeprefix("Bearer ").strip()
    parts = token.split(".")
    if len(parts) != 3:
        raise AuthTokenError("invalid token shape")
    _validate_jwt_part_lengths(parts)

    header = _decode_json_part(parts[0])
    payload = _decode_json_part(parts[1])
    if header.get("alg") != "HS256":
        raise AuthTokenError("unsupported token algorithm")
    signing_input = f"{parts[0]}.{parts[1]}".encode()
    expected_signature = hmac.new(secret.encode(), signing_input, hashlib.sha256).digest()
    actual_signature = _decode_base64url(parts[2])
    if not hmac.compare_digest(expected_signature, actual_signature):
        raise AuthTokenError("invalid token signature")

    _validate_claims(
        payload,
        issuer=issuer,
        audience=audience,
        max_age_seconds=max_age_seconds,
    )
    return payload


def claims_from_jwks_bearer_token(
    authorization: str | None,
    *,
    jwks_url: str,
    issuer: str,
    audience: str,
    max_age_seconds: int = 900,
    timeout_seconds: int = 5,
    signing_key_resolver: SigningKeyResolver | None = None,
) -> dict[str, Any]:
    token = _token_from_authorization_header(authorization)
    parts = token.split(".")
    if len(parts) != 3:
        raise AuthTokenError("invalid token shape")
    _validate_jwt_part_lengths(parts)

    header = _decode_json_part(parts[0])
    payload = _decode_json_part(parts[1])
    if header.get("alg") not in JWT_ALLOWED_JWKS_ALGORITHMS:
        raise AuthTokenError("unsupported token algorithm")
    kid = header.get("kid")
    if not isinstance(kid, str) or not kid.strip():
        raise AuthTokenError("missing key id")
    _validate_claims(
        payload,
        issuer=issuer,
        audience=audience,
        max_age_seconds=max_age_seconds,
    )

    try:
        if signing_key_resolver is None:
            jwks_client = PyJWKClient(
                jwks_url,
                cache_keys=True,
                max_cached_keys=16,
                cache_jwk_set=True,
                lifespan=300,
                timeout=timeout_seconds,
            )
            signing_key = jwks_client.get_signing_key_from_jwt(token).key
        else:
            signing_key = signing_key_resolver(token)
        decoded = jwt.decode(
            token,
            signing_key,
            algorithms=list(JWT_ALLOWED_JWKS_ALGORITHMS),
            audience=audience,
            issuer=issuer,
            leeway=TOKEN_CLOCK_SKEW_SECONDS,
            options={"require": ["exp", "sub"]},
        )
    except PyJWTError as exc:
        raise AuthTokenError("invalid token signature") from exc
    if not isinstance(decoded, dict):
        raise AuthTokenError("invalid token claims")
    _validate_json_part_shape(decoded)
    _validate_claims(
        decoded,
        issuer=issuer,
        audience=audience,
        max_age_seconds=max_age_seconds,
    )
    return decoded


def account_id_from_bearer_token(
    authorization: str | None,
    *,
    secret: str,
    issuer: str = "",
    audience: str = "",
    max_age_seconds: int = 900,
) -> UUID:
    payload = claims_from_bearer_token(
        authorization,
        secret=secret,
        issuer=issuer,
        audience=audience,
        max_age_seconds=max_age_seconds,
    )
    subject = payload.get("sub")
    if not isinstance(subject, str):
        raise AuthTokenError("missing token subject")
    try:
        return UUID(subject)
    except ValueError as exc:
        raise AuthTokenError("invalid token subject") from exc


def _validate_claims(
    payload: dict[str, Any],
    *,
    issuer: str,
    audience: str,
    max_age_seconds: int,
) -> None:
    now = time()
    expires_at = payload.get("exp")
    if not isinstance(expires_at, int | float) or expires_at <= now:
        raise AuthTokenError("token expired")
    issued_at = payload.get("iat")
    if isinstance(issued_at, int | float) and issued_at > now + TOKEN_CLOCK_SKEW_SECONDS:
        raise AuthTokenError("token issued in the future")
    if isinstance(issued_at, int | float) and expires_at - issued_at > max_age_seconds:
        raise AuthTokenError("token lifetime too long")
    not_before = payload.get("nbf")
    if isinstance(not_before, int | float) and not_before > now + TOKEN_CLOCK_SKEW_SECONDS:
        raise AuthTokenError("token not yet valid")
    if issuer and payload.get("iss") != issuer:
        raise AuthTokenError("invalid token issuer")
    if audience:
        token_audience = payload.get("aud")
        if isinstance(token_audience, str):
            valid_audience = token_audience == audience
        elif isinstance(token_audience, list):
            valid_audience = audience in token_audience
        else:
            valid_audience = False
        if not valid_audience:
            raise AuthTokenError("invalid token audience")


def _decode_json_part(value: str) -> dict[str, Any]:
    decoded = _decode_base64url(value)
    if len(decoded) > JWT_DECODED_JSON_MAX_BYTES:
        raise AuthTokenError("token json too large")
    try:
        parsed = json.loads(decoded)
    except json.JSONDecodeError as exc:
        raise AuthTokenError("invalid token json") from exc
    if not isinstance(parsed, dict):
        raise AuthTokenError("invalid token json")
    _validate_json_part_shape(parsed)
    return parsed


def _token_from_authorization_header(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise AuthTokenError("missing bearer token")
    if len(authorization) > AUTHORIZATION_HEADER_MAX_LENGTH:
        raise AuthTokenError("authorization header too long")
    return authorization.removeprefix("Bearer ").strip()


def _decode_base64url(value: str) -> bytes:
    if not value or BASE64URL_PATTERN.fullmatch(value) is None:
        raise AuthTokenError("invalid token encoding")
    try:
        return base64.b64decode(value + "=" * (-len(value) % 4), altchars=b"-_", validate=True)
    except (binascii.Error, ValueError) as exc:
        raise AuthTokenError("invalid token encoding") from exc


def _validate_jwt_part_lengths(parts: list[str]) -> None:
    header, payload, signature = parts
    if len(header) > JWT_JSON_PART_MAX_LENGTH:
        raise AuthTokenError("token header too large")
    if len(payload) > JWT_JSON_PART_MAX_LENGTH:
        raise AuthTokenError("token payload too large")
    if len(signature) > JWT_SIGNATURE_PART_MAX_LENGTH:
        raise AuthTokenError("token signature too large")


def _validate_json_part_shape(value: dict[str, Any]) -> None:
    if len(value) > JWT_JSON_MAX_KEYS:
        raise AuthTokenError("token json too wide")
    for key, item in value.items():
        if not isinstance(key, str) or not key or len(key) > JWT_CLAIM_STRING_MAX_LENGTH:
            raise AuthTokenError("invalid token claim")
        if isinstance(item, str):
            if len(item) > JWT_CLAIM_STRING_MAX_LENGTH:
                raise AuthTokenError("token claim too large")
            continue
        if isinstance(item, list):
            if len(item) > JWT_AUDIENCE_LIST_MAX_ITEMS:
                raise AuthTokenError("token claim list too large")
            if any(
                not isinstance(list_item, str) or len(list_item) > JWT_CLAIM_STRING_MAX_LENGTH
                for list_item in item
            ):
                raise AuthTokenError("invalid token claim list")
            continue
        if isinstance(item, dict):
            raise AuthTokenError("token claim too complex")


def _base64url_json(value: dict[str, Any]) -> str:
    return _base64url(json.dumps(value, separators=(",", ":")).encode())


def _base64url(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode().rstrip("=")
