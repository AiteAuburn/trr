from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_account
from app.db.session import get_db
from app.models import Account, YearReviewSharePackage, YearReviewSnapshot
from app.schemas.year_review import (
    YearReviewRead,
    YearReviewShareAssetRead,
    YearReviewShareCardRead,
    YearReviewShareConfirmCreate,
    YearReviewSharePackageRead,
    YearReviewShareResultCreate,
)
from app.services.audit import write_audit_event
from app.services.permissions import assert_can_read_profile
from app.services.year_review_snapshots import (
    build_year_review_share_asset,
    build_year_review_share_card,
    build_year_review_share_package,
    create_year_review_share_package,
    get_or_create_year_review_snapshot,
    latest_completed_year,
    snapshot_read,
    validate_completed_year_review_year,
)

router = APIRouter(prefix="/year-reviews", tags=["year-reviews"])


def _validate_completed_review_year(year: int) -> None:
    completed_year = latest_completed_year()
    try:
        validate_completed_year_review_year(year)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "code": "year_review_year_not_completed",
                "message": "Year review can only be generated for completed calendar years.",
                "latest_completed_year": completed_year,
            },
        ) from None


def _get_authorized_share_package(
    share_package_id: UUID,
    account: Account,
    db: Session,
) -> tuple[YearReviewSharePackage, YearReviewSnapshot]:
    share_package = db.scalar(
        select(YearReviewSharePackage).where(YearReviewSharePackage.id == share_package_id)
    )
    if share_package is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share package not found")
    assert_can_read_profile(share_package.profile_id, account, db)
    snapshot = db.scalar(
        select(YearReviewSnapshot).where(YearReviewSnapshot.id == share_package.snapshot_id)
    )
    if snapshot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Year review snapshot not found")
    return share_package, snapshot


@router.get("/{year}", response_model=YearReviewRead)
def get_year_review(
    year: int,
    profile_id: UUID = Query(),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> YearReviewRead:
    _validate_completed_review_year(year)
    assert_can_read_profile(profile_id, account, db)
    snapshot, created = get_or_create_year_review_snapshot(
        year=year,
        profile_id=profile_id,
        db=db,
        actor_account_id=account.id,
    )
    if created:
        db.commit()
        db.refresh(snapshot)
    return snapshot_read(snapshot)


@router.get("/{year}/share-card", response_model=YearReviewShareCardRead)
def get_year_review_share_card(
    year: int,
    profile_id: UUID = Query(),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> YearReviewShareCardRead:
    _validate_completed_review_year(year)
    assert_can_read_profile(profile_id, account, db)
    snapshot, created = get_or_create_year_review_snapshot(
        year=year,
        profile_id=profile_id,
        db=db,
        actor_account_id=account.id,
    )
    if created:
        db.commit()
        db.refresh(snapshot)
    return build_year_review_share_card(snapshot)


@router.get("/{year}/share-card/asset", response_model=YearReviewShareAssetRead)
def get_year_review_share_asset(
    year: int,
    profile_id: UUID = Query(),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> YearReviewShareAssetRead:
    _validate_completed_review_year(year)
    assert_can_read_profile(profile_id, account, db)
    snapshot, created = get_or_create_year_review_snapshot(
        year=year,
        profile_id=profile_id,
        db=db,
        actor_account_id=account.id,
    )
    if created:
        db.commit()
        db.refresh(snapshot)
    return build_year_review_share_asset(snapshot)


@router.post("/{year}/share-card/confirm", response_model=YearReviewSharePackageRead)
def confirm_year_review_share_card(
    year: int,
    payload: YearReviewShareConfirmCreate,
    profile_id: UUID = Query(),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> YearReviewSharePackageRead:
    _validate_completed_review_year(year)
    assert_can_read_profile(profile_id, account, db)
    if not payload.privacy_acknowledged:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "privacy_acknowledgement_required",
                "message": "Privacy acknowledgement is required before enabling the share package.",
            },
        )
    snapshot, created = get_or_create_year_review_snapshot(
        year=year,
        profile_id=profile_id,
        db=db,
        actor_account_id=account.id,
    )
    if created:
        db.flush()
    share_package = create_year_review_share_package(snapshot, db)
    package = build_year_review_share_package(snapshot, share_package)
    write_audit_event(
        db,
        actor_account_id=account.id,
        profile_id=profile_id,
        action="year_review.share_package.confirmed",
        resource_type="year_review_share_package",
        resource_id=share_package.id,
        metadata_json={
            "year": year,
            "privacy_level": package.privacy_level,
            "asset_kind": package.asset.asset_kind,
        },
    )
    db.commit()
    db.refresh(share_package)
    return build_year_review_share_package(snapshot, share_package)


@router.get("/share-packages/{share_package_id}", response_model=YearReviewSharePackageRead)
def get_year_review_share_package(
    share_package_id: UUID,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> YearReviewSharePackageRead:
    share_package, snapshot = _get_authorized_share_package(share_package_id, account, db)
    return build_year_review_share_package(snapshot, share_package)


@router.post("/share-packages/{share_package_id}/result", response_model=YearReviewSharePackageRead)
def report_year_review_share_result(
    share_package_id: UUID,
    payload: YearReviewShareResultCreate,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> YearReviewSharePackageRead:
    share_package, snapshot = _get_authorized_share_package(share_package_id, account, db)
    if share_package.status == "revoked":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "share_package_revoked",
                "message": "Revoked share packages cannot receive share result updates.",
            },
        )
    share_package.last_share_result = payload.share_result
    if payload.share_result == "opened":
        share_package.status = "opened"
        share_package.shared_at = datetime.now(UTC)
    elif share_package.status != "opened":
        share_package.status = payload.share_result
    write_audit_event(
        db,
        actor_account_id=account.id,
        profile_id=share_package.profile_id,
        action=f"year_review.share_package.{payload.share_result}",
        resource_type="year_review_share_package",
        resource_id=share_package.id,
        metadata_json={"year": share_package.year, "result": payload.share_result},
    )
    db.commit()
    db.refresh(share_package)
    return build_year_review_share_package(snapshot, share_package)


@router.post("/share-packages/{share_package_id}/revoke", response_model=YearReviewSharePackageRead)
def revoke_year_review_share_package(
    share_package_id: UUID,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> YearReviewSharePackageRead:
    share_package, snapshot = _get_authorized_share_package(share_package_id, account, db)
    if share_package.status != "revoked":
        share_package.status = "revoked"
        share_package.revoked_at = datetime.now(UTC)
        write_audit_event(
            db,
            actor_account_id=account.id,
            profile_id=share_package.profile_id,
            action="year_review.share_package.revoked",
            resource_type="year_review_share_package",
            resource_id=share_package.id,
            metadata_json={"year": share_package.year},
        )
        db.commit()
        db.refresh(share_package)
    return build_year_review_share_package(snapshot, share_package)
