"""year review snapshots

Revision ID: 20260430_0021
Revises: 20260430_0020
Create Date: 2026-04-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260430_0021"
down_revision: str | None = "20260430_0020"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "year_review_snapshots",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("profile_id", sa.UUID(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("summary_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["profile_id"], ["user_profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("profile_id", "year", name="uq_year_review_snapshot_profile_year"),
    )
    op.create_index("ix_year_review_snapshots_profile_id", "year_review_snapshots", ["profile_id"])


def downgrade() -> None:
    op.drop_index("ix_year_review_snapshots_profile_id", table_name="year_review_snapshots")
    op.drop_table("year_review_snapshots")
