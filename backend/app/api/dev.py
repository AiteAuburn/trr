from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import delete
from sqlalchemy.orm import Session
from typing import Any, cast

from app.core.config import get_settings
from app.db.session import get_db
from app.models import (
    Account,
    AchievementUnlock,
    AuditLog,
    AuthSession,
    CommunityPointLedger,
    CommunityPublicProfile,
    DailyRecord,
    FoodItem,
    FoodShare,
    Plan,
    PlanEntitlement,
    ProfileAccessGrant,
    RateLimitCounter,
    Record,
    RevokedJwt,
    StoreRedemption,
    Subscription,
    UsageCounter,
    UserProfile,
    YearReviewSharePackage,
    YearReviewSnapshot,
)

router = APIRouter(prefix="/dev", tags=["dev"])

RESET_CONFIRM_HEADER = "reset-all-data"
RESETTABLE_MODELS = (
    ProfileAccessGrant,
    AuthSession,
    RevokedJwt,
    RateLimitCounter,
    UsageCounter,
    Subscription,
    PlanEntitlement,
    Plan,
    StoreRedemption,
    CommunityPointLedger,
    CommunityPublicProfile,
    FoodShare,
    FoodItem,
    YearReviewSharePackage,
    YearReviewSnapshot,
    AchievementUnlock,
    AuditLog,
    DailyRecord,
    Record,
    UserProfile,
    Account,
)


@router.post("/reset-data")
def reset_development_data(
    confirm: str | None = Header(default=None, alias="X-Dev-Reset-Confirm"),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    settings = get_settings()
    if settings.app_env not in {"local", "test", "development"} or not settings.dev_auth_enabled:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Development reset is disabled",
        )
    if confirm != RESET_CONFIRM_HEADER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "missing_dev_reset_confirmation",
                "message": "Dev reset requires X-Dev-Reset-Confirm.",
            },
        )

    deleted_counts: dict[str, int] = {}
    for model in RESETTABLE_MODELS:
        result = cast(Any, db.execute(delete(model)))
        deleted_counts[model.__tablename__] = int(result.rowcount or 0)
    db.commit()
    return {"status": "reset", "deleted_counts": deleted_counts}
