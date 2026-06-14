from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models import Account, Plan, PlanEntitlement, Subscription, UsageCounter

VOICE_DAILY_SECONDS_KEY = "voice.daily_seconds"
VOICE_SECONDS_COUNTER = "voice.seconds"
MAX_REQUESTED_VOICE_SECONDS = 3600
MAX_DAILY_VOICE_LIMIT_SECONDS = 3600
MAX_STORED_VOICE_USAGE_SECONDS = MAX_DAILY_VOICE_LIMIT_SECONDS
MAX_PUBLIC_PLAN_CODE_LENGTH = 80
TRIAL_PLAN_CODE = "trial"
PAID_ANNUAL_PLAN_CODE = "annual"
UNKNOWN_PLAN_CODE = "unknown"


@dataclass(frozen=True)
class VoiceQuotaDecision:
    allowed: bool
    limit_seconds: int
    used_seconds: int
    requested_seconds: int
    remaining_seconds: int
    plan_code: str


def ensure_default_plans(db: Session) -> None:
    plans = {
        TRIAL_PLAN_CODE: ("7 天免費試用", "trial", 0, 300),
        PAID_ANNUAL_PLAN_CODE: ("年費方案", "year", 149000, 600),
    }
    for code, (display_name, billing_interval, price_cents, voice_seconds) in plans.items():
        plan = db.scalar(select(Plan).where(Plan.code == code))
        if plan is None:
            plan = Plan(
                code=code,
                display_name=display_name,
                billing_interval=billing_interval,
                price_cents=price_cents,
                currency="TWD",
                is_active=True,
            )
            db.add(plan)
            db.flush()
        entitlement = db.scalar(
            select(PlanEntitlement).where(
                PlanEntitlement.plan_id == plan.id,
                PlanEntitlement.entitlement_key == VOICE_DAILY_SECONDS_KEY,
            )
        )
        if entitlement is None:
            db.add(
                PlanEntitlement(
                    plan_id=plan.id,
                    entitlement_key=VOICE_DAILY_SECONDS_KEY,
                    value_json={"seconds": voice_seconds},
                )
            )


def ensure_trial_subscription_for_account_id(account_id: UUID, db: Session) -> Subscription:
    ensure_default_plans(db)
    subscription = db.scalar(
        select(Subscription)
        .join(Plan, Subscription.plan_id == Plan.id)
        .where(
            Subscription.account_id == account_id,
            Subscription.status.in_(["trialing", "active"]),
        )
        .order_by(Subscription.created_at.desc())
        .limit(1)
    )
    if subscription is not None:
        return subscription

    trial_plan = db.scalar(select(Plan).where(Plan.code == TRIAL_PLAN_CODE))
    if trial_plan is None:
        raise RuntimeError("Default trial plan was not created")
    now = datetime.now(UTC)
    subscription = Subscription(
        account_id=account_id,
        plan_id=trial_plan.id,
        status="trialing",
        trial_started_at=now,
        trial_ends_at=now + timedelta(days=7),
        current_period_started_at=now,
        current_period_ends_at=now + timedelta(days=7),
        referral_code=None,
        preserves_intro_price=False,
    )
    db.add(subscription)
    db.flush()
    return subscription


def ensure_trial_subscription(account: Account, db: Session) -> Subscription:
    return ensure_trial_subscription_for_account_id(account.id, db)


def voice_quota_limit_seconds(subscription: Subscription, db: Session) -> int:
    entitlement = db.scalar(
        select(PlanEntitlement).where(
            PlanEntitlement.plan_id == subscription.plan_id,
            PlanEntitlement.entitlement_key == VOICE_DAILY_SECONDS_KEY,
        )
    )
    if entitlement is None:
        return 0
    seconds = entitlement.value_json.get("seconds")
    return normalize_voice_limit_seconds(seconds)


def normalize_voice_limit_seconds(value: object) -> int:
    if not isinstance(value, int):
        return 0
    if value < 0:
        return 0
    if value > MAX_DAILY_VOICE_LIMIT_SECONDS:
        return 0
    return value


def today_counter_window(now: datetime | None = None) -> tuple[date, date]:
    current = now or datetime.now(UTC)
    validate_timezone_aware_datetime(current, field_name="now")
    start = current.date()
    return start, start + timedelta(days=1)


def get_or_create_usage_counter(account_id: UUID, db: Session) -> UsageCounter:
    period_start, period_end = today_counter_window()
    counter = get_usage_counter(account_id, db)
    if counter is None:
        counter = UsageCounter(
            account_id=account_id,
            counter_key=VOICE_SECONDS_COUNTER,
            period_start=period_start,
            period_end=period_end,
            used_units=0,
        )
        db.add(counter)
        db.flush()
    return counter


def get_usage_counter(account_id: UUID, db: Session) -> UsageCounter | None:
    period_start, _ = today_counter_window()
    return db.scalar(
        select(UsageCounter).where(
            UsageCounter.account_id == account_id,
            UsageCounter.counter_key == VOICE_SECONDS_COUNTER,
            UsageCounter.period_start == period_start,
        )
    )


def current_voice_usage_seconds(account_id: UUID, db: Session) -> int:
    counter = get_usage_counter(account_id, db)
    return normalize_stored_voice_usage_seconds(counter.used_units) if counter is not None else 0


def normalize_stored_voice_usage_seconds(value: int) -> int:
    if value < 0:
        return 0
    if value > MAX_STORED_VOICE_USAGE_SECONDS:
        return MAX_STORED_VOICE_USAGE_SECONDS
    return value


