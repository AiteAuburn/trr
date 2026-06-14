import hashlib
from datetime import UTC, datetime

from sqlalchemy import delete, select, update
from sqlalchemy.engine import CursorResult
from sqlalchemy.orm import Session
from typing import cast

from app.models import RevokedJwt

REVOKED_JWT_PRUNE_BATCH_SIZE = 1000
MAX_JWT_ID_LENGTH = 128


def jwt_id_hash(jti: str) -> str:
    normalized_jti = normalize_jwt_id(jti)
    return hashlib.sha256(normalized_jti.encode()).hexdigest()


def normalize_jwt_id(jti: str) -> str:
    normalized_jti = jti.strip()
    if not normalized_jti:
        raise ValueError("jti must not be empty")
    if len(normalized_jti) > MAX_JWT_ID_LENGTH:
        raise ValueError("jti is too long")
    return normalized_jti


def validate_timezone_aware_datetime(value: datetime, *, field_name: str) -> None:
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError(f"{field_name} must include a timezone")


def is_jwt_revoked(jti: str, db: Session) -> bool:
    now = datetime.now(UTC)
    revoked = db.scalar(
        select(RevokedJwt).where(
            RevokedJwt.jti_hash == jwt_id_hash(jti),
            RevokedJwt.expires_at > now,
        )
    )
    return revoked is not None


def revoke_jwt_id(jti: str, expires_at: datetime, db: Session) -> None:
    validate_timezone_aware_datetime(expires_at, field_name="expires_at")
    jti_hash = jwt_id_hash(jti)
    result = cast(
        CursorResult[tuple[object, ...]],
        db.execute(
            update(RevokedJwt)
            .where(RevokedJwt.jti_hash == jti_hash)
            .values(expires_at=expires_at)
        ),
    )
    if result.rowcount == 0:
        db.add(RevokedJwt(jti_hash=jti_hash, expires_at=expires_at))


def prune_expired_revoked_jwts(
    db: Session,
    *,
    batch_size: int = REVOKED_JWT_PRUNE_BATCH_SIZE,
) -> int:
    if batch_size < 1:
        raise ValueError("batch_size must be positive")
    if batch_size > REVOKED_JWT_PRUNE_BATCH_SIZE:
        raise ValueError("batch_size exceeds maximum")

    now = datetime.now(UTC)
    expired_ids = list(
        db.scalars(
            select(RevokedJwt.id)
            .where(RevokedJwt.expires_at <= now)
            .order_by(RevokedJwt.expires_at.asc())
            .limit(batch_size)
        )
    )
    if not expired_ids:
        return 0

    db.execute(delete(RevokedJwt).where(RevokedJwt.id.in_(expired_ids)))
    return len(expired_ids)
