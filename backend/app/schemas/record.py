from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.services.record_validation import RecordType


class RecordCreate(BaseModel):
    profile_id: UUID
    record_type: RecordType
    occurred_at: datetime
    payload_json: dict[str, Any] = Field(min_length=1)
    metadata_json: dict[str, Any] = Field(default_factory=dict)
    source: str = Field(default="manual", min_length=1, max_length=80)


class RecordUpdate(BaseModel):
    occurred_at: datetime | None = None
    payload_json: dict[str, Any] | None = Field(default=None, min_length=1)
    metadata_json: dict[str, Any] | None = None
    source: str | None = Field(default=None, min_length=1, max_length=80)


class RecordRead(BaseModel):
    id: UUID
    profile_id: UUID
    record_type: RecordType
    occurred_at: datetime
    payload_json: dict[str, Any]
    metadata_json: dict[str, Any]
    source: str
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    model_config = {"from_attributes": True}
