import hashlib
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models import RateLimitCounter

RATE_LIMIT_PRUNE_BATCH_SIZE = 1000
MAX_RATE_LIMIT_SCOPE_LENGTH = 80
MAX_RATE_LIMIT_KEY_LENGTH = 1024
MAX_RATE_LIMIT_RETRY_AFTER_SECONDS = 86_400


@dataclass(frozen=True)
class RateLimitDecision:
    allowed: bool
    limit: int
    remaining: int
    retry_after_seconds: int


def rate_limit_key_hash(value: str) -> str:
    normalized_value = normalize_rate_limit_key(value)
    return hashlib.sha256(normalized_value.encode()).hexdigest()


def normalize_rate_limit_key(value: str) -> str:
    normalized_value = value.strip()
    if not normalized_value:
        raise ValueError("rate limit key must not be empty")
    if len(normalized_value) > MAX_RATE_LIMIT_KEY_LENGTH:
        raise ValueError("rate limit key is too long")
    return normalized_value


def normalize_rate_limit_scope(value: str) -> str:
    normalized_value = value.strip()
    if not normalized_value:
        raise ValueError("rate limit scope must not be empty")
    if len(normalized_value) > MAX_RATE_LIMIT_SCOPE_LENGTH:
        raise ValueError("rate limit scope is too long")
    return normalized_value


def normalize_retry_after_seconds(value: int) -> int:
    if value < 1:
        return 1
    if value > MAX_RATE_LIMIT_RETRY_AFTER_SECONDS:
        return MAX_RATE_LIMIT_RETRY_AFTER_SECONDS
    return value


def validate_timezone_aware_datetime(value: datetime, *, field_name: str) -> None:
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError(f"{field_name} must include a timezone")


def consume_fixed_window_rate_limit(
    *,
    scope: str,
    key: str,
    limit: int,
    window_seconds: int,
    db: Session,
) -> RateLimitDecision:
    if limit < 1:
        raise ValueError("rate limit must be positive")
    if window_seconds < 1:
        raise ValueError("rate limit window_seconds must be positive")
    normalized_scope = normalize_rate_limit_scope(scope)
    key_hash = rate_limit_key_hash(key)
    now = datetime.now(UTC)
    window_start = _window_start(now, window_seconds)
    statement = (
        insert(RateLimitCounter)
        .values(
            scope=normalized_scope,
            key_hash=key_hash,
            window_start=window_start,
            window_seconds=window_seconds,
            count=1,
        )
        .on_conflict_do_update(
            constraint="uq_rate_limit_scope_key_window",
            set_={"count": RateLimitCounter.count + 1},
            where=RateLimitCounter.count < limit,
        )
        .returning(RateLimitCounter.count)
    )
    current_count = db.scalar(statement)
    if current_count is None:
        return RateLimitDecision(
            allowed=False,
            limit=limit,
            remaining=0,
            retry_after_seconds=_retry_after_seconds(now, window_start, window_seconds),
        )

    return RateLimitDecision(
        allowed=True,
        limit=limit,
        remaining=max(limit - current_count, 0),
        retry_after_seconds=0,
    )


def prune_rate_limit_counters(
    *,
    older_than: datetime,
    db: Session,
    batch_size: int = RATE_LIMIT_PRUNE_BATCH_SIZE,
) -> int:
    validate_timezone_aware_datetime(older_than, field_name="older_than")
    if batch_size < 1:
        raise ValueError("batch_size must be positive")
    if batch_size > RATE_LIMIT_PRUNE_BATCH_SIZE:
        raise ValueError("batch_size exceeds maximum")

    expired_ids = list(
        db.scalars(
            select(RateLimitCounter.id)
            .where(RateLimitCounter.window_start < older_than)
            .order_by(RateLimitCounter.window_start.asc())
            .limit(batch_size)
        )
    )
    if not expired_ids:
        return 0

    db.execute(delete(RateLimitCounter).where(RateLimitCounter.id.in_(expired_ids)))
    return len(expired_ids)


def _window_start(now: datetime, window_seconds: int) -> datetime:
    epoch_seconds = int(now.timestamp())
    start_epoch = epoch_seconds - (epoch_seconds % window_seconds)
    return datetime.fromtimestamp(start_epoch, tz=UTC)


def _retry_after_seconds(now: datetime, window_start: datetime, window_seconds: int) -> int:
    window_end = window_start + timedelta(seconds=window_seconds)
    remaining_seconds = int((window_end - now).total_seconds())
    return normalize_retry_after_seconds(remaining_seconds)
