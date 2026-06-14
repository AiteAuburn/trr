"""record soft delete indexes

Revision ID: 20260430_0005
Revises: 20260430_0004
Create Date: 2026-04-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260430_0005"
down_revision: str | None = "20260430_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("records", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.execute(
        """
        CREATE INDEX ix_records_profile_occurred_active
        ON records (profile_id, occurred_at DESC, created_at DESC)
        WHERE deleted_at IS NULL
        """
    )


def downgrade() -> None:
    op.drop_index("ix_records_profile_occurred_active", table_name="records")
    op.drop_column("records", "deleted_at")
