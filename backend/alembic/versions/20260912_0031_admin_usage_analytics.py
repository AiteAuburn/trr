"""add compact daily admin usage analytics

Revision ID: 20260912_0031
Revises: 20260430_0030
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260912_0031"
down_revision: str | None = "20260430_0030"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None
migration_phase = "expand"
rollback_compatible = True


def upgrade() -> None:
    op.create_table(
        "api_usage_daily",
        sa.Column("bucket_date", sa.Date(), nullable=False),
        sa.Column("method", sa.String(length=8), nullable=False),
        sa.Column("route", sa.String(length=160), nullable=False),
        sa.Column("status_class", sa.SmallInteger(), nullable=False),
        sa.Column("request_count", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("duration_micros_total", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("duration_micros_max", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint(
            "bucket_date", "method", "route", "status_class", name="pk_api_usage_daily"
        ),
        sa.CheckConstraint("status_class BETWEEN 1 AND 5", name="ck_api_usage_status_class"),
        sa.CheckConstraint("request_count >= 0", name="ck_api_usage_request_count"),
        sa.CheckConstraint("duration_micros_total >= 0", name="ck_api_usage_duration_total"),
        sa.CheckConstraint("duration_micros_max >= 0", name="ck_api_usage_duration_max"),
    )
    op.create_table(
        "ai_token_usage_daily",
        sa.Column("bucket_date", sa.Date(), nullable=False),
        sa.Column("provider", sa.String(length=32), nullable=False),
        sa.Column("model_id", sa.String(length=120), nullable=False),
        sa.Column("request_count", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("success_count", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("failure_count", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("usage_reported_count", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("input_tokens", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("output_tokens", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("total_tokens", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint(
            "bucket_date", "provider", "model_id", name="pk_ai_token_usage_daily"
        ),
        sa.CheckConstraint("request_count >= 0", name="ck_ai_usage_request_count"),
        sa.CheckConstraint("success_count >= 0", name="ck_ai_usage_success_count"),
        sa.CheckConstraint("failure_count >= 0", name="ck_ai_usage_failure_count"),
        sa.CheckConstraint("usage_reported_count >= 0", name="ck_ai_usage_reported_count"),
        sa.CheckConstraint("input_tokens >= 0", name="ck_ai_usage_input_tokens"),
        sa.CheckConstraint("output_tokens >= 0", name="ck_ai_usage_output_tokens"),
        sa.CheckConstraint("total_tokens >= 0", name="ck_ai_usage_total_tokens"),
    )


def downgrade() -> None:
    op.drop_table("ai_token_usage_daily")
    op.drop_table("api_usage_daily")
