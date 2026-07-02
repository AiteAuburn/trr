"""Add daily records."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260430_0030"
down_revision: str | None = "20260430_0029"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "daily_records",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("profile_id", sa.Uuid(), nullable=False),
        sa.Column("record_date", sa.Date(), nullable=False),
        sa.Column("summary_text", sa.String(length=1000), nullable=False, server_default=""),
        sa.Column(
            "record_ids",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column(
            "preview_records_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column(
            "transcript_entries_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("source", sa.String(length=80), nullable=False, server_default="ai_confirmation"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["profile_id"], ["user_profiles.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("profile_id", "record_date", name="uq_daily_records_profile_date"),
    )
    op.create_index("ix_daily_records_profile_id", "daily_records", ["profile_id"])
    op.create_index("ix_daily_records_record_date", "daily_records", ["record_date"])


def downgrade() -> None:
    op.drop_index("ix_daily_records_record_date", table_name="daily_records")
    op.drop_index("ix_daily_records_profile_id", table_name="daily_records")
    op.drop_table("daily_records")
