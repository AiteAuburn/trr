from datetime import UTC, datetime
from collections.abc import Iterable
from typing import Any
from uuid import UUID

from app.models import Record
from app.schemas.report import GlucoseSummary, LifestyleSummary, MealSummary, ReportSummary


def _payload_number(payload: dict[str, Any], key: str) -> float | None:
    value = payload.get(key)
    if isinstance(value, bool):
        return None
    if isinstance(value, int | float):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value.strip())
        except ValueError:
            return None
    return None


def _is_before_meal_timing(value: Any) -> bool:
    return isinstance(value, str) and value.strip().lower() in {"fasting", "before_meal"}


def _is_after_meal_timing(value: Any) -> bool:
    return isinstance(value, str) and value.strip().lower() == "after_meal"


BasicReportRecordFields = tuple[str, dict[str, Any], datetime]


def build_basic_report_from_fields(
    profile_id: UUID,
    record_fields: Iterable[BasicReportRecordFields],
) -> ReportSummary:
    glucose_count = 0
    before_meal_glucose_count = 0
    after_meal_glucose_count = 0
    glucose_total = 0.0
    glucose_minimum: float | None = None
    glucose_maximum: float | None = None
    latest_glucose_value: float | None = None
    latest_glucose_recorded_at: datetime | None = None
    meal_count = 0
    exercise_count = 0
    medication_count = 0
    lifestyle_count = 0
    note_count = 0
    record_count = 0

    for record_type, payload, occurred_at in record_fields:
        record_count += 1
        if record_type == "glucose":
            value = _payload_number(payload, "value")
            if value is not None:
                glucose_count += 1
                if _is_before_meal_timing(payload.get("meal_timing")):
                    before_meal_glucose_count += 1
                if _is_after_meal_timing(payload.get("meal_timing")):
                    after_meal_glucose_count += 1
                glucose_total += value
                glucose_minimum = value if glucose_minimum is None else min(glucose_minimum, value)
                glucose_maximum = value if glucose_maximum is None else max(glucose_maximum, value)
                if latest_glucose_recorded_at is None or occurred_at > latest_glucose_recorded_at:
                    latest_glucose_value = value
                    latest_glucose_recorded_at = occurred_at
        elif record_type == "meal":
            meal_count += 1
        elif record_type == "exercise":
            exercise_count += 1
        elif record_type == "medication":
            medication_count += 1
        elif record_type == "lifestyle":
            lifestyle_count += 1
        elif record_type == "note":
            note_count += 1

    return ReportSummary(
        profile_id=profile_id,
        generated_at=datetime.now(UTC),
        record_count=record_count,
        glucose=GlucoseSummary(
            count=glucose_count,
            before_meal_count=before_meal_glucose_count,
            after_meal_count=after_meal_glucose_count,
            average=round(glucose_total / glucose_count, 1) if glucose_count else None,
            minimum=glucose_minimum,
            maximum=glucose_maximum,
            latest_value=latest_glucose_value,
            latest_recorded_at=latest_glucose_recorded_at,
        ),
        meals=MealSummary(count=meal_count),
        lifestyle=LifestyleSummary(
            exercise_count=exercise_count,
            medication_count=medication_count,
            lifestyle_count=lifestyle_count,
            note_count=note_count,
        ),
    )


def build_basic_report(profile_id: UUID, records: Iterable[Record]) -> ReportSummary:
    return build_basic_report_from_fields(
        profile_id,
        ((record.record_type, record.payload, record.occurred_at) for record in records),
    )
