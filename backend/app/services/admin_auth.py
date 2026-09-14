import base64
import hashlib
import hmac
from datetime import UTC, datetime, timedelta
from secrets import token_bytes

import jwt
from jwt.exceptions import PyJWTError


ADMIN_PASSWORD_SCHEME = "pbkdf2_sha256"
ADMIN_PASSWORD_ITERATIONS = 310_000
ADMIN_PASSWORD_MIN_ITERATIONS = 210_000
ADMIN_PASSWORD_MAX_ITERATIONS = 1_000_000
ADMIN_PASSWORD_SALT_BYTES = 16
ADMIN_PASSWORD_DIGEST_BYTES = 32
ADMIN_SESSION_AUDIENCE = "bloodsugar-admin"
ADMIN_SESSION_ISSUER = "bloodsugar-admin"


class AdminAuthError(ValueError):
    pass


def hash_admin_password(password: str, *, salt: bytes | None = None) -> str:
    if not password or len(password) > 256:
        raise AdminAuthError("invalid admin password length")
    effective_salt = salt or token_bytes(ADMIN_PASSWORD_SALT_BYTES)
    if len(effective_salt) != ADMIN_PASSWORD_SALT_BYTES:
        raise AdminAuthError("invalid admin password salt")
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode(),
        effective_salt,
        ADMIN_PASSWORD_ITERATIONS,
        dklen=ADMIN_PASSWORD_DIGEST_BYTES,
    )
    return ":".join(
        (
            ADMIN_PASSWORD_SCHEME,
            str(ADMIN_PASSWORD_ITERATIONS),
            _base64url(effective_salt),
            _base64url(digest),
        )
    )


def verify_admin_password(password: str, encoded_hash: str) -> bool:
    if not password or len(password) > 256 or len(encoded_hash) > 512:
        return False
    try:
        scheme, raw_iterations, raw_salt, raw_digest = encoded_hash.split(":", maxsplit=3)
        iterations = int(raw_iterations)
        salt = _decode_base64url(raw_salt)
        expected_digest = _decode_base64url(raw_digest)
    except (ValueError, TypeError):
        return False
    if (
        scheme != ADMIN_PASSWORD_SCHEME
        or not ADMIN_PASSWORD_MIN_ITERATIONS <= iterations <= ADMIN_PASSWORD_MAX_ITERATIONS
        or len(salt) != ADMIN_PASSWORD_SALT_BYTES
        or len(expected_digest) != ADMIN_PASSWORD_DIGEST_BYTES
    ):
        return False
    actual_digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode(),
        salt,
        iterations,
        dklen=ADMIN_PASSWORD_DIGEST_BYTES,
    )
    return hmac.compare_digest(actual_digest, expected_digest)


def issue_admin_session(*, username: str, secret: str, expires_in_seconds: int) -> str:
    now = datetime.now(UTC)
    return jwt.encode(
        {
            "sub": username,
            "iat": now,
            "exp": now + timedelta(seconds=expires_in_seconds),
            "iss": ADMIN_SESSION_ISSUER,
            "aud": ADMIN_SESSION_AUDIENCE,
        },
        secret,
        algorithm="HS256",
    )


def admin_username_from_session(token: str | None, *, secret: str, username: str) -> str:
    if not token or len(token) > 4096 or not secret or not username:
        raise AdminAuthError("invalid admin session")
    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience=ADMIN_SESSION_AUDIENCE,
            issuer=ADMIN_SESSION_ISSUER,
            options={"require": ["sub", "iat", "exp", "iss", "aud"]},
        )
    except PyJWTError as exc:
        raise AdminAuthError("invalid admin session") from exc
    if payload.get("sub") != username:
        raise AdminAuthError("invalid admin session")
    return username


def _base64url(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode().rstrip("=")


def _decode_base64url(value: str) -> bytes:
    return base64.b64decode(value + "=" * (-len(value) % 4), altchars=b"-_", validate=True)
