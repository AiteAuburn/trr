from datetime import date, datetime

from sqlalchemy import BigInteger, Date, DateTime, SmallInteger, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ApiUsageDaily(Base):
    __tablename__ = "api_usage_daily"

    bucket_date: Mapped[date] = mapped_column(Date, primary_key=True)
    method: Mapped[str] = mapped_column(String(8), primary_key=True)
    route: Mapped[str] = mapped_column(String(160), primary_key=True)
    status_class: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    request_count: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    duration_micros_total: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    duration_micros_max: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class AiTokenUsageDaily(Base):
    __tablename__ = "ai_token_usage_daily"

    bucket_date: Mapped[date] = mapped_column(Date, primary_key=True)
    provider: Mapped[str] = mapped_column(String(32), primary_key=True)
    model_id: Mapped[str] = mapped_column(String(120), primary_key=True)
    request_count: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    success_count: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    failure_count: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    usage_reported_count: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    input_tokens: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    output_tokens: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    total_tokens: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
