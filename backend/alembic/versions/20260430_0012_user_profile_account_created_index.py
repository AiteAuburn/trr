"""user profile account created index

Revision ID: 20260430_0012
Revises: 20260430_0011
Create Date: 2026-04-30
"""

from collections.abc import Sequence

from alembic import op

revision: str = "20260430_0012"
down_revision: str | None = "20260430_0011"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "ix_user_profiles_account_created",
        "user_profiles",
        ["account_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_user_profiles_account_created", table_name="user_profiles")
