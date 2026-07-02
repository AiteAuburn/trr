from datetime import date, datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import Date, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship as orm_relationship

from app.db.base import Base


class DailyRecord(Base):
    __tablename__ = "daily_records"
    __table_args__ = (
        UniqueConstraint("profile_id", "record_date", name="uq_daily_records_profile_date"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    profile_id: Mapped[UUID] = mapped_column(ForeignKey("user_profiles.id", ondelete="CASCADE"))
    record_date: Mapped[date] = mapped_column(Date, nullable=False)
    summary_text: Mapped[str] = mapped_column(String(1000), default="", nullable=False)
    record_ids: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)
    preview_records_json: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, default=list, nullable=False)
    transcript_entries_json: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, default=list, nullable=False)
    source: Mapped[str] = mapped_column(String(80), default="ai_confirmation", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    profile = orm_relationship("UserProfile", back_populates="daily_records")
