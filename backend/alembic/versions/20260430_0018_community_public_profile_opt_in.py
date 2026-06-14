"""community public profile opt in

Revision ID: 20260430_0018
Revises: 20260430_0017
Create Date: 2026-04-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260430_0018"
down_revision: str | None = "20260430_0017"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "community_public_profiles",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column("leaderboard_opt_in", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("account_id", name="uq_community_public_profiles_account_id"),
    )
    op.create_index("ix_community_public_profiles_account_id", "community_public_profiles", ["account_id"])


def downgrade() -> None:
    op.drop_index("ix_community_public_profiles_account_id", table_name="community_public_profiles")
    op.drop_table("community_public_profiles")
