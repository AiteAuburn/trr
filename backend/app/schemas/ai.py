from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.services.record_validation import RecordType

AI_MODEL_DESCRIPTION_MAX_LENGTH = 360
AI_MODEL_ID_MAX_LENGTH = 120
AI_MODEL_LABEL_MAX_LENGTH = 120
AI_MODEL_OPTIONS_MAX_COUNT = 32
COMMAND_ACTION_MAX_LENGTH = 120
COMMAND_ACTION_TYPE_MAX_LENGTH = 80
COMMAND_ACTIONS_MAX_COUNT = 12
COMMAND_DECISION_TRACE_MAX_LENGTH = 240
COMMAND_PAYLOAD_MAX_KEYS = 32
COMMAND_UI_MESSAGE_MAX_LENGTH = 240
COMMAND_UI_TARGET_MAX_LENGTH = 80
PARSE_PREVIEW_DECISION_TRACE_MAX_LENGTH = 240
PARSE_PREVIEW_RECORDS_MAX_COUNT = 90
PARSE_PREVIEW_REJECTED_EVENTS_MAX_COUNT = 120
PARSE_PREVIEW_SEGMENT_ID_MAX_LENGTH = 64
PARSE_PREVIEW_SEGMENTS_MAX_COUNT = 30
PARSE_PREVIEW_SOURCE_MAX_LENGTH = 80
PARSE_PREVIEW_TEXT_MAX_LENGTH = 4000
PARSE_PREVIEW_TOP_LEVEL_JSON_MAX_KEYS = 32


class AiModelOption(BaseModel):
    id: str = Field(min_length=1, max_length=AI_MODEL_ID_MAX_LENGTH)
    label: str = Field(min_length=1, max_length=AI_MODEL_LABEL_MAX_LENGTH)
    kind: Literal["stt", "llm"]
    runtime: Literal["browser", "local", "server_stub", "cloud_disabled"]
    available: bool
    description: str = Field(max_length=AI_MODEL_DESCRIPTION_MAX_LENGTH)


class AiModelOptionsResponse(BaseModel):
    stt_models: list[AiModelOption] = Field(max_length=AI_MODEL_OPTIONS_MAX_COUNT)
    llm_models: list[AiModelOption] = Field(max_length=AI_MODEL_OPTIONS_MAX_COUNT)


