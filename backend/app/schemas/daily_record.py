from datetime import date, datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.record import RecordCreate, RecordRead


class DailyTranscriptEntry(BaseModel):
    id: str = Field(min_length=1, max_length=120)
    occurred_at: datetime
    source_text: str = Field(min_length=1, max_length=4000)
    source: Literal["voice", "text"]


class DailyRecordSaveRequest(BaseModel):
    profile_id: UUID
    record_date: date
    summary_text: str = Field(default="", max_length=1000)
    records: list[RecordCreate] = Field(default_factory=list, max_length=100)
    transcript_entries: list[DailyTranscriptEntry] = Field(default_factory=list, max_length=100)
    source: str = Field(default="ai_confirmation", min_length=1, max_length=80)


class DailyRecordRead(BaseModel):
    id: UUID
    profile_id: UUID
    record_date: date
    summary_text: str
    record_ids: list[str]
    preview_records_json: list[dict[str, Any]]
    transcript_entries_json: list[dict[str, Any]]
    source: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DailyRecordSaveResponse(BaseModel):
    daily_record: DailyRecordRead
    records: list[RecordRead]
