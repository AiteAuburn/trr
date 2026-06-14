from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Literal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session
from sqlalchemy.sql.elements import ColumnElement

from app.models import Account, ProfileAccessGrant, Record, UserProfile

ProfilePermissionScope = Literal[
    "profile:read",
    "profile:write",
    "profile:export",
    "profile:share",
]
RecordPermissionScope = Literal[
    "record:read",
    "record:write",
]

ALL_PROFILE_PERMISSION_SCOPES: tuple[ProfilePermissionScope, ...] = (
    "profile:read",
    "profile:write",
    "profile:export",
    "profile:share",
)
PROFILE_GRANT_PRUNE_BATCH_SIZE = 1000


@dataclass(frozen=True)
class ProfilePermissionDecision:
    allowed: bool
    scope: ProfilePermissionScope
    reason: str
    profile: UserProfile | None = None


@dataclass(frozen=True)
class RecordPermissionDecision:
    allowed: bool
    scope: RecordPermissionScope
    reason: str
    record: Record | None = None


def validate_timezone_aware_datetime(value: datetime, *, field_name: str) -> None:
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError(f"{field_name} must include a timezone")


PROFILE_SCOPE_FOR_RECORD_SCOPE: dict[RecordPermissionScope, ProfilePermissionScope] = {
    "record:read": "profile:read",
    "record:write": "profile:write",
}


def resolve_profile_permission(
    *,
    scope: ProfilePermissionScope,
    profile_id: UUID,
    account: Account,
    db: Session,
) -> ProfilePermissionDecision:
    profile = db.scalar(
        select(UserProfile).where(
            UserProfile.id == profile_id,
        )
    )
    if profile is None:
        return ProfilePermissionDecision(
            allowed=False,
            scope=scope,
            reason="not_found_or_not_owned",
        )
    if profile.account_id != account.id:
        if _has_active_profile_grant(
            scope=scope,
            profile_id=profile_id,
            account=account,
            db=db,
        ):
            return ProfilePermissionDecision(
                allowed=True,
                scope=scope,
                reason="active_grant",
                profile=profile,
            )
        return ProfilePermissionDecision(
            allowed=False,
            scope=scope,
            reason="not_found_or_not_owned",
        )
    return ProfilePermissionDecision(
        allowed=True,
        scope=scope,
        reason="owner_profile",
        profile=profile,
    )


def resolve_record_permission(
    *,
    scope: RecordPermissionScope,
    record_id: UUID,
    account: Account,
    db: Session,
) -> RecordPermissionDecision:
    record = db.scalar(
        select(Record)
        .join(UserProfile, Record.profile_id == UserProfile.id)
        .where(
            Record.id == record_id,
            Record.deleted_at.is_(None),
        )
    )
    if record is None:
        return RecordPermissionDecision(
            allowed=False,
            scope=scope,
            reason="not_found_or_not_owned",
        )
    profile_scope = PROFILE_SCOPE_FOR_RECORD_SCOPE[scope]
    profile_decision = resolve_profile_permission(
        scope=profile_scope,
        profile_id=record.profile_id,
        account=account,
        db=db,
    )
    if not profile_decision.allowed:
        return RecordPermissionDecision(
            allowed=False,
            scope=scope,
            reason="not_found_or_not_owned",
        )
    return RecordPermissionDecision(
        allowed=True,
        scope=scope,
        reason=profile_decision.reason,
        record=record,
    )


def get_effective_profile_scopes(
    *,
    profile_id: UUID,
    account: Account,
    db: Session,
) -> set[ProfilePermissionScope]:
    profile = db.scalar(select(UserProfile).where(UserProfile.id == profile_id))
    if profile is None:
        return set()
    if profile.account_id == account.id:
        return set(ALL_PROFILE_PERMISSION_SCOPES)

    now = datetime.now(UTC)
    effective_scopes: set[ProfilePermissionScope] = set()
    grant_scopes = db.scalars(
        select(ProfileAccessGrant.scopes).where(
            *_active_profile_grant_filters(
                profile_id=profile_id,
                account_id=account.id,
                now=now,
            )
        )
    )
    for scopes in grant_scopes:
        for scope in scopes:
            if scope in ALL_PROFILE_PERMISSION_SCOPES:
                effective_scopes.add(scope)
    return effective_scopes


