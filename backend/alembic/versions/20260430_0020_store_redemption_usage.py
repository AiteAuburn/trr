"""store redemption usage

Revision ID: 20260430_0020
Revises: 20260430_0019
Create Date: 2026-04-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260430_0020"
down_revision: str | None = "20260430_0019"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("store_redemptions", sa.Column("used_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("store_redemptions", "used_at")
