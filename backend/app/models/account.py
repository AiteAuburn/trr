from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship as orm_relationship

from app.db.base import Base


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    profiles = orm_relationship("UserProfile", back_populates="account")
    auth_sessions = orm_relationship("AuthSession")
    subscriptions = orm_relationship("Subscription")
    usage_counters = orm_relationship("UsageCounter")
