from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_account
from app.db.session import get_db
from app.models import Account, Record
from app.schemas.report import ReportSummary
from app.services.audit import write_audit_event
from app.services.permissions import assert_can_export_profile
from app.services.record_schema_registry import report_eligible_record_types
from app.services.record_time_validation import validate_timezone_aware_datetime
from app.services.reporting import build_basic_report_from_fields

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/basic", response_model=ReportSummary)
def get_basic_report(
    profile_id: UUID = Query(),
    start_at: datetime | None = Query(default=None),
    end_at: datetime | None = Query(default=None),
    limit: int = Query(default=500, ge=1, le=5000),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> ReportSummary:
    validate_report_window(start_at=start_at, end_at=end_at)
    assert_can_export_profile(profile_id, account, db)
    statement = (
        select(Record.record_type, Record.payload, Record.occurred_at)
        .where(
            Record.profile_id == profile_id,
            Record.deleted_at.is_(None),
            Record.record_type.in_(report_eligible_record_types()),
        )
        .order_by(Record.occurred_at.asc(), Record.created_at.asc())
        .limit(limit)
        .execution_options(yield_per=500)
    )
    if start_at is not None:
        statement = statement.where(Record.occurred_at >= start_at)
    if end_at is not None:
        statement = statement.where(Record.occurred_at < end_at)
    report = build_basic_report_from_fields(profile_id, db.execute(statement).tuples())
    write_audit_event(
        db,
        actor_account_id=account.id,
        profile_id=profile_id,
        action="report.basic_viewed",
        resource_type="report",
        metadata_json={"record_count": report.record_count},
    )
    db.commit()
    return report


def validate_report_window(*, start_at: datetime | None, end_at: datetime | None) -> None:
    validate_timezone_aware_datetime(start_at, field_name="start_at")
    validate_timezone_aware_datetime(end_at, field_name="end_at")
    if start_at is None or end_at is None or start_at < end_at:
        return
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={
            "code": "invalid_report_window",
            "message": "start_at must be earlier than end_at.",
        },
    )