class ParsePreviewRequest(BaseModel):
    profile_id: UUID
    transcript: str = Field(min_length=1, max_length=4000)
    stt_model_id: str = Field(default="browser-web-speech", min_length=1, max_length=120)
    llm_model_id: str = Field(default="local-llm-schema-stub", min_length=1, max_length=120)
    occurred_at: datetime | None = None
    voice_seconds: int = Field(default=0, ge=0, le=3600)

    @field_validator("transcript")
    @classmethod
    def normalize_transcript(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("transcript must not be blank")
        return normalized


class ParsedRecordPreview(BaseModel):
    profile_id: UUID
    record_type: RecordType
    occurred_at: datetime
    payload_json: dict[str, Any] = Field(max_length=PARSE_PREVIEW_TOP_LEVEL_JSON_MAX_KEYS)
    metadata_json: dict[str, Any] = Field(
        default_factory=dict, max_length=PARSE_PREVIEW_TOP_LEVEL_JSON_MAX_KEYS
    )
    source: str = Field(min_length=1, max_length=PARSE_PREVIEW_SOURCE_MAX_LENGTH)
    confidence: float = Field(ge=0, le=1)
    decision_trace: str = Field(min_length=1, max_length=PARSE_PREVIEW_DECISION_TRACE_MAX_LENGTH)
    needs_confirmation: bool = True


SegmentType = Literal[
    "measurement",
    "meal",
    "exercise",
    "medication",
    "vital",
    "body_measurement",
    "lab_result",
    "lifestyle",
    "note",
    "negative_event",
    "unknown",
]

Certainty = Literal["certain", "uncertain"]


class TranscriptSegment(BaseModel):
    segment_id: str = Field(min_length=1, max_length=PARSE_PREVIEW_SEGMENT_ID_MAX_LENGTH)
    segment_type: SegmentType
    source_text: str = Field(min_length=1, max_length=PARSE_PREVIEW_TEXT_MAX_LENGTH)
    normalized_text: str = Field(min_length=1, max_length=PARSE_PREVIEW_TEXT_MAX_LENGTH)
    time_hint: str | None = Field(default=None, max_length=PARSE_PREVIEW_SOURCE_MAX_LENGTH)
    certainty: Certainty = "certain"
    is_negative_event: bool = False
    confidence: float = Field(ge=0, le=1)


class RejectedEvent(BaseModel):
    segment_id: str = Field(min_length=1, max_length=PARSE_PREVIEW_SEGMENT_ID_MAX_LENGTH)
    source_text: str = Field(max_length=PARSE_PREVIEW_TEXT_MAX_LENGTH)
    reason: str = Field(min_length=1, max_length=PARSE_PREVIEW_DECISION_TRACE_MAX_LENGTH)
    time_hint: str | None = Field(default=None, max_length=PARSE_PREVIEW_SOURCE_MAX_LENGTH)


class ParsePreviewResponse(BaseModel):
    transcript: str = Field(max_length=PARSE_PREVIEW_TEXT_MAX_LENGTH)
    normalized_text: str = Field(max_length=PARSE_PREVIEW_TEXT_MAX_LENGTH)
    stt_model_id: str
    llm_model_id: str
    segments: list[TranscriptSegment] = Field(max_length=PARSE_PREVIEW_SEGMENTS_MAX_COUNT)
    records: list[ParsedRecordPreview] = Field(max_length=PARSE_PREVIEW_RECORDS_MAX_COUNT)
    rejected_events: list[RejectedEvent] = Field(
        default_factory=list, max_length=PARSE_PREVIEW_REJECTED_EVENTS_MAX_COUNT
    )


CommandIntent = Literal[
    "NAVIGATE",
    "CREATE_RECORD",
    "QUERY_DATA",
    "GENERATE_REPORT",
    "SWITCH_PROFILE",
    "SET_REMINDER",
    "UNKNOWN",
]


class UiResponse(BaseModel):
    type: Literal["navigate", "confirmation", "report", "message"]
    message: str = Field(min_length=1, max_length=COMMAND_UI_MESSAGE_MAX_LENGTH)
    target: str | None = Field(default=None, max_length=COMMAND_UI_TARGET_MAX_LENGTH)


class CommandProposalRequest(BaseModel):
    profile_id: UUID
    transcript: str = Field(min_length=1, max_length=4000)
    stt_model_id: str = Field(default="browser-web-speech", min_length=1, max_length=120)
    llm_model_id: str = Field(default="local-llm-schema-stub", min_length=1, max_length=120)
    occurred_at: datetime | None = None
    voice_seconds: int = Field(default=0, ge=0, le=3600)

    @field_validator("transcript")
    @classmethod
    def normalize_transcript(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("transcript must not be blank")
        return normalized


class ProposedAction(BaseModel):
    action_type: str = Field(min_length=1, max_length=COMMAND_ACTION_TYPE_MAX_LENGTH)
    record_type: RecordType | None = None
    payload: dict[str, Any] = Field(default_factory=dict, max_length=COMMAND_PAYLOAD_MAX_KEYS)
    metadata_json: dict[str, Any] = Field(default_factory=dict, max_length=COMMAND_PAYLOAD_MAX_KEYS)


class ActionProposal(BaseModel):
    intent: CommandIntent
    action: str = Field(min_length=1, max_length=COMMAND_ACTION_MAX_LENGTH)
    actions: list[ProposedAction] = Field(default_factory=list, max_length=COMMAND_ACTIONS_MAX_COUNT)
    payload: dict[str, Any] = Field(max_length=COMMAND_PAYLOAD_MAX_KEYS)
    requires_confirmation: bool
    confidence: float = Field(ge=0, le=1)
    decision_trace: str = Field(min_length=1, max_length=COMMAND_DECISION_TRACE_MAX_LENGTH)
    ui_response: UiResponse


class CommandProposalResponse(BaseModel):
    transcript: str
    stt_model_id: str
    llm_model_id: str
    proposal: ActionProposal
