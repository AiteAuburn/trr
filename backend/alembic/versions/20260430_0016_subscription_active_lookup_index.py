"""subscription active lookup index

Revision ID: 20260430_0016
Revises: 20260430_0015
Create Date: 2026-04-30
"""

from collections.abc import Sequence

from alembic import op

revision: str = "20260430_0016"
down_revision: str | None = "20260430_0015"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "ix_subscriptions_account_status_created",
        "subscriptions",
        ["account_id", "status", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_subscriptions_account_status_created", table_name="subscriptions")
