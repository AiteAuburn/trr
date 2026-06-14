"""auth session listing index

Revision ID: 20260430_0013
Revises: 20260430_0012
Create Date: 2026-04-30
"""

from collections.abc import Sequence

from alembic import op

revision: str = "20260430_0013"
down_revision: str | None = "20260430_0012"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "ix_auth_sessions_account_active_list",
        "auth_sessions",
        ["account_id", "revoked_at", "expires_at", "last_used_at", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_auth_sessions_account_active_list", table_name="auth_sessions")
