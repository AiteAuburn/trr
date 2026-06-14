from uuid import UUID
from typing import cast

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_account
from app.db.session import get_db
from app.models import Account
from app.models.community import CommunityPointLedger, CommunityPublicProfile, FoodItem, FoodShare
from app.schemas.community import (
    FOOD_CATEGORY_LABELS,
    CommunityLeaderboardEntry,
    CommunityLeaderboardRead,
    CommunityPublicSettingsRead,
    CommunityPublicSettingsUpdate,
    FoodCategory,
    FoodCategoryRead,
    FoodItemDetailRead,
    FoodItemRead,
    FoodShareCreate,
    FoodShareCreateResponse,
    FoodShareRead,
    FoodStatsRead,
    LeaderboardType,
)
from app.services.audit import write_audit_event
from app.services.record_time_validation import validate_record_occurred_at

router = APIRouter(prefix="/community", tags=["community"])

FOOD_SHARE_POINTS = 10


async def reject_client_supplied_glucose_delta(request: Request) -> None:
    try:
        body = await request.json()
    except Exception:
        return
    if isinstance(body, dict) and "glucose_delta" in body:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "code": "food_glucose_delta_client_supplied",
                "message": "glucose_delta is calculated by the server and must not be supplied.",
            },
        )


def _normalize_food_name(value: str) -> str:
    return " ".join(value.strip().lower().split())


def _public_profile_for_account(account: Account, db: Session) -> CommunityPublicProfile:
    profile = db.scalar(
        select(CommunityPublicProfile).where(CommunityPublicProfile.account_id == account.id)
    )
    if profile is not None:
        return profile
    profile = CommunityPublicProfile(
        account_id=account.id,
        display_name=account.display_name.strip() or "糖友",
        leaderboard_opt_in=False,
    )
    db.add(profile)
    db.flush()
    return profile


def _food_stats(db: Session, food_item_id: UUID) -> FoodStatsRead:
    share_count, average_delta, max_delta, min_delta = db.execute(
        select(
            func.count(FoodShare.id),
            func.avg(FoodShare.glucose_delta),
            func.max(FoodShare.glucose_delta),
            func.min(FoodShare.glucose_delta),
        ).where(FoodShare.food_item_id == food_item_id)
    ).one()
    return FoodStatsRead(
        share_count=int(share_count or 0),
        average_glucose_delta=round(float(average_delta), 1) if average_delta is not None else None,
        max_glucose_delta=int(max_delta) if max_delta is not None else None,
        min_glucose_delta=int(min_delta) if min_delta is not None else None,
    )


def _food_read(db: Session, item: FoodItem) -> FoodItemRead:
    category = cast(FoodCategory, item.category)
    return FoodItemRead(
        id=item.id,
        name=item.name,
        category=category,
        category_label=FOOD_CATEGORY_LABELS[category],
        stats=_food_stats(db, item.id),
    )


def _food_detail_read(db: Session, item: FoodItem) -> FoodItemDetailRead:
    shares = list(
        db.scalars(
            select(FoodShare)
            .where(FoodShare.food_item_id == item.id)
            .order_by(FoodShare.eaten_at.desc(), FoodShare.created_at.desc(), FoodShare.id.desc())
            .limit(50)
        )
    )
    base = _food_read(db, item)
    return FoodItemDetailRead(
        id=base.id,
        name=base.name,
        category=base.category,
        category_label=base.category_label,
        stats=base.stats,
        shares=[FoodShareRead.model_validate(share) for share in shares],
    )


@router.get("/foods/categories", response_model=list[FoodCategoryRead])
def list_food_categories() -> list[FoodCategoryRead]:
    return [
        FoodCategoryRead(code=code, label=label)
        for code, label in FOOD_CATEGORY_LABELS.items()
    ]