def get_profile_for_account(profile_id: UUID, account: Account, db: Session) -> UserProfile:
    return assert_can_read_profile(profile_id, account, db)


def assert_can_read_profile(profile_id: UUID, account: Account, db: Session) -> UserProfile:
    decision = resolve_profile_permission(
        scope="profile:read",
        profile_id=profile_id,
        account=account,
        db=db,
    )
    if decision.profile is None:
        raise _profile_not_found()
    return decision.profile


def assert_can_write_profile(profile_id: UUID, account: Account, db: Session) -> UserProfile:
    decision = resolve_profile_permission(
        scope="profile:write",
        profile_id=profile_id,
        account=account,
        db=db,
    )
    if decision.profile is None:
        raise _profile_not_found()
    return decision.profile


def assert_can_export_profile(profile_id: UUID, account: Account, db: Session) -> UserProfile:
    decision = resolve_profile_permission(
        scope="profile:export",
        profile_id=profile_id,
        account=account,
        db=db,
    )
    if decision.profile is None:
        raise _profile_not_found()
    return decision.profile


def assert_can_share_profile(profile_id: UUID, account: Account, db: Session) -> UserProfile:
    decision = resolve_profile_permission(
        scope="profile:share",
        profile_id=profile_id,
        account=account,
        db=db,
    )
    if decision.profile is None:
        raise _profile_not_found()
    return decision.profile


def assert_can_read_record(record_id: UUID, account: Account, db: Session) -> Record:
    decision = resolve_record_permission(
        scope="record:read",
        record_id=record_id,
        account=account,
        db=db,
    )
    if decision.record is None:
        raise _record_not_found()
    return decision.record


def assert_can_write_record(record_id: UUID, account: Account, db: Session) -> Record:
    decision = resolve_record_permission(
        scope="record:write",
        record_id=record_id,
        account=account,
        db=db,
    )
    if decision.record is None:
        raise _record_not_found()
    return decision.record


def prune_inactive_profile_access_grants(
    *,
    older_than: datetime,
    db: Session,
    batch_size: int = PROFILE_GRANT_PRUNE_BATCH_SIZE,
) -> int:
    validate_timezone_aware_datetime(older_than, field_name="older_than")
    if batch_size < 1:
        raise ValueError("batch_size must be positive")
    if batch_size > PROFILE_GRANT_PRUNE_BATCH_SIZE:
        raise ValueError("batch_size exceeds maximum")

    inactive_ids = list(
        db.scalars(
            select(ProfileAccessGrant.id)
            .where(
                or_(
                    ProfileAccessGrant.revoked_at < older_than,
                    ProfileAccessGrant.expires_at < older_than,
                )
            )
            .order_by(ProfileAccessGrant.created_at.asc())
            .limit(batch_size)
        )
    )
    if not inactive_ids:
        return 0

    db.execute(delete(ProfileAccessGrant).where(ProfileAccessGrant.id.in_(inactive_ids)))
    return len(inactive_ids)


def _profile_not_found() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Profile not found",
    )


def _record_not_found() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Record not found",
    )


def _has_active_profile_grant(
    *,
    scope: ProfilePermissionScope,
    profile_id: UUID,
    account: Account,
    db: Session,
) -> bool:
    now = datetime.now(UTC)
    grant_id = db.scalar(
        select(ProfileAccessGrant.id)
        .where(
            *_active_profile_grant_filters(
                profile_id=profile_id,
                account_id=account.id,
                now=now,
            ),
            ProfileAccessGrant.scopes.contains([scope]),
        )
        .limit(1)
    )
    return grant_id is not None


def _active_profile_grant_filters(
    *,
    profile_id: UUID,
    account_id: UUID,
    now: datetime,
) -> tuple[ColumnElement[bool], ...]:
    return (
        ProfileAccessGrant.profile_id == profile_id,
        ProfileAccessGrant.grantee_account_id == account_id,
        ProfileAccessGrant.revoked_at.is_(None),
        or_(ProfileAccessGrant.expires_at.is_(None), ProfileAccessGrant.expires_at > now),
    )
