from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class RateLimitCounter(Base):
    __tablename__ = "rate_limit_counters"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    scope: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    key_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    window_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    window_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "scope",
            "key_hash",
            "window_start",
            name="uq_rate_limit_scope_key_window",
        ),
    )
