"""Retired achievements table mirror.

The achievements feature was removed from the MVP. The table is kept (and mapped
here) only for migration compatibility: the API migration policy allows expand-only
migrations, so the table cannot be dropped, and keeping it in the ORM metadata stops
Alembic autogenerate from proposing a destructive drop. Do not add new readers or
writers.
"""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AchievementUnlock(Base):
    __tablename__ = "achievement_unlocks"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    profile_id: Mapped[UUID] = mapped_column(
        ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    achievement_id: Mapped[str] = mapped_column(String(80), nullable=False)
    category: Mapped[str] = mapped_column(String(40), nullable=False)
    kind: Mapped[str] = mapped_column(String(40), nullable=False)
    level: Mapped[int] = mapped_column(Integer, nullable=False)
    unlocked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        UniqueConstraint("profile_id", "achievement_id", name="uq_achievement_unlock_profile_achievement"),
    )
