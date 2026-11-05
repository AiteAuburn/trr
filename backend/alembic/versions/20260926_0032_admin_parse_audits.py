"""add per-user AI parse audit rows for admin inspection

Revision ID: 20260926_0032
Revises: 20260912_0031
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20260926_0032"
down_revision: str | None = "20260912_0031"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None
migration_phase = "expand"
rollback_compatible = True


def upgrade() -> None:
    op.create_table(
        "ai_parse_audits",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("profile_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("transcript_text", sa.Text(), nullable=False),
        sa.Column("stt_model_id", sa.String(length=120), nullable=False),
        sa.Column("llm_model_id", sa.String(length=120), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("result_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "usage_json",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column("input_tokens", sa.BigInteger(), server_default="0", nullable=False),
        sa.Column("output_tokens", sa.BigInteger(), server_default="0", nullable=False),
        sa.Column("total_tokens", sa.BigInteger(), server_default="0", nullable=False),
        sa.Column("error_code", sa.String(length=80), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["profile_id"], ["user_profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="pk_ai_parse_audits"),
        sa.CheckConstraint("status IN ('succeeded', 'failed', 'interrupted')", name="ck_ai_parse_audits_status"),
    )
    op.create_index(
        "ix_ai_parse_audits_account_created", "ai_parse_audits", ["account_id", "created_at"]
    )
    op.create_index(
        "ix_ai_parse_audits_profile_created", "ai_parse_audits", ["profile_id", "created_at"]
    )


def downgrade() -> None:
    op.drop_index("ix_ai_parse_audits_profile_created", table_name="ai_parse_audits")
    op.drop_index("ix_ai_parse_audits_account_created", table_name="ai_parse_audits")
    op.drop_table("ai_parse_audits")
