from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status

MAX_RECORD_FUTURE_SKEW = timedelta(minutes=5)


def validate_record_occurred_at(occurred_at: datetime | None, *, field_name: str = "occurred_at") -> None:
    if occurred_at is None:
        return
    validate_timezone_aware_datetime(occurred_at, field_name=field_name)
    if occurred_at > datetime.now(UTC) + MAX_RECORD_FUTURE_SKEW:
        raise_invalid_record_occurred_at(f"{field_name} must not be in the future.")


def validate_timezone_aware_datetime(value: datetime | None, *, field_name: str) -> None:
    if value is None:
        return
    if value.tzinfo is None or value.utcoffset() is None:
        raise_invalid_datetime(field_name, "datetime must include a timezone.")


def raise_invalid_datetime(field_name: str, message: str) -> None:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={
            "code": "invalid_datetime",
            "field": field_name,
            "message": message,
        },
    )


def raise_invalid_record_occurred_at(message: str) -> None:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={
            "code": "invalid_record_time",
            "message": message,
        },
    )
