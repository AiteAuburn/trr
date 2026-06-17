from datetime import UTC, date, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_account
from app.db.session import get_db
from app.models import Account, AchievementUnlock, Record
from app.schemas.achievement import AchievementRead, AchievementSummaryRead
from app.services.achievement_catalog import (
    ACHIEVEMENT_CATEGORY_DEFINITIONS,
    ACHIEVEMENT_LEVEL_COLORS,
    ACHIEVEMENT_STREAK_BADGE_COLOR,
    achievement_levels_for_progress,
)
from app.services.audit import write_audit_event
from app.services.permissions import assert_can_read_profile

router = APIRouter(prefix="/achievements", tags=["achievements"])


def _longest_streak(days: set[date]) -> int:
    longest = 0
    current = 0
    previous = None
    for day in sorted(days):
        if previous is not None and (day - previous).days == 1:
            current += 1
        else:
            current = 1
        longest = max(longest, current)
        previous = day
    return longest


def _achievement_progress(records: list[Record]) -> list[tuple[dict[str, object], int, int]]:
    progress: list[tuple[dict[str, object], int, int]] = []
    for definition in ACHIEVEMENT_CATEGORY_DEFINITIONS:
        record_type = str(definition["record_type"])
        cumulative_progress = sum(1 for record in records if record.record_type == record_type)
        streak_progress = _longest_streak(
            {record.occurred_at.date() for record in records if record.record_type == record_type}
        )
        progress.append((definition, cumulative_progress, streak_progress))
    return progress


def _achievement_items(records: list[Record], levels: tuple[int, ...] | None = None) -> list[AchievementRead]:
    items: list[AchievementRead] = []
    progress_by_definition = _achievement_progress(records)
    if levels is None:
        max_progress = max(
            (max(cumulative_progress, streak_progress) for _, cumulative_progress, streak_progress in progress_by_definition),
            default=0,
        )
        levels = achievement_levels_for_progress(max_progress)
    for definition, cumulative_progress, streak_progress in progress_by_definition:
        category = str(definition["id"])
        label = str(definition["label"])
        for level_index, level in enumerate(levels):
            badge_color = ACHIEVEMENT_LEVEL_COLORS[level_index] if level_index < len(ACHIEVEMENT_LEVEL_COLORS) else str(
                definition["cumulative_color"]
            )
            items.append(
                AchievementRead(
                    id=f"{category}-cumulative-{level}",
                    category=category,  # type: ignore[arg-type]
                    category_label=label,
                    kind="cumulative",
                    kind_label="累積型",
                    level=level,
                    title=f"{label}累積 {level}",
                    description=f"累積建立 {level} 筆{label}。",
                    icon=str(definition["cumulative_icon"]),
                    badge_color=badge_color,
                    progress=min(cumulative_progress, level),
                    target=level,
                    unlocked=cumulative_progress >= level,
                    unlocked_at=None,
                )
            )
            items.append(
                AchievementRead(
                    id=f"{category}-streak-{level}",
                    category=category,  # type: ignore[arg-type]
                    category_label=label,
                    kind="streak",
                    kind_label="連續型",
                    level=level,
                    title=f"{label}連續 {level}",
                    description=f"連續 {level} 天建立{label}。",
                    icon="連",
                    badge_color=ACHIEVEMENT_STREAK_BADGE_COLOR,
                    progress=min(streak_progress, level),
                    target=level,
                    unlocked=streak_progress >= level,
                    unlocked_at=None,
                )
            )
    return items


def _achievement_unlocks_by_id(profile_id: UUID, db: Session) -> dict[str, AchievementUnlock]:
    unlocks = db.scalars(
        select(AchievementUnlock).where(AchievementUnlock.profile_id == profile_id)
    )
    return {unlock.achievement_id: unlock for unlock in unlocks}


def _max_persisted_unlock_level(unlocks: dict[str, AchievementUnlock]) -> int:
    return max((unlock.level for unlock in unlocks.values()), default=0)


