from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.sql.elements import ColumnElement
from sqlalchemy.orm import Session

from app.api.deps import get_current_account
from app.db.session import get_db
from app.models import Account, ProfileAccessGrant, UserProfile
from app.schemas.profile import (
    ProfileAccessGrantCreate,
    ProfileAccessGrantRead,
    ProfileCreate,
    ProfileRead,
    SharedProfileRead,
)
from app.services.audit import write_audit_event
from app.services.permissions import assert_can_share_profile, get_effective_profile_scopes
from app.services.record_time_validation import validate_timezone_aware_datetime

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("", response_model=list[ProfileRead])
def list_profiles(
    limit: int = Query(default=100, ge=1, le=500),
    before: datetime | None = Query(default=None),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> list[UserProfile]:
    validate_timezone_aware_datetime(before, field_name="before")
    statement = (
        select(UserProfile)
        .where(UserProfile.account_id == account.id)
        .order_by(UserProfile.created_at.desc())
        .limit(limit)
    )
    if before is not None:
        statement = statement.where(UserProfile.created_at < before)
    return list(db.scalars(statement))


@router.post("", response_model=ProfileRead, status_code=201)
def create_profile(
    payload: ProfileCreate,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> UserProfile:
    profile = UserProfile(
        account_id=account.id,
        display_name=payload.display_name,
        relationship=payload.relationship,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/shared", response_model=list[SharedProfileRead])
def list_shared_profiles(
    limit: int = Query(default=100, ge=1, le=500),
    before: datetime | None = Query(default=None),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> list[SharedProfileRead]:
    validate_timezone_aware_datetime(before, field_name="before")
    now = datetime.now(UTC)
    statement = (
        select(ProfileAccessGrant, UserProfile)
        .join(UserProfile, ProfileAccessGrant.profile_id == UserProfile.id)
        .where(
            ProfileAccessGrant.grantee_account_id == account.id,
            ProfileAccessGrant.revoked_at.is_(None),
            or_(ProfileAccessGrant.expires_at.is_(None), ProfileAccessGrant.expires_at > now),
            _readable_grant_scope_filter(),
        )
        .order_by(ProfileAccessGrant.created_at.desc())
        .limit(limit)
    )
    if before is not None:
        statement = statement.where(ProfileAccessGrant.created_at < before)
    rows = db.execute(statement)
    shared_profiles: list[SharedProfileRead] = []
    for grant, profile in rows:
        shared_profiles.append(
            SharedProfileRead(
                profile_id=profile.id,
                display_name=profile.display_name,
                relationship=profile.relationship,
                grant_id=grant.id,
                grant_type=grant.grant_type,
                scopes=grant.scopes,
                expires_at=grant.expires_at,
                created_at=grant.created_at,
            )
        )
    return shared_profiles


@router.delete("/shared/{grant_id}", response_model=ProfileAccessGrantRead)
def revoke_shared_profile_grant(
    grant_id: UUID,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> ProfileAccessGrant:
    grant = db.scalar(
        select(ProfileAccessGrant).where(
            ProfileAccessGrant.id == grant_id,
            ProfileAccessGrant.grantee_account_id == account.id,
        )
    )
    if grant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared profile grant not found",
        )

    if grant.revoked_at is None:
        grant.revoked_at = datetime.now(UTC)
        write_audit_event(
            db,
            actor_account_id=account.id,
            profile_id=grant.profile_id,
            action="profile_access_grant.self_revoked",
            resource_type="profile_access_grant",
            resource_id=grant.id,
            metadata_json={
                "grant_type": grant.grant_type,
                "scopes": grant.scopes,
            },
        )
        db.commit()
        db.refresh(grant)
    return grant


@router.get("/{profile_id}/grants", response_model=list[ProfileAccessGrantRead])
def list_profile_grants(
    profile_id: UUID,
    limit: int = Query(default=100, ge=1, le=500),
    before: datetime | None = Query(default=None),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> list[ProfileAccessGrant]:
    validate_timezone_aware_datetime(before, field_name="before")
    assert_can_share_profile(profile_id, account, db)
    statement = (
        select(ProfileAccessGrant)
        .where(ProfileAccessGrant.profile_id == profile_id)
        .order_by(ProfileAccessGrant.created_at.desc())
        .limit(limit)
    )
    if before is not None:
        statement = statement.where(ProfileAccessGrant.created_at < before)
    return list(db.scalars(statement))


@router.post("/{profile_id}/grants", response_model=ProfileAccessGrantRead, status_code=201)
def create_profile_grant(
    profile_id: UUID,
    payload: ProfileAccessGrantCreate,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> ProfileAccessGrant:
    validate_profile_grant_expiration(payload.expires_at)
    assert_can_share_profile(profile_id, account, db)
    requested_scopes = list(dict.fromkeys(payload.scopes))
    effective_scopes = get_effective_profile_scopes(profile_id=profile_id, account=account, db=db)
    if not set(requested_scopes).issubset(effective_scopes):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "grant_scope_not_allowed",
                "message": "Requested grant scopes exceed current permissions.",
            },
        )
    grantee = db.get(Account, payload.grantee_account_id)
    if grantee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grantee account not found",
        )

    grant = ProfileAccessGrant(
        profile_id=profile_id,
        grantee_account_id=payload.grantee_account_id,
        grant_type=payload.grant_type,
        scopes=requested_scopes,
        metadata_json={},
        expires_at=payload.expires_at,
    )
    db.add(grant)
    db.flush()
    write_audit_event(
        db,
        actor_account_id=account.id,
        profile_id=profile_id,
        action="profile_access_grant.created",
        resource_type="profile_access_grant",
        resource_id=grant.id,
        metadata_json={
            "grant_type": grant.grant_type,
            "scopes": grant.scopes,
            "has_expiration": grant.expires_at is not None,
        },
    )
    db.commit()
    db.refresh(grant)
    return grant


@router.delete("/{profile_id}/grants/{grant_id}", response_model=ProfileAccessGrantRead)
def revoke_profile_grant(
    profile_id: UUID,
    grant_id: UUID,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> ProfileAccessGrant:
    assert_can_share_profile(profile_id, account, db)
    grant = db.scalar(
        select(ProfileAccessGrant).where(
            ProfileAccessGrant.id == grant_id,
            ProfileAccessGrant.profile_id == profile_id,
        )
    )
    if grant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile access grant not found",
        )

    if grant.revoked_at is None:
        grant.revoked_at = datetime.now(UTC)
        write_audit_event(
            db,
            actor_account_id=account.id,
            profile_id=profile_id,
            action="profile_access_grant.revoked",
            resource_type="profile_access_grant",
            resource_id=grant.id,
            metadata_json={
                "grant_type": grant.grant_type,
                "scopes": grant.scopes,
            },
        )
        db.commit()
        db.refresh(grant)
    return grant


def _grant_has_readable_scope(grant: ProfileAccessGrant) -> bool:
    return any(scope in grant.scopes for scope in ("profile:read", "profile:export", "profile:share"))


def validate_profile_grant_expiration(expires_at: datetime | None) -> None:
    validate_timezone_aware_datetime(expires_at, field_name="expires_at")
    if expires_at is None or expires_at > datetime.now(UTC):
        return
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={
            "code": "invalid_grant_expiration",
            "message": "expires_at must be in the future.",
        },
    )


def _readable_grant_scope_filter() -> ColumnElement[bool]:
    return or_(
        ProfileAccessGrant.scopes.contains(["profile:read"]),
        ProfileAccessGrant.scopes.contains(["profile:export"]),
        ProfileAccessGrant.scopes.contains(["profile:share"]),
    )
