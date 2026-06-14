from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

FoodCategory = Literal[
    "vegetables",
    "meat",
    "seafood",
    "eggs",
    "beans",
    "starches",
    "drinks",
    "fruit",
    "snacks",
    "supplements",
]

FOOD_CATEGORY_LABELS: dict[FoodCategory, str] = {
    "vegetables": "蔬菜",
    "meat": "肉類",
    "seafood": "海鮮",
    "eggs": "蛋類",
    "beans": "豆類",
    "starches": "澱粉類",
    "drinks": "飲料",
    "fruit": "水果",
    "snacks": "零食",
    "supplements": "保健食品",
}


class FoodCategoryRead(BaseModel):
    code: FoodCategory
    label: str = Field(min_length=1, max_length=20)


class FoodShareCreate(BaseModel):
    food_name: str = Field(max_length=120)
    category: FoodCategory
    eaten_at: datetime
    before_glucose: int = Field(ge=20, le=600)
    after_glucose: int = Field(ge=20, le=600)
    serving_description: str | None = Field(default=None, max_length=160)
    public_note: str | None = Field(default=None, max_length=500)

    @field_validator("food_name", mode="before")
    @classmethod
    def normalize_food_name(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        return value.strip()

    @field_validator("serving_description", "public_note", mode="before")
    @classmethod
    def normalize_optional_text(cls, value: object) -> object:
        if value is None or not isinstance(value, str):
            return value
        normalized = value.strip()
        return normalized or None


class FoodShareRead(BaseModel):
    id: UUID
    eaten_at: datetime
    before_glucose: int = Field(ge=20, le=600)
    after_glucose: int = Field(ge=20, le=600)
    glucose_delta: int = Field(ge=-580, le=580)
    serving_description: str | None = Field(default=None, max_length=160)
    public_note: str | None = Field(default=None, max_length=500)
    created_at: datetime

    model_config = {"from_attributes": True}


class FoodStatsRead(BaseModel):
    share_count: int = Field(ge=0, le=1_000_000)
    average_glucose_delta: float | None = Field(default=None, ge=-580, le=580)
    max_glucose_delta: int | None = Field(default=None, ge=-580, le=580)
    min_glucose_delta: int | None = Field(default=None, ge=-580, le=580)


class FoodItemRead(BaseModel):
    id: UUID
    name: str = Field(min_length=1, max_length=120)
    category: FoodCategory
    category_label: str = Field(min_length=1, max_length=20)
    stats: FoodStatsRead


class FoodItemDetailRead(FoodItemRead):
    shares: list[FoodShareRead] = Field(max_length=50)


class FoodShareCreateResponse(BaseModel):
    food: FoodItemDetailRead
    share: FoodShareRead
    awarded_points: int = Field(ge=0, le=10_000)


LeaderboardType = Literal["share_count", "contribution", "food_tester"]


class CommunityLeaderboardEntry(BaseModel):
    account_id: UUID | None
    display_name: str = Field(min_length=1, max_length=120)
    score: int = Field(ge=0, le=1_000_000)


class CommunityLeaderboardRead(BaseModel):
    leaderboard_type: LeaderboardType
    entries: list[CommunityLeaderboardEntry] = Field(max_length=50)


class CommunityPublicSettingsRead(BaseModel):
    display_name: str = Field(min_length=1, max_length=120)
    leaderboard_opt_in: bool


class CommunityPublicSettingsUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=120)
    leaderboard_opt_in: bool | None = None
