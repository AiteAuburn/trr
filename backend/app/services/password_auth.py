import base64
import hashlib
import hmac
from secrets import token_bytes

PASSWORD_SCHEME = "pbkdf2_sha256"
PASSWORD_ITERATIONS = 310_000
PASSWORD_MIN_ITERATIONS = 210_000
PASSWORD_MAX_ITERATIONS = 1_000_000
PASSWORD_SALT_BYTES = 16
PASSWORD_DIGEST_BYTES = 32
PASSWORD_HASH_MAX_LENGTH = 512


def hash_password(password: str) -> str:
    salt = token_bytes(PASSWORD_SALT_BYTES)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS)
    return ":".join((PASSWORD_SCHEME, str(PASSWORD_ITERATIONS), _encode(salt), _encode(digest)))


def verify_password(password: str, encoded_hash: str | None) -> bool:
    if not password or len(password) > 128 or not encoded_hash or len(encoded_hash) > PASSWORD_HASH_MAX_LENGTH:
        return False
    try:
        scheme, raw_iterations, raw_salt, raw_digest = encoded_hash.split(":", maxsplit=3)
        iterations = int(raw_iterations)
        salt = _decode(raw_salt)
        expected = _decode(raw_digest)
    except (ValueError, TypeError):
        return False
    if (
        scheme != PASSWORD_SCHEME
        or not PASSWORD_MIN_ITERATIONS <= iterations <= PASSWORD_MAX_ITERATIONS
        or len(salt) != PASSWORD_SALT_BYTES
        or len(expected) != PASSWORD_DIGEST_BYTES
    ):
        return False
    actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return hmac.compare_digest(actual, expected)


_DUMMY_PASSWORD_HASH = (
    "pbkdf2_sha256:310000:YWFhYWFhYWFhYWFhYWFhYQ:"
    "YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE"
)


def verify_missing_account_password(password: str) -> None:
    """Spend password-hash work for unknown accounts to reduce timing differences."""
    verify_password(password, _DUMMY_PASSWORD_HASH)


def _encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _decode(value: str) -> bytes:
    return base64.b64decode(value + "=" * (-len(value) % 4), altchars=b"-_", validate=True)
