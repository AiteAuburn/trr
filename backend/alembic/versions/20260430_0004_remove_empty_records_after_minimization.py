"""remove empty records after text minimization

Revision ID: 20260430_0004
Revises: 20260430_0003
Create Date: 2026-04-30
"""

from collections.abc import Sequence

from alembic import op

revision: str = "20260430_0004"
down_revision: str | None = "20260430_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("DELETE FROM records WHERE payload = '{}'::jsonb")


def downgrade() -> None:
    pass