@router.get("/settings", response_model=CommunityPublicSettingsRead)
def get_public_settings(
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> CommunityPublicSettingsRead:
    profile = _public_profile_for_account(account, db)
    db.commit()
    db.refresh(profile)
    return CommunityPublicSettingsRead(
        display_name=profile.display_name,
        leaderboard_opt_in=profile.leaderboard_opt_in,
    )


@router.patch("/settings", response_model=CommunityPublicSettingsRead)
def update_public_settings(
    payload: CommunityPublicSettingsUpdate,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> CommunityPublicSettingsRead:
    profile = _public_profile_for_account(account, db)
    changed_fields: list[str] = []
    if payload.display_name is not None:
        display_name = payload.display_name.strip()
        if not display_name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail={
                    "code": "community_display_name_blank",
                    "message": "Community display name must not be blank.",
                },
            )
        profile.display_name = display_name
        changed_fields.append("display_name")
    if payload.leaderboard_opt_in is not None:
        profile.leaderboard_opt_in = payload.leaderboard_opt_in
        changed_fields.append("leaderboard_opt_in")
    if changed_fields:
        write_audit_event(
            db,
            actor_account_id=account.id,
            profile_id=None,
            action="community.public_settings.updated",
            resource_type="community_public_profile",
            resource_id=profile.id,
            metadata_json={"changed_fields": changed_fields},
        )
    db.commit()
    db.refresh(profile)
    return CommunityPublicSettingsRead(
        display_name=profile.display_name,
        leaderboard_opt_in=profile.leaderboard_opt_in,
    )


@router.get("/foods", response_model=list[FoodItemRead])
def list_foods(
    category: FoodCategory | None = Query(default=None),
    query: str | None = Query(default=None, min_length=1, max_length=80),
    limit: int = Query(default=50, ge=1, le=100),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> list[FoodItemRead]:
    _ = account
    statement = select(FoodItem).order_by(FoodItem.created_at.desc()).limit(limit)
    if category is not None:
        statement = statement.where(FoodItem.category == category)
    if query is not None:
        normalized_query_value = _normalize_food_name(query)
        if not normalized_query_value:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail={
                    "code": "food_query_blank",
                    "message": "Food search query must not be blank.",
                },
            )
        normalized_query = f"%{normalized_query_value}%"
        statement = statement.where(FoodItem.normalized_name.ilike(normalized_query))
    return [_food_read(db, item) for item in db.scalars(statement)]


@router.get("/foods/{food_item_id}", response_model=FoodItemDetailRead)
def get_food(
    food_item_id: UUID,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> FoodItemDetailRead:
    _ = account
    item = db.get(FoodItem, food_item_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "food_not_found",
                "message": "Food item not found.",
                "food_item_id": str(food_item_id),
            },
        )
    return _food_detail_read(db, item)


@router.post("/foods/shares", response_model=FoodShareCreateResponse, status_code=201)
def create_food_share(
    payload: FoodShareCreate,
    _: None = Depends(reject_client_supplied_glucose_delta),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> FoodShareCreateResponse:
    validate_record_occurred_at(payload.eaten_at, field_name="eaten_at")
    normalized_name = _normalize_food_name(payload.food_name)
    if not normalized_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "code": "food_name_blank",
                "message": "Food share name must not be blank.",
            },
        )
    item = db.scalar(
        select(FoodItem).where(
            FoodItem.category == payload.category,
            FoodItem.normalized_name == normalized_name,
        )
    )
    if item is None:
        item = FoodItem(
            category=payload.category,
            name=payload.food_name.strip(),
            normalized_name=normalized_name,
            created_by_account_id=account.id,
        )
        db.add(item)
        db.flush()

    share = FoodShare(
        food_item_id=item.id,
        account_id=account.id,
        eaten_at=payload.eaten_at,
        before_glucose=payload.before_glucose,
        after_glucose=payload.after_glucose,
        glucose_delta=payload.after_glucose - payload.before_glucose,
        serving_description=payload.serving_description.strip() if payload.serving_description else None,
        public_note=payload.public_note.strip() if payload.public_note else None,
    )
    db.add(share)
    db.flush()

    ledger = CommunityPointLedger(
        account_id=account.id,
        delta=FOOD_SHARE_POINTS,
        reason="food_share",
        source_type="food_share",
        source_id=share.id,
    )
    db.add(ledger)
    write_audit_event(
        db,
        actor_account_id=account.id,
        profile_id=None,
        action="community.food_share.created",
        resource_type="food_share",
        resource_id=share.id,
        metadata_json={
            "food_item_id": str(item.id),
            "category": item.category,
            "awarded_points": FOOD_SHARE_POINTS,
        },
    )
    db.commit()
    db.refresh(item)
    db.refresh(share)
    return FoodShareCreateResponse(
        food=_food_detail_read(db, item),
        share=FoodShareRead.model_validate(share),
        awarded_points=FOOD_SHARE_POINTS,
    )


@router.get("/leaderboards", response_model=CommunityLeaderboardRead)
def get_leaderboard(
    leaderboard_type: LeaderboardType = Query(default="share_count"),
    limit: int = Query(default=10, ge=1, le=50),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> CommunityLeaderboardRead:
    _ = account
    if leaderboard_type == "contribution":
        contribution_score = func.coalesce(func.sum(CommunityPointLedger.delta), 0)
        statement = (
            select(CommunityPublicProfile.account_id, CommunityPublicProfile.display_name, contribution_score.label("score"))
            .join(CommunityPointLedger, CommunityPointLedger.account_id == CommunityPublicProfile.account_id)
            .where(CommunityPointLedger.delta > 0)
            .where(CommunityPublicProfile.leaderboard_opt_in.is_(True))
            .group_by(CommunityPublicProfile.account_id, CommunityPublicProfile.display_name)
            .order_by(desc("score"), CommunityPublicProfile.display_name.asc(), CommunityPublicProfile.account_id.asc())
            .limit(limit)
        )
    else:
        distinct_foods = func.count(func.distinct(FoodShare.food_item_id))
        share_score = distinct_foods if leaderboard_type == "food_tester" else func.count(FoodShare.id)
        statement = (
            select(CommunityPublicProfile.account_id, CommunityPublicProfile.display_name, share_score.label("score"))
            .join(FoodShare, FoodShare.account_id == CommunityPublicProfile.account_id)
            .where(CommunityPublicProfile.leaderboard_opt_in.is_(True))
            .group_by(CommunityPublicProfile.account_id, CommunityPublicProfile.display_name)
            .order_by(desc("score"), CommunityPublicProfile.display_name.asc(), CommunityPublicProfile.account_id.asc())
            .limit(limit)
        )
    return CommunityLeaderboardRead(
        leaderboard_type=leaderboard_type,
        entries=[
            CommunityLeaderboardEntry(account_id=None, display_name=display_name, score=int(score or 0))
            for account_id, display_name, score in db.execute(statement)
        ],
    )
