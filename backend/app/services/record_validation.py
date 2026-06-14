from collections.abc import Mapping
from typing import Any, Literal

from fastapi import HTTPException, status

RecordType = Literal[
    "glucose",
    "meal",
    "exercise",
    "medication",
    "vital",
    "body_measurement",
    "lab_result",
    "lifestyle",
    "note",
]

ALLOWED_RECORD_TYPES: set[str] = {
    "glucose",
    "meal",
    "exercise",
    "medication",
    "vital",
    "body_measurement",
    "lab_result",
    "lifestyle",
    "note",
}

MAX_MEAL_FOOD_ITEMS = 12
MAX_NOTE_TAGS = 12
MAX_RECORD_SHORT_TEXT_LENGTH = 120
ALLOWED_GLUCOSE_UNITS = {"mg/dL", "mmol/L"}
ALLOWED_GLUCOSE_MEAL_TIMINGS = {
    "fasting",
    "before_meal",
    "after_meal",
    "bedtime",
    "unknown",
}
ALLOWED_MEAL_TYPES = {"breakfast", "lunch", "dinner", "snack", "unknown"}
ALLOWED_BLOOD_PRESSURE_UNITS = {"mmHg"}
ALLOWED_BODY_MEASUREMENT_UNITS_BY_KIND = {
    "weight": {"kg"},
    "body_fat": {"%"},
}
MIN_GLUCOSE_VALUE = 20
MAX_GLUCOSE_VALUE = 600
MIN_EXERCISE_MINUTES = 0
MAX_EXERCISE_MINUTES = 1440
MIN_BLOOD_PRESSURE_SYSTOLIC = 40
MAX_BLOOD_PRESSURE_SYSTOLIC = 300
MIN_BLOOD_PRESSURE_DIASTOLIC = 20
MAX_BLOOD_PRESSURE_DIASTOLIC = 200
MIN_WEIGHT_KG = 1
MAX_WEIGHT_KG = 500
MIN_BODY_FAT_PERCENT = 0
MAX_BODY_FAT_PERCENT = 100


def _is_number(value: object) -> bool:
    return isinstance(value, int | float) and not isinstance(value, bool)


def _number_value(value: object) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int | float):
        return float(value)
    return None


def _require_number_in_range(
    value: object,
    *,
    minimum: float,
    maximum: float,
    detail: str,
) -> None:
    number = _number_value(value)
    if number is None or number < minimum or number > maximum:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=detail,
        )


def _require_short_text(value: object, *, detail: str) -> str:
    if not isinstance(value, str):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=detail,
        )
    text = value.strip()
    if not text or len(text) > MAX_RECORD_SHORT_TEXT_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=detail,
        )
    return text


def _require_allowed_text(
    value: object,
    *,
    allowed: set[str],
    detail: str,
) -> str:
    text = _require_short_text(value, detail=detail)
    if text not in allowed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=detail,
        )
    return text


def _require_keys(payload: Mapping[str, Any], keys: set[str], record_type: str) -> None:
    missing = sorted(key for key in keys if key not in payload)
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"{record_type} payload missing required keys: {', '.join(missing)}",
        )


