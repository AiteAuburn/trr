"""generic record abstraction

Revision ID: 20260430_0002
Revises: 20260430_0001
Create Date: 2026-04-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260430_0002"
down_revision: str | None = "20260430_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column("records", "recorded_at", new_column_name="occurred_at")
    op.add_column(
        "records",
        sa.Column(
            "metadata_json",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("records", "metadata_json")
    op.alter_column("records", "occurred_at", new_column_name="recorded_at")
