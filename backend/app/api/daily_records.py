from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_account
from app.db.session import get_db
from app.models import Account, DailyRecord, Record
from app.schemas.daily_record import DailyRecordRead, DailyRecordSaveRequest, DailyRecordSaveResponse
from app.schemas.record import RecordRead
from app.services.audit import write_audit_event
from app.services.permissions import assert_can_read_profile, assert_can_write_profile
from app.services.record_json_bounds import validate_record_json_bounds
from app.services.record_sanitization import (
    sanitize_record_metadata_for_storage,
    sanitize_record_payload_for_storage,
)
from app.services.record_schema_registry import attach_record_schema_metadata, validate_payload_with_registry
from app.services.record_time_validation import (
    validate_record_occurred_at,
    validate_timezone_aware_datetime,
)

router = APIRouter(prefix="/daily-records", tags=["daily-records"])

MAX_DAILY_TRANSCRIPT_ENTRIES = 100


@router.get("", response_model=list[DailyRecordRead])
def list_daily_records(
    profile_id: UUID = Query(),
    record_date: date | None = Query(default=None),
    limit: int = Query(default=31, ge=1, le=366),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> list[DailyRecord]:
    assert_can_read_profile(profile_id, account, db)
    statement = (
        select(DailyRecord)
        .where(DailyRecord.profile_id == profile_id)
        .order_by(DailyRecord.record_date.desc(), DailyRecord.updated_at.desc())
        .limit(limit)
    )
    if record_date is not None:
        statement = statement.where(DailyRecord.record_date == record_date)
    return list(db.scalars(statement))


@router.post("/save", response_model=DailyRecordSaveResponse, status_code=201)
def save_daily_record(
    payload: DailyRecordSaveRequest,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> DailyRecordSaveResponse:
    assert_can_write_profile(payload.profile_id, account, db)
    if not payload.records:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "daily_record_requires_records",
                "message": "Daily record save requires at least one structured record.",
            },
        )

    for transcript_entry in payload.transcript_entries:
        validate_timezone_aware_datetime(
            transcript_entry.occurred_at,
            field_name="transcript_entries.occurred_at",
        )

    created_records: list[Record] = []
    for record_payload in payload.records:
        if record_payload.profile_id != payload.profile_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "daily_record_profile_mismatch",
                    "message": "All records must belong to the daily record profile.",
                },
            )
        validate_record_occurred_at(record_payload.occurred_at)
        validate_record_json_bounds(record_payload.payload_json, field_name="payload_json")
        validate_record_json_bounds(record_payload.metadata_json, field_name="metadata_json")
        stored_payload = sanitize_record_payload_for_storage(
            record_payload.record_type,
            record_payload.payload_json,
        )
        stored_metadata = sanitize_record_metadata_for_storage(record_payload.metadata_json)
        validate_payload_with_registry(record_payload.record_type, stored_payload)
        stored_metadata = attach_record_schema_metadata(record_payload.record_type, stored_metadata)
        record = Record(
            profile_id=record_payload.profile_id,
            record_type=record_payload.record_type,
            occurred_at=record_payload.occurred_at,
            payload=stored_payload,
            metadata_json=stored_metadata,
            source=record_payload.source,
        )
        db.add(record)
        db.flush()
        created_records.append(record)
        write_audit_event(
            db,
            actor_account_id=account.id,
            profile_id=payload.profile_id,
            action="record.created",
            resource_type="record",
            resource_id=record.id,
            metadata_json={
                "record_type": record_payload.record_type,
                "source": record_payload.source,
            },
        )

    daily_record = db.scalar(
        select(DailyRecord).where(
            DailyRecord.profile_id == payload.profile_id,
            DailyRecord.record_date == payload.record_date,
        )
    )
    created_daily_record = daily_record is None
    if daily_record is None:
        daily_record = DailyRecord(
            profile_id=payload.profile_id,
            record_date=payload.record_date,
            summary_text=payload.summary_text,
            record_ids=[],
            preview_records_json=[],
            transcript_entries_json=[],
            source=payload.source,
        )
        db.add(daily_record)
        db.flush()

    daily_record.summary_text = payload.summary_text
    daily_record.record_ids = _merge_record_ids(daily_record.record_ids, created_records)
    daily_record.preview_records_json = _merge_preview_records(
        daily_record.preview_records_json,
        _daily_record_preview_records(created_records),
    )
    daily_record.transcript_entries_json = _merge_transcript_entries(
        daily_record.transcript_entries_json,
        [
            transcript_entry.model_dump(mode="json")
            for transcript_entry in payload.transcript_entries
        ],
    )
    daily_record.source = payload.source

    write_audit_event(
        db,
        actor_account_id=account.id,
        profile_id=payload.profile_id,
        action="daily_record.created" if created_daily_record else "daily_record.updated",
        resource_type="daily_record",
        resource_id=daily_record.id,
        metadata_json={
            "record_date": payload.record_date.isoformat(),
            "created_record_count": len(created_records),
            "transcript_entry_count": len(payload.transcript_entries),
        },
    )
    db.commit()
    db.refresh(daily_record)
    for record in created_records:
        db.refresh(record)
    return DailyRecordSaveResponse(
        daily_record=DailyRecordRead.model_validate(daily_record),
        records=[RecordRead.model_validate(record) for record in created_records],
    )


def _merge_record_ids(existing_ids: list[str], created_records: list[Record]) -> list[str]:
    merged: list[str] = []
    for record_id in [*existing_ids, *[str(record.id) for record in created_records]]:
        if record_id not in merged:
            merged.append(record_id)
    return merged


def _daily_record_preview_records(records: list[Record]) -> list[dict[str, object]]:
    return [
        {
            "id": str(record.id),
            "profile_id": str(record.profile_id),
            "record_type": record.record_type,
            "occurred_at": record.occurred_at.isoformat(),
            "payload_json": record.payload_json,
            "metadata_json": record.metadata_json,
            "source": record.source,
        }
        for record in records
    ]


def _merge_preview_records(
    existing_records: list[dict[str, object]],
    incoming_records: list[dict[str, object]],
) -> list[dict[str, object]]:
    merged_by_id: dict[str, dict[str, object]] = {}
    for record in [*existing_records, *incoming_records]:
        record_id = str(record.get("id", "")).strip()
        if not record_id:
            continue
        merged_by_id[record_id] = record
    return list(merged_by_id.values())


def _merge_transcript_entries(
    existing_entries: list[dict[str, object]],
    incoming_entries: list[dict[str, object]],
) -> list[dict[str, object]]:
    merged_by_id: dict[str, dict[str, object]] = {}
    for entry in [*existing_entries, *incoming_entries]:
        entry_id = str(entry.get("id", "")).strip()
        if not entry_id:
            continue
        merged_by_id[entry_id[:120]] = {
            "id": entry_id[:120],
            "occurred_at": str(entry.get("occurred_at", ""))[:80],
            "source_text": str(entry.get("source_text", ""))[:4000],
            "source": "voice" if entry.get("source") == "voice" else "text",
        }
    return list(merged_by_id.values())[-MAX_DAILY_TRANSCRIPT_ENTRIES:]
