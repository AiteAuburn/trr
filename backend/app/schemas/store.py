from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

StoreRewardCategory = Literal[
    "coupons",
    "supplement_discounts",
    "partner_products",
    "member_benefits",
    "special_badges",
]


class StoreRewardRead(BaseModel):
    code: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=120)
    category: StoreRewardCategory
    points_cost: int = Field(ge=1, le=1_000_000)
    status: Literal["preview", "redeemable"]


class PointsBalanceRead(BaseModel):
    balance: int = Field(ge=0, le=1_000_000)
    lifetime_earned: int = Field(ge=0, le=1_000_000)
    lifetime_redeemed: int = Field(ge=0, le=1_000_000)


class StoreRedemptionCreate(BaseModel):
    reward_code: str = Field(min_length=1, max_length=80)

    @field_validator("reward_code", mode="before")
    @classmethod
    def normalize_reward_code(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        return value.strip()


class StoreRedemptionRead(BaseModel):
    id: UUID
    reward_code: str = Field(min_length=1, max_length=80)
    points_cost: int = Field(ge=1, le=1_000_000)
    status: str = Field(min_length=1, max_length=40)
    fulfillment_type: str | None = Field(default=None, max_length=40)
    fulfillment_code: str | None = Field(default=None, max_length=120)
    fulfilled_at: datetime | None = None
    used_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