def _achievement_unlock_items(profile_id: UUID, db: Session) -> list[AchievementRead]:
    records = list(
        db.scalars(
            select(Record).where(
                Record.profile_id == profile_id,
                Record.deleted_at.is_(None),
                Record.record_type.in_(("glucose", "meal", "exercise")),
            )
        )
    )
    unlocks = list(
        db.scalars(
            select(AchievementUnlock)
            .where(AchievementUnlock.profile_id == profile_id)
            .order_by(AchievementUnlock.unlocked_at.desc(), AchievementUnlock.created_at.desc())
        )
    )
    unlocks_by_id = {unlock.achievement_id: unlock for unlock in unlocks}
    progress_by_definition = _achievement_progress(records)
    max_progress = max(
        (max(cumulative_progress, streak_progress) for _, cumulative_progress, streak_progress in progress_by_definition),
        default=0,
    )
    levels = achievement_levels_for_progress(max(max_progress, _max_persisted_unlock_level(unlocks_by_id)))
    items_by_id = {item.id: item for item in _achievement_items(records, levels)}
    unlocked_items: list[AchievementRead] = []
    for unlock in unlocks:
        item = items_by_id.get(unlock.achievement_id)
        if item is None:
            continue
        item.unlocked = True
        item.unlocked_at = unlock.unlocked_at
        unlocked_items.append(item)
    return unlocked_items


def _achievement_summary(
    profile_id: UUID,
    db: Session,
    *,
    sync_unlocks: bool,
    actor_account_id: UUID | None,
) -> AchievementSummaryRead:
    records = list(
        db.scalars(
            select(Record).where(
                Record.profile_id == profile_id,
                Record.deleted_at.is_(None),
                Record.record_type.in_(("glucose", "meal", "exercise")),
            )
        )
    )
    unlocks_by_id = _achievement_unlocks_by_id(profile_id, db)
    progress_by_definition = _achievement_progress(records)
    max_progress = max(
        (max(cumulative_progress, streak_progress) for _, cumulative_progress, streak_progress in progress_by_definition),
        default=0,
    )
    max_progress = max(max_progress, _max_persisted_unlock_level(unlocks_by_id))
    levels = achievement_levels_for_progress(max_progress)
    items = _achievement_items(records, levels)
    newly_unlocked_ids: list[str] = []
    for item in items:
        persisted_unlock = unlocks_by_id.get(item.id)
        if persisted_unlock is not None:
            item.unlocked = True
            item.unlocked_at = persisted_unlock.unlocked_at
        elif sync_unlocks and item.unlocked:
            new_unlock = AchievementUnlock(
                profile_id=profile_id,
                achievement_id=item.id,
                category=item.category,
                kind=item.kind,
                level=item.level,
                unlocked_at=datetime.now(UTC),
            )
            db.add(new_unlock)
            unlocks_by_id[item.id] = new_unlock
            newly_unlocked_ids.append(item.id)
            item.newly_unlocked = True
            item.unlocked_at = new_unlock.unlocked_at
    if newly_unlocked_ids:
        write_audit_event(
            db,
            actor_account_id=actor_account_id,
            profile_id=profile_id,
            action="achievement.unlocks.synced",
            resource_type="achievement_unlock",
            resource_id=None,
            metadata_json={
                "newly_unlocked_count": len(newly_unlocked_ids),
                "achievement_ids": newly_unlocked_ids[:20],
            },
        )
        db.commit()
        persisted_unlocks = _achievement_unlocks_by_id(profile_id, db)
        for item in items:
            persisted_unlock = persisted_unlocks.get(item.id)
            if persisted_unlock is not None:
                item.unlocked = True
                item.unlocked_at = persisted_unlock.unlocked_at
                item.newly_unlocked = item.id in newly_unlocked_ids
    unlocked_count = sum(1 for item in items if item.unlocked)
    persisted_unlocked_count = sum(1 for item in items if item.unlocked_at is not None)
    next_remaining = min(
        (item.target - item.progress for item in items if not item.unlocked),
        default=0,
    )
    return AchievementSummaryRead(
        levels=list(levels),
        unlocked_count=unlocked_count,
        persisted_unlocked_count=persisted_unlocked_count,
        newly_unlocked_count=len(newly_unlocked_ids),
        next_remaining=next_remaining,
        items=items,
    )


@router.get("/summary", response_model=AchievementSummaryRead)
def get_achievement_summary(
    profile_id: UUID = Query(),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> AchievementSummaryRead:
    assert_can_read_profile(profile_id, account, db)
    return _achievement_summary(
        profile_id,
        db,
        sync_unlocks=False,
        actor_account_id=account.id,
    )


@router.post("/sync", response_model=AchievementSummaryRead)
def sync_achievement_unlocks(
    profile_id: UUID = Query(),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> AchievementSummaryRead:
    assert_can_read_profile(profile_id, account, db)
    return _achievement_summary(
        profile_id,
        db,
        sync_unlocks=True,
        actor_account_id=account.id,
    )


@router.get("/unlocks", response_model=list[AchievementRead])
def list_achievement_unlocks(
    profile_id: UUID = Query(),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> list[AchievementRead]:
    assert_can_read_profile(profile_id, account, db)
    return _achievement_unlock_items(profile_id, db)
