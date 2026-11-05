from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import BigInteger, DateTime, Index, Integer, SmallInteger, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class OperationalEvent(Base):
    """Minute-bucketed, PHI-free operational events for the admin live view."""

    __tablename__ = "operational_events"
    __table_args__ = (
        Index("ix_operational_events_last_seen", "last_seen_at"),
    )

    bucket_minute: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True)
    fingerprint: Mapped[str] = mapped_column(String(64), primary_key=True)
    id: Mapped[UUID] = mapped_column(default=uuid4, nullable=False, unique=True)
    event_code: Mapped[str] = mapped_column(String(80), nullable=False)
    source: Mapped[str] = mapped_column(String(80), nullable=False)
    severity: Mapped[str] = mapped_column(String(16), nullable=False)
    provider: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    model_id: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    route: Mapped[str] = mapped_column(String(160), nullable=False, default="")
    method: Mapped[str] = mapped_column(String(8), nullable=False, default="")
    http_status: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    error_type: Mapped[str] = mapped_column(String(80), nullable=False, default="")
    batch_number: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    duration_ms_max: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    latest_request_id: Mapped[str] = mapped_column(String(80), nullable=False, default="")
    event_count: Mapped[int] = mapped_column(BigInteger, nullable=False, default=1)
    first_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
