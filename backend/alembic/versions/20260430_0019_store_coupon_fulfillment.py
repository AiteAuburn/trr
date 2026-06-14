"""store coupon fulfillment

Revision ID: 20260430_0019
Revises: 20260430_0018
Create Date: 2026-04-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260430_0019"
down_revision: str | None = "20260430_0018"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("store_redemptions", sa.Column("fulfillment_type", sa.String(length=40), nullable=True))
    op.add_column("store_redemptions", sa.Column("fulfillment_code", sa.String(length=120), nullable=True))
    op.add_column("store_redemptions", sa.Column("fulfilled_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("store_redemptions", "fulfilled_at")
    op.drop_column("store_redemptions", "fulfillment_code")
    op.drop_column("store_redemptions", "fulfillment_type")
