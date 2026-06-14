from datetime import datetime

from pydantic import BaseModel, Field


class VoiceQuotaRead(BaseModel):
    plan_code: str = Field(min_length=1, max_length=80)
    status: str = Field(min_length=1, max_length=40)
    trial_started_at: datetime | None = None
    trial_ends_at: datetime | None = None
    referral_code: str | None = Field(default=None, max_length=80)
    preserves_intro_price: bool
    daily_limit_seconds: int = Field(ge=0, le=3600)
    used_seconds_today: int = Field(ge=0, le=3600)
    remaining_seconds_today: int = Field(ge=0, le=3600)
