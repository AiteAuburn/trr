from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class YearReviewMetric(BaseModel):
    key: str = Field(min_length=1, max_length=80)
    label: str = Field(min_length=1, max_length=80)
    value: int | float | str


class YearReviewObservation(BaseModel):
    kind: Literal["important_observation", "encouragement"]
    text: str = Field(min_length=1, max_length=500)


class YearReviewRead(BaseModel):
    snapshot_id: UUID | None = None
    year: int = Field(ge=2000, le=2100)
    generated_for_previous_year: bool
    generated_at: datetime | None = None
    source: Literal["snapshot", "generated"]
    annual_stats: list[YearReviewMetric] = Field(min_length=7, max_length=7)
    health_outcomes: list[YearReviewMetric] = Field(min_length=3, max_length=3)
    ai_summary: list[YearReviewObservation] = Field(min_length=2, max_length=2)


class YearReviewShareCardRead(BaseModel):
    snapshot_id: UUID
    year: int = Field(ge=2000, le=2100)
    title: str = Field(min_length=1, max_length=120)
    subtitle: str = Field(min_length=1, max_length=160)
    privacy_level: Literal["public_summary"]
    privacy_mask_applied: bool
    external_share_enabled: bool
    metrics: list[YearReviewMetric] = Field(min_length=3, max_length=4)
    share_text: str = Field(min_length=1, max_length=280)
    card_style: str = Field(min_length=1, max_length=40)


class YearReviewShareAssetRead(BaseModel):
    snapshot_id: UUID
    year: int = Field(ge=2000, le=2100)
    asset_kind: Literal["svg_card"]
    mime_type: Literal["image/svg+xml"]
    filename: str = Field(min_length=1, max_length=120)
    alt_text: str = Field(min_length=1, max_length=240)
    privacy_level: Literal["public_summary"]
    privacy_mask_applied: bool
    external_share_enabled: bool
    svg_text: str = Field(min_length=1, max_length=20_000)
    checksum_sha256: str = Field(min_length=64, max_length=64)


class YearReviewShareConfirmCreate(BaseModel):
    privacy_acknowledged: bool


class YearReviewShareResultCreate(BaseModel):
    share_result: Literal["opened", "dismissed"]


class YearReviewSharePackageRead(BaseModel):
    share_package_id: UUID
    snapshot_id: UUID
    year: int = Field(ge=2000, le=2100)
    privacy_level: Literal["public_summary"]
    privacy_mask_applied: bool
    external_share_enabled: bool
    status: Literal["confirmed", "opened", "dismissed", "revoked"]
    confirmed_at: datetime
    shared_at: datetime | None = None
    revoked_at: datetime | None = None
    share_text: str = Field(min_length=1, max_length=280)
    asset: YearReviewShareAssetRead
