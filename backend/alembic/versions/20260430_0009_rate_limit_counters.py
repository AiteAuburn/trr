"""rate limit counters

Revision ID: 20260430_0009
Revises: 20260430_0008
Create Date: 2026-04-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260430_0009"
down_revision: str | None = "20260430_0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "rate_limit_counters",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("scope", sa.String(length=80), nullable=False),
        sa.Column("key_hash", sa.String(length=64), nullable=False),
        sa.Column("window_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("window_seconds", sa.Integer(), nullable=False),
        sa.Column("count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint(
            "scope",
            "key_hash",
            "window_start",
            name="uq_rate_limit_scope_key_window",
        ),
    )
    op.create_index("ix_rate_limit_counters_scope", "rate_limit_counters", ["scope"])
    op.create_index("ix_rate_limit_counters_key_hash", "rate_limit_counters", ["key_hash"])


def downgrade() -> None:
    op.drop_index("ix_rate_limit_counters_key_hash", table_name="rate_limit_counters")
    op.drop_index("ix_rate_limit_counters_scope", table_name="rate_limit_counters")
    op.drop_table("rate_limit_counters")
