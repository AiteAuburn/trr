from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_account
from app.db.session import get_db
from app.models import Account
from app.schemas.subscription import VoiceQuotaRead
from app.services.entitlements import (
    current_voice_usage_seconds,
    ensure_trial_subscription,
    public_plan_code,
    voice_quota_limit_seconds,
)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("/voice-quota", response_model=VoiceQuotaRead)
def get_voice_quota(
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> VoiceQuotaRead:
    subscription = ensure_trial_subscription(account, db)
    limit_seconds = voice_quota_limit_seconds(subscription, db)
    used_seconds = current_voice_usage_seconds(account.id, db)
    db.commit()
    return VoiceQuotaRead(
        plan_code=public_plan_code(subscription),
        status=subscription.status,
        trial_started_at=subscription.trial_started_at,
        trial_ends_at=subscription.trial_ends_at,
        referral_code=subscription.referral_code,
        preserves_intro_price=subscription.preserves_intro_price,
        daily_limit_seconds=limit_seconds,
        used_seconds_today=used_seconds,
        remaining_seconds_today=max(0, limit_seconds - used_seconds),
    )
