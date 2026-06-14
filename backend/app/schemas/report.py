from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.services.record_validation import MAX_GLUCOSE_VALUE, MIN_GLUCOSE_VALUE

MAX_BASIC_REPORT_RECORDS = 5000


class GlucoseSummary(BaseModel):
    count: int = Field(ge=0, le=MAX_BASIC_REPORT_RECORDS)
    before_meal_count: int = Field(ge=0, le=MAX_BASIC_REPORT_RECORDS)
    after_meal_count: int = Field(ge=0, le=MAX_BASIC_REPORT_RECORDS)
    average: float | None = Field(default=None, ge=MIN_GLUCOSE_VALUE, le=MAX_GLUCOSE_VALUE)
    minimum: float | None = Field(default=None, ge=MIN_GLUCOSE_VALUE, le=MAX_GLUCOSE_VALUE)
    maximum: float | None = Field(default=None, ge=MIN_GLUCOSE_VALUE, le=MAX_GLUCOSE_VALUE)
    latest_value: float | None = Field(default=None, ge=MIN_GLUCOSE_VALUE, le=MAX_GLUCOSE_VALUE)
    latest_recorded_at: datetime | None


class MealSummary(BaseModel):
    count: int = Field(ge=0, le=MAX_BASIC_REPORT_RECORDS)


class LifestyleSummary(BaseModel):
    exercise_count: int = Field(ge=0, le=MAX_BASIC_REPORT_RECORDS)
    medication_count: int = Field(ge=0, le=MAX_BASIC_REPORT_RECORDS)
    lifestyle_count: int = Field(ge=0, le=MAX_BASIC_REPORT_RECORDS)
    note_count: int = Field(ge=0, le=MAX_BASIC_REPORT_RECORDS)


class ReportSummary(BaseModel):
    profile_id: UUID
    generated_at: datetime
    record_count: int = Field(ge=0, le=MAX_BASIC_REPORT_RECORDS)
    glucose: GlucoseSummary
    meals: MealSummary
    lifestyle: LifestyleSummary
