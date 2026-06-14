from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class YearReviewSnapshot(Base):
    __tablename__ = "year_review_snapshots"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    profile_id: Mapped[UUID] = mapped_column(
        ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    summary_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    __table_args__ = (
        UniqueConstraint("profile_id", "year", name="uq_year_review_snapshot_profile_year"),
    )


class YearReviewSharePackage(Base):
    __tablename__ = "year_review_share_packages"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    snapshot_id: Mapped[UUID] = mapped_column(
        ForeignKey("year_review_snapshots.id", ondelete="CASCADE"), nullable=False, index=True
    )
    profile_id: Mapped[UUID] = mapped_column(
        ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    privacy_level: Mapped[str] = mapped_column(String(40), nullable=False)
    asset_kind: Mapped[str] = mapped_column(String(40), nullable=False)
    asset_checksum_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    share_text: Mapped[str] = mapped_column(String(280), nullable=False)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="confirmed")
    last_share_result: Mapped[str | None] = mapped_column(String(40), nullable=True)
    confirmed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    shared_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
