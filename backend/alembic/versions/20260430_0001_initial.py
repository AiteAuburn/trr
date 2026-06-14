"""initial schema

Revision ID: 20260430_0001
Revises:
Create Date: 2026-04-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260430_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "accounts",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("email", sa.String(length=320), nullable=False, unique=True),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "user_profiles",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column("relationship", sa.String(length=80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_user_profiles_account_id", "user_profiles", ["account_id"])
    op.create_table(
        "records",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("profile_id", sa.Uuid(), nullable=False),
        sa.Column("record_type", sa.String(length=80), nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("source", sa.String(length=80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["profile_id"], ["user_profiles.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_records_profile_id", "records", ["profile_id"])
    op.create_index("ix_records_record_type", "records", ["record_type"])
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("actor_account_id", sa.Uuid(), nullable=True),
        sa.Column("profile_id", sa.Uuid(), nullable=True),
        sa.Column("action", sa.String(length=120), nullable=False),
        sa.Column("resource_type", sa.String(length=120), nullable=False),
        sa.Column("resource_id", sa.Uuid(), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["actor_account_id"], ["accounts.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["profile_id"], ["user_profiles.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_audit_logs_actor_account_id", "audit_logs", ["actor_account_id"])
    op.create_index("ix_audit_logs_profile_id", "audit_logs", ["profile_id"])


def downgrade() -> None:
    op.drop_index("ix_audit_logs_profile_id", table_name="audit_logs")
    op.drop_index("ix_audit_logs_actor_account_id", table_name="audit_logs")
    op.drop_table("audit_logs")
    op.drop_index("ix_records_record_type", table_name="records")
    op.drop_index("ix_records_profile_id", table_name="records")
    op.drop_table("records")
    op.drop_index("ix_user_profiles_account_id", table_name="user_profiles")
    op.drop_table("user_profiles")
    op.drop_table("accounts")
