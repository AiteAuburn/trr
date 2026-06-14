from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_account
from app.db.session import get_db
from app.models import Account, Record, UserProfile
from app.schemas.record import RecordCreate, RecordRead, RecordUpdate
from app.services.audit import write_audit_event
from app.services.record_sanitization import (
    sanitize_record_metadata_for_storage,
    sanitize_record_payload_for_storage,
)
from app.services.record_json_bounds import validate_record_json_bounds
from app.services.permissions import (
    assert_can_read_profile,
    assert_can_read_record,
    assert_can_write_profile,
    assert_can_write_record,
)
from app.services.record_schema_registry import attach_record_schema_metadata, validate_payload_with_registry
from app.services.record_time_validation import (
    validate_record_occurred_at,
    validate_timezone_aware_datetime,
)

router = APIRouter(prefix="/records", tags=["records"])


def get_owned_profile(profile_id: UUID, account: Account, db: Session) -> UserProfile:
    return assert_can_read_profile(profile_id, account, db)


@router.get("", response_model=list[RecordRead])
def list_records(
    profile_id: UUID = Query(),
    before: datetime | None = Query(default=None),
    before_created_at: datetime | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> list[Record]:
    validate_record_list_cursor(before=before, before_created_at=before_created_at)
    assert_can_read_profile(profile_id, account, db)
    statement = (
        select(Record)
        .where(Record.profile_id == profile_id, Record.deleted_at.is_(None))
        .order_by(Record.occurred_at.desc(), Record.created_at.desc())
        .limit(limit)
    )
    if before is not None:
        if before_created_at is None:
            statement = statement.where(Record.occurred_at < before)
        else:
            statement = statement.where(
                (Record.occurred_at < before)
                | ((Record.occurred_at == before) & (Record.created_at < before_created_at))
            )
    return list(db.scalars(statement))


def validate_record_list_cursor(
    *,
    before: datetime | None,
    before_created_at: datetime | None,
) -> None:
    validate_timezone_aware_datetime(before, field_name="before")
    validate_timezone_aware_datetime(before_created_at, field_name="before_created_at")
    if before is not None or before_created_at is None:
        return
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={
            "code": "invalid_record_cursor",
            "message": "before_created_at requires before.",
        },
    )


def get_owned_record(record_id: UUID, account: Account, db: Session) -> Record:
    return assert_can_read_record(record_id, account, db)


@router.get("/{record_id}", response_model=RecordRead)
def get_record(
    record_id: UUID,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> Record:
    return get_owned_record(record_id, account, db)


@router.patch("/{record_id}", response_model=RecordRead)
def update_record(
    record_id: UUID,
    payload: RecordUpdate,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> Record:
    validate_record_occurred_at(payload.occurred_at)
    if payload.payload_json is not None:
        validate_record_json_bounds(payload.payload_json, field_name="payload_json")
    if payload.metadata_json is not None:
        validate_record_json_bounds(payload.metadata_json, field_name="metadata_json")
    record = assert_can_write_record(record_id, account, db)
    changed_fields: list[str] = []

    if payload.occurred_at is not None:
        record.occurred_at = payload.occurred_at
        changed_fields.append("occurred_at")
    if payload.payload_json is not None:
        stored_payload = sanitize_record_payload_for_storage(record.record_type, payload.payload_json)
        validate_payload_with_registry(record.record_type, stored_payload)
        record.payload = stored_payload
        record.metadata_json = attach_record_schema_metadata(record.record_type, record.metadata_json)
        changed_fields.append("payload_json")
    if payload.metadata_json is not None:
        record.metadata_json = attach_record_schema_metadata(
            record.record_type,
            sanitize_record_metadata_for_storage(payload.metadata_json),
        )
        changed_fields.append("metadata_json")
    if payload.source is not None:
        record.source = payload.source
        changed_fields.append("source")

    if changed_fields:
        write_audit_event(
            db,
            actor_account_id=account.id,
            profile_id=record.profile_id,
            action="record.updated",
            resource_type="record",
            resource_id=record.id,
            metadata_json={
                "record_type": record.record_type,
                "changed_fields": changed_fields,
            },
        )
        db.commit()
        db.refresh(record)
    return record


@router.delete("/{record_id}", status_code=204)
def delete_record(
    record_id: UUID,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> None:
    record = assert_can_write_record(record_id, account, db)
    record.deleted_at = datetime.now(UTC)
    write_audit_event(
        db,
        actor_account_id=account.id,
        profile_id=record.profile_id,
        action="record.deleted",
        resource_type="record",
        resource_id=record.id,
        metadata_json={"record_type": record.record_type},
    )
    db.commit()


@router.post("", response_model=RecordRead, status_code=201)
def create_record(
    payload: RecordCreate,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> Record:
    validate_record_occurred_at(payload.occurred_at)
    validate_record_json_bounds(payload.payload_json, field_name="payload_json")
    validate_record_json_bounds(payload.metadata_json, field_name="metadata_json")
    assert_can_write_profile(payload.profile_id, account, db)
    stored_payload = sanitize_record_payload_for_storage(payload.record_type, payload.payload_json)
    stored_metadata = sanitize_record_metadata_for_storage(payload.metadata_json)
    validate_payload_with_registry(payload.record_type, stored_payload)
    stored_metadata = attach_record_schema_metadata(payload.record_type, stored_metadata)
    record = Record(
        profile_id=payload.profile_id,
        record_type=payload.record_type,
        occurred_at=payload.occurred_at,
        payload=stored_payload,
        metadata_json=stored_metadata,
        source=payload.source,
    )
    db.add(record)
    db.flush()
    write_audit_event(
        db,
        actor_account_id=account.id,
        profile_id=payload.profile_id,
        action="record.created",
        resource_type="record",
        resource_id=record.id,
        metadata_json={
            "record_type": payload.record_type,
            "source": payload.source,
        },
    )
    db.commit()
    db.refresh(record)
    return record
