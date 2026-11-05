"""add compact operational events for admin live log view

Revision ID: 20260926_0033
Revises: 20260926_0032
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260926_0033"
down_revision: str | None = "20260926_0032"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None
migration_phase = "expand"
rollback_compatible = True


def upgrade() -> None:
    op.create_index(
        "ix_audit_logs_action_created_at", "audit_logs", ["action", "created_at"]
    )
    op.create_table(
        "operational_events",
        sa.Column("bucket_minute", sa.DateTime(timezone=True), nullable=False),
        sa.Column("fingerprint", sa.String(length=64), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False, unique=True),
        sa.Column("event_code", sa.String(length=80), nullable=False),
        sa.Column("source", sa.String(length=80), nullable=False),
        sa.Column("severity", sa.String(length=16), nullable=False),
        sa.Column("provider", sa.String(length=32), server_default="", nullable=False),
        sa.Column("model_id", sa.String(length=120), server_default="", nullable=False),
        sa.Column("route", sa.String(length=160), server_default="", nullable=False),
        sa.Column("method", sa.String(length=8), server_default="", nullable=False),
        sa.Column("http_status", sa.SmallInteger(), server_default="0", nullable=False),
        sa.Column("error_type", sa.String(length=80), server_default="", nullable=False),
        sa.Column("batch_number", sa.SmallInteger(), server_default="0", nullable=False),
        sa.Column("duration_ms_max", sa.Integer(), server_default="0", nullable=False),
        sa.Column("latest_request_id", sa.String(length=80), server_default="", nullable=False),
        sa.Column("event_count", sa.BigInteger(), server_default="1", nullable=False),
        sa.Column("first_seen_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("bucket_minute", "fingerprint", name="pk_operational_events"),
        sa.CheckConstraint("severity IN ('WARNING', 'ERROR', 'CRITICAL')", name="ck_operational_events_severity"),
        sa.CheckConstraint("event_count > 0", name="ck_operational_events_count"),
    )
    op.create_index("ix_operational_events_last_seen", "operational_events", ["last_seen_at"])


def downgrade() -> None:
    op.drop_index("ix_operational_events_last_seen", table_name="operational_events")
    op.drop_table("operational_events")
    op.drop_index("ix_audit_logs_action_created_at", table_name="audit_logs")