def normalize_public_plan_code(value: object) -> str:
    if not isinstance(value, str):
        return UNKNOWN_PLAN_CODE
    normalized = value.strip()
    if not normalized or len(normalized) > MAX_PUBLIC_PLAN_CODE_LENGTH:
        return UNKNOWN_PLAN_CODE
    return normalized


def public_plan_code(subscription: Subscription) -> str:
    return normalize_public_plan_code(subscription.plan.code if subscription.plan is not None else None)


def current_voice_quota_decision(
    *,
    account: Account,
    requested_seconds: int,
    subscription: Subscription,
    limit_seconds: int,
    db: Session,
) -> VoiceQuotaDecision:
    validate_requested_voice_seconds(requested_seconds)
    used_units = current_voice_usage_seconds(account.id, db)
    plan_code = public_plan_code(subscription)
    remaining = max(0, limit_seconds - used_units)
    return VoiceQuotaDecision(
        allowed=requested_seconds <= remaining,
        limit_seconds=limit_seconds,
        used_seconds=used_units,
        requested_seconds=requested_seconds,
        remaining_seconds=remaining,
        plan_code=plan_code,
    )


def evaluate_voice_quota(account: Account, requested_seconds: int, db: Session) -> VoiceQuotaDecision:
    validate_requested_voice_seconds(requested_seconds)
    subscription = ensure_trial_subscription(account, db)
    limit_seconds = voice_quota_limit_seconds(subscription, db)
    return current_voice_quota_decision(
        account=account,
        requested_seconds=requested_seconds,
        subscription=subscription,
        limit_seconds=limit_seconds,
        db=db,
    )


def require_voice_quota_for_account_id(
    account_id: UUID,
    requested_seconds: int,
    db: Session,
) -> VoiceQuotaDecision:
    validate_requested_voice_seconds(requested_seconds)
    if requested_seconds <= 0:
        subscription = ensure_trial_subscription_for_account_id(account_id, db)
        limit_seconds = voice_quota_limit_seconds(subscription, db)
        plan_code = public_plan_code(subscription)
        used_units = current_voice_usage_seconds(account_id, db)
        remaining = max(0, limit_seconds - used_units)
        return VoiceQuotaDecision(
            allowed=True,
            limit_seconds=limit_seconds,
            used_seconds=used_units,
            requested_seconds=0,
            remaining_seconds=remaining,
            plan_code=plan_code,
        )

    subscription = ensure_trial_subscription_for_account_id(account_id, db)
    limit_seconds = voice_quota_limit_seconds(subscription, db)
    plan_code = public_plan_code(subscription)
    if requested_seconds > limit_seconds:
        used_seconds = current_voice_usage_seconds(account_id, db)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "voice_quota_exceeded",
                "limit_seconds": limit_seconds,
                "used_seconds": used_seconds,
                "requested_seconds": requested_seconds,
                "remaining_seconds": max(0, limit_seconds - used_seconds),
                "plan_code": plan_code,
            },
        )

    period_start, period_end = today_counter_window()
    bounded_existing_used_units = func.least(
        func.greatest(UsageCounter.used_units, 0),
        MAX_STORED_VOICE_USAGE_SECONDS,
    )
    updated_used_units = bounded_existing_used_units + requested_seconds
    statement = (
        insert(UsageCounter)
        .values(
            account_id=account_id,
            counter_key=VOICE_SECONDS_COUNTER,
            period_start=period_start,
            period_end=period_end,
            used_units=requested_seconds,
        )
        .on_conflict_do_update(
            constraint="uq_usage_counter_account_key_period",
            set_={
                "used_units": updated_used_units,
                "period_end": period_end,
                "updated_at": func.now(),
            },
            where=updated_used_units <= limit_seconds,
        )
        .returning(UsageCounter.used_units)
    )
    used_units_result = db.scalar(statement)
    if used_units_result is None:
        used_seconds = current_voice_usage_seconds(account_id, db)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "voice_quota_exceeded",
                "limit_seconds": limit_seconds,
                "used_seconds": used_seconds,
                "requested_seconds": requested_seconds,
                "remaining_seconds": max(0, limit_seconds - used_seconds),
                "plan_code": plan_code,
            },
        )

    return VoiceQuotaDecision(
        allowed=True,
        limit_seconds=limit_seconds,
        used_seconds=used_units_result,
        requested_seconds=requested_seconds,
        remaining_seconds=max(0, limit_seconds - used_units_result),
        plan_code=plan_code,
    )


def require_voice_quota(account: Account, requested_seconds: int, db: Session) -> VoiceQuotaDecision:
    validate_requested_voice_seconds(requested_seconds)
    if requested_seconds <= 0:
        subscription = ensure_trial_subscription(account, db)
        limit_seconds = voice_quota_limit_seconds(subscription, db)
        return current_voice_quota_decision(
            account=account,
            requested_seconds=0,
            subscription=subscription,
            limit_seconds=limit_seconds,
            db=db,
        )
    return require_voice_quota_for_account_id(account.id, requested_seconds, db)


def validate_requested_voice_seconds(requested_seconds: int) -> None:
    if requested_seconds < 0:
        raise ValueError("requested_seconds must be non-negative")
    if requested_seconds > MAX_REQUESTED_VOICE_SECONDS:
        raise ValueError("requested_seconds exceeds maximum")


def validate_timezone_aware_datetime(value: datetime, *, field_name: str) -> None:
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError(f"{field_name} must include a timezone")
