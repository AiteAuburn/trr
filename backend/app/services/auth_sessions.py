import hashlib
import hmac
from datetime import UTC, datetime
from typing import cast
from uuid import UUID

from sqlalchemy import delete, select, update
from sqlalchemy.engine import CursorResult
from sqlalchemy.orm import Session

from app.models import AuthSession

AUTH_SESSION_PRUNE_BATCH_SIZE = 1000
MAX_AUTH_TOKEN_HASH_INPUT_LENGTH = 512
MAX_DEVICE_FINGERPRINT_LENGTH = 256


def token_hash(token: str) -> str:
    normalized_token = normalize_token_hash_input(token)
    return hashlib.sha256(normalized_token.encode()).hexdigest()


def normalize_token_hash_input(token: str) -> str:
    normalized_token = token.strip()
    if not normalized_token:
        raise ValueError("token must not be empty")
    if len(normalized_token) > MAX_AUTH_TOKEN_HASH_INPUT_LENGTH:
        raise ValueError("token is too long")
    return normalized_token


def validate_timezone_aware_datetime(value: datetime, *, field_name: str) -> None:
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError(f"{field_name} must include a timezone")


def optional_fingerprint_hash(device_fingerprint: str | None) -> str | None:
    if device_fingerprint is None:
        return None
    normalized_fingerprint = device_fingerprint.strip()
    if not normalized_fingerprint:
        return None
    if len(normalized_fingerprint) > MAX_DEVICE_FINGERPRINT_LENGTH:
        raise ValueError("device_fingerprint is too long")
    return token_hash(normalized_fingerprint)


def create_auth_session(
    *,
    account_id: UUID,
    refresh_token: str,
    expires_at: datetime,
    db: Session,
    device_fingerprint: str | None = None,
) -> AuthSession:
    validate_timezone_aware_datetime(expires_at, field_name="expires_at")
    session = AuthSession(
        account_id=account_id,
        refresh_token_hash=token_hash(refresh_token),
        device_fingerprint_hash=optional_fingerprint_hash(device_fingerprint),
        expires_at=expires_at,
    )
    db.add(session)
    return session


def find_active_session_by_refresh_token(refresh_token: str, db: Session) -> AuthSession | None:
    now = datetime.now(UTC)
    return db.scalar(
        select(AuthSession).where(
            AuthSession.refresh_token_hash == token_hash(refresh_token),
            AuthSession.revoked_at.is_(None),
            AuthSession.expires_at > now,
        )
    )


def list_active_account_sessions(
    account_id: UUID,
    db: Session,
    *,
    limit: int,
) -> list[AuthSession]:
    now = datetime.now(UTC)
    return list(
        db.scalars(
            select(AuthSession)
            .where(
                AuthSession.account_id == account_id,
                AuthSession.revoked_at.is_(None),
                AuthSession.expires_at > now,
            )
            .order_by(AuthSession.last_used_at.desc().nullslast(), AuthSession.created_at.desc())
            .limit(limit)
        )
    )


def rotate_auth_session(
    *,
    session: AuthSession,
    current_refresh_token: str,
    next_refresh_token: str,
    next_expires_at: datetime,
) -> bool:
    validate_timezone_aware_datetime(session.expires_at, field_name="session.expires_at")
    validate_timezone_aware_datetime(next_expires_at, field_name="next_expires_at")
    if session.revoked_at is not None or session.expires_at <= datetime.now(UTC):
        return False
    if not hmac.compare_digest(session.refresh_token_hash, token_hash(current_refresh_token)):
        return False

    now = datetime.now(UTC)
    session.refresh_token_hash = token_hash(next_refresh_token)
    session.expires_at = next_expires_at
    session.last_used_at = now
    session.rotated_at = now
    return True


def revoke_auth_session(session: AuthSession) -> None:
    session.revoked_at = datetime.now(UTC)


def revoke_account_session_by_id(account_id: UUID, session_id: UUID, db: Session) -> bool:
    now = datetime.now(UTC)
    result = cast(
        CursorResult[tuple[object, ...]],
        db.execute(
            update(AuthSession)
            .where(
                AuthSession.id == session_id,
                AuthSession.account_id == account_id,
                AuthSession.revoked_at.is_(None),
                AuthSession.expires_at > now,
            )
            .values(revoked_at=now)
        ),
    )
    return result.rowcount > 0


def revoke_all_account_sessions(account_id: UUID, db: Session) -> int:
    now = datetime.now(UTC)
    result = cast(
        CursorResult[tuple[object, ...]],
        db.execute(
            update(AuthSession)
            .where(
                AuthSession.account_id == account_id,
                AuthSession.revoked_at.is_(None),
                AuthSession.expires_at > now,
            )
            .values(revoked_at=now)
        ),
    )
    return result.rowcount


def prune_expired_auth_sessions(
    db: Session,
    *,
    batch_size: int = AUTH_SESSION_PRUNE_BATCH_SIZE,
) -> int:
    if batch_size < 1:
        raise ValueError("batch_size must be positive")
    if batch_size > AUTH_SESSION_PRUNE_BATCH_SIZE:
        raise ValueError("batch_size exceeds maximum")

    now = datetime.now(UTC)
    expired_ids = list(
        db.scalars(
            select(AuthSession.id)
            .where(AuthSession.expires_at <= now)
            .order_by(AuthSession.expires_at.asc())
            .limit(batch_size)
        )
    )
    if not expired_ids:
        return 0

    db.execute(delete(AuthSession).where(AuthSession.id.in_(expired_ids)))
    return len(expired_ids)
