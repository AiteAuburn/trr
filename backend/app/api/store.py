from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_account
from app.db.session import get_db
from app.models import Account
from app.models.community import CommunityPointLedger, StoreRedemption
from app.schemas.store import PointsBalanceRead, StoreRedemptionCreate, StoreRedemptionRead, StoreRewardRead
from app.services.audit import write_audit_event

router = APIRouter(prefix="/store", tags=["store"])

STORE_REWARDS = (
    StoreRewardRead(
        code="coupon_50",
        title="合作通路 50 元優惠券",
        category="coupons",
        points_cost=100,
        status="redeemable",
    ),
    StoreRewardRead(
        code="supplement_discount_10",
        title="保健食品 9 折折扣",
        category="supplement_discounts",
        points_cost=150,
        status="redeemable",
    ),
    StoreRewardRead(
        code="partner_product_trial",
        title="合作商品體驗兌換",
        category="partner_products",
        points_cost=300,
        status="preview",
    ),
    StoreRewardRead(
        code="annual_member_badge",
        title="特殊會員徽章",
        category="special_badges",
        points_cost=80,
        status="redeemable",
    ),
    StoreRewardRead(
        code="member_benefit_pack",
        title="特殊會員福利包",
        category="member_benefits",
        points_cost=500,
        status="preview",
    ),
)

INSTANT_FULFILLMENT_REWARD_CODES = {
    "coupon_50": "coupon",
    "supplement_discount_10": "discount_code",
}


def _points_balance(account_id: UUID, db: Session) -> PointsBalanceRead:
    earned = int(
        db.scalar(
            select(func.coalesce(func.sum(CommunityPointLedger.delta), 0)).where(
                CommunityPointLedger.account_id == account_id,
                CommunityPointLedger.delta > 0,
            )
        )
        or 0
    )
    redeemed = abs(
        int(
            db.scalar(
                select(func.coalesce(func.sum(CommunityPointLedger.delta), 0)).where(
                    CommunityPointLedger.account_id == account_id,
                    CommunityPointLedger.delta < 0,
                )
            )
            or 0
        )
    )
    return PointsBalanceRead(
        balance=max(0, earned - redeemed),
        lifetime_earned=earned,
        lifetime_redeemed=redeemed,
    )


def _fulfillment_code(redemption_id: UUID, reward_code: str) -> str:
    return f"TL-{reward_code.upper().replace('_', '-')}-{str(redemption_id).split('-')[0].upper()}"


@router.get("/rewards", response_model=list[StoreRewardRead])
def list_store_rewards(account: Account = Depends(get_current_account)) -> list[StoreRewardRead]:
    _ = account
    return list(STORE_REWARDS)


@router.get("/points", response_model=PointsBalanceRead)
def get_points_balance(
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> PointsBalanceRead:
    return _points_balance(account.id, db)


@router.get("/redemptions", response_model=list[StoreRedemptionRead])
def list_store_redemptions(
    limit: int = Query(default=20, ge=1, le=100),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> list[StoreRedemption]:
    return list(
        db.scalars(
            select(StoreRedemption)
            .where(StoreRedemption.account_id == account.id)
            .order_by(StoreRedemption.created_at.desc(), StoreRedemption.id.desc())
            .limit(limit)
        )
    )


@router.post("/redemptions", response_model=StoreRedemptionRead, status_code=201)
def create_store_redemption(
    payload: StoreRedemptionCreate,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> StoreRedemption:
    reward = next((item for item in STORE_REWARDS if item.code == payload.reward_code), None)
    if reward is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "reward_not_found",
                "message": "Store reward not found.",
                "reward_code": payload.reward_code,
            },
        )
    if reward.status != "redeemable":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "reward_not_redeemable",
                "message": "This reward is reserved for a future fulfillment integration.",
            },
        )
    balance = _points_balance(account.id, db)
    if balance.balance < reward.points_cost:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "insufficient_points",
                "message": "Not enough points to redeem this reward.",
                "required_points": reward.points_cost,
                "available_points": balance.balance,
            },
        )
    redemption = StoreRedemption(
        account_id=account.id,
        reward_code=reward.code,
        points_cost=reward.points_cost,
        status="reserved",
    )
    db.add(redemption)
    db.flush()
    fulfillment_type = INSTANT_FULFILLMENT_REWARD_CODES.get(reward.code)
    if fulfillment_type is not None:
        redemption.status = "issued"
        redemption.fulfillment_type = fulfillment_type
        redemption.fulfillment_code = _fulfillment_code(redemption.id, reward.code)
        redemption.fulfilled_at = datetime.now(UTC)
    db.add(
        CommunityPointLedger(
            account_id=account.id,
            delta=-reward.points_cost,
            reason="store_redemption",
            source_type="store_redemption",
            source_id=redemption.id,
        )
    )
    write_audit_event(
        db,
        actor_account_id=account.id,
        profile_id=None,
        action="store.redemption.created",
        resource_type="store_redemption",
        resource_id=redemption.id,
        metadata_json={
            "reward_code": reward.code,
            "points_cost": reward.points_cost,
            "status": redemption.status,
            "fulfillment_type": redemption.fulfillment_type,
        },
    )
    db.commit()
    db.refresh(redemption)
    return redemption


@router.post("/redemptions/{redemption_id}/use", response_model=StoreRedemptionRead)
def use_store_redemption(
    redemption_id: UUID,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> StoreRedemption:
    redemption = db.scalar(
        select(StoreRedemption).where(
            StoreRedemption.id == redemption_id,
            StoreRedemption.account_id == account.id,
        )
    )
    if redemption is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "redemption_not_found",
                "message": "Store redemption not found.",
                "redemption_id": str(redemption_id),
            },
        )
    if (
        redemption.status != "issued"
        or redemption.fulfillment_type not in {"coupon", "discount_code"}
        or not redemption.fulfillment_code
        or redemption.used_at is not None
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "redemption_not_usable",
                "message": "This redemption is not an unused issued coupon or discount code.",
            },
        )
    redemption.status = "used"
    redemption.used_at = datetime.now(UTC)
    write_audit_event(
        db,
        actor_account_id=account.id,
        profile_id=None,
        action="store.redemption.used",
        resource_type="store_redemption",
        resource_id=redemption.id,
        metadata_json={
            "reward_code": redemption.reward_code,
            "fulfillment_type": redemption.fulfillment_type,
        },
    )
    db.commit()
    db.refresh(redemption)
    return redemption
