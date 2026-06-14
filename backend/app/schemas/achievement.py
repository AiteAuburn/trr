from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

AchievementCategory = Literal["glucose", "meal", "exercise"]
AchievementKind = Literal["cumulative", "streak"]


class AchievementRead(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    category: AchievementCategory
    category_label: str = Field(min_length=1, max_length=40)
    kind: AchievementKind
    kind_label: str = Field(min_length=1, max_length=40)
    level: int = Field(ge=1, le=1_000_000)
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=240)
    icon: str = Field(min_length=1, max_length=8)
    badge_color: str = Field(min_length=1, max_length=20)
    progress: int = Field(ge=0, le=1_000_000)
    target: int = Field(ge=1, le=1_000_000)
    unlocked: bool
    unlocked_at: datetime | None = None
    newly_unlocked: bool = False


class AchievementSummaryRead(BaseModel):
    levels: list[int] = Field(max_length=20)
    unlocked_count: int = Field(ge=0, le=1_000_000)
    persisted_unlocked_count: int = Field(ge=0, le=1_000_000)
    newly_unlocked_count: int = Field(ge=0, le=1_000_000)
    next_remaining: int = Field(ge=0, le=1_000_000)
    items: list[AchievementRead] = Field(max_length=100)
