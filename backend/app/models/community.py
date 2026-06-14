from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class FoodItem(Base):
    __tablename__ = "food_items"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    category: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    normalized_name: Mapped[str] = mapped_column(String(120), nullable=False)
    created_by_account_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    shares = relationship("FoodShare", back_populates="food_item")

    __table_args__ = (
        UniqueConstraint("category", "normalized_name", name="uq_food_item_category_normalized_name"),
    )


class FoodShare(Base):
    __tablename__ = "food_shares"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    food_item_id: Mapped[UUID] = mapped_column(
        ForeignKey("food_items.id", ondelete="CASCADE"), nullable=False, index=True
    )
    account_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    eaten_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    before_glucose: Mapped[int] = mapped_column(Integer, nullable=False)
    after_glucose: Mapped[int] = mapped_column(Integer, nullable=False)
    glucose_delta: Mapped[int] = mapped_column(Integer, nullable=False)
    serving_description: Mapped[str | None] = mapped_column(String(160), nullable=True)
    public_note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    food_item = relationship("FoodItem", back_populates="shares")


class CommunityPointLedger(Base):
    __tablename__ = "community_point_ledger"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    account_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    delta: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(80), nullable=False)
    source_type: Mapped[str] = mapped_column(String(80), nullable=False)
    source_id: Mapped[UUID | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class CommunityPublicProfile(Base):
    __tablename__ = "community_public_profiles"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    account_id: Mapped[UUID] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    leaderboard_opt_in: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class StoreRedemption(Base):
    __tablename__ = "store_redemptions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    account_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    reward_code: Mapped[str] = mapped_column(String(80), nullable=False)
    points_cost: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="reserved")
    fulfillment_type: Mapped[str | None] = mapped_column(String(40), nullable=True)
    fulfillment_code: Mapped[str | None] = mapped_column(String(120), nullable=True)
    fulfilled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