def validate_record_payload(record_type: str, payload: Mapping[str, Any]) -> None:
    if record_type not in ALLOWED_RECORD_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Unsupported record_type: {record_type}",
        )

    if record_type == "glucose":
        _require_keys(payload, {"value", "unit"}, record_type)
        _require_allowed_text(
            payload["unit"],
            allowed=ALLOWED_GLUCOSE_UNITS,
            detail="glucose payload unit is invalid",
        )
        if "meal_timing" in payload and payload["meal_timing"] is not None:
            _require_allowed_text(
                payload["meal_timing"],
                allowed=ALLOWED_GLUCOSE_MEAL_TIMINGS,
                detail="glucose payload meal_timing is invalid",
            )
        _require_number_in_range(
            payload["value"],
            minimum=MIN_GLUCOSE_VALUE,
            maximum=MAX_GLUCOSE_VALUE,
            detail="glucose payload value out of range",
        )
        return

    if record_type == "meal":
        _require_keys(payload, {"food_items"}, record_type)
        if "food_items" in payload and not isinstance(payload["food_items"], list):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="meal payload food_items must be a list",
            )
        if len(payload["food_items"]) > MAX_MEAL_FOOD_ITEMS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="meal payload food_items exceeds maximum",
            )
        for food_item in payload["food_items"]:
            if not isinstance(food_item, Mapping):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail="meal payload food_items must contain objects",
                )
            _require_short_text(
                food_item.get("name"),
                detail="meal payload food_items name is required",
            )
            if "amount" in food_item and food_item["amount"] is not None:
                _require_short_text(
                    food_item["amount"],
                    detail="meal payload food_items amount is invalid",
                )
        if "meal_type" in payload and payload["meal_type"] is not None:
            _require_allowed_text(
                payload["meal_type"],
                allowed=ALLOWED_MEAL_TYPES,
                detail="meal payload meal_type is invalid",
            )
        return

    if record_type == "exercise":
        _require_keys(payload, {"activity"}, record_type)
        _require_short_text(payload["activity"], detail="exercise payload activity is required")
        if "minutes" in payload and payload["minutes"] is not None:
            _require_number_in_range(
                payload["minutes"],
                minimum=MIN_EXERCISE_MINUTES,
                maximum=MAX_EXERCISE_MINUTES,
                detail="exercise payload minutes out of range",
            )
        return

    if record_type == "medication":
        _require_keys(payload, {"name"}, record_type)
        _require_short_text(payload["name"], detail="medication payload name is required")
        return

    if record_type == "vital":
        _require_keys(payload, {"kind"}, record_type)
        _require_short_text(payload["kind"], detail="vital payload kind is required")
        if payload["kind"] == "blood_pressure":
            _require_keys(payload, {"systolic", "diastolic", "unit"}, record_type)
            _require_allowed_text(
                payload["unit"],
                allowed=ALLOWED_BLOOD_PRESSURE_UNITS,
                detail="vital payload unit is invalid",
            )
            _require_number_in_range(
                payload["systolic"],
                minimum=MIN_BLOOD_PRESSURE_SYSTOLIC,
                maximum=MAX_BLOOD_PRESSURE_SYSTOLIC,
                detail="vital payload systolic out of range",
            )
            _require_number_in_range(
                payload["diastolic"],
                minimum=MIN_BLOOD_PRESSURE_DIASTOLIC,
                maximum=MAX_BLOOD_PRESSURE_DIASTOLIC,
                detail="vital payload diastolic out of range",
            )
        return

    if record_type == "body_measurement":
        _require_keys(payload, {"kind", "value", "unit"}, record_type)
        kind = _require_allowed_text(
            payload["kind"],
            allowed=set(ALLOWED_BODY_MEASUREMENT_UNITS_BY_KIND),
            detail="body_measurement payload kind is invalid",
        )
        _require_allowed_text(
            payload["unit"],
            allowed=ALLOWED_BODY_MEASUREMENT_UNITS_BY_KIND[kind],
            detail="body_measurement payload unit is invalid",
        )
        if kind == "body_fat":
            _require_number_in_range(
                payload["value"],
                minimum=MIN_BODY_FAT_PERCENT,
                maximum=MAX_BODY_FAT_PERCENT,
                detail="body_measurement payload value out of range",
            )
        else:
            _require_number_in_range(
                payload["value"],
                minimum=MIN_WEIGHT_KG,
                maximum=MAX_WEIGHT_KG,
                detail="body_measurement payload value out of range",
            )
        return

    if record_type == "lab_result":
        _require_keys(payload, {"name"}, record_type)
        _require_short_text(payload["name"], detail="lab_result payload name is required")
        if "unit" in payload and payload["unit"] is not None:
            _require_short_text(payload["unit"], detail="lab_result payload unit is invalid")
        return

    if record_type == "lifestyle":
        _require_keys(payload, {"kind"}, record_type)
        _require_short_text(payload["kind"], detail="lifestyle payload kind is required")
        return

    if record_type == "note":
        if "kind" not in payload and "tags" not in payload:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="note payload requires kind or tags",
            )
        if "tags" in payload and not isinstance(payload["tags"], list):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="note payload tags must be a list",
            )
        if "tags" in payload and len(payload["tags"]) > MAX_NOTE_TAGS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="note payload tags exceeds maximum",
            )
        if "kind" in payload and payload["kind"] is not None:
            _require_short_text(payload["kind"], detail="note payload kind is required")
        if "tags" in payload:
            for tag in payload["tags"]:
                _require_short_text(tag, detail="note payload tags must be non-empty strings")
