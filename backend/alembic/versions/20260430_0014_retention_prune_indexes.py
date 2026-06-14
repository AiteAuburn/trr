"""retention prune indexes

Revision ID: 20260430_0014
Revises: 20260430_0013
Create Date: 2026-04-30
"""

from collections.abc import Sequence

from alembic import op

revision: str = "20260430_0014"
down_revision: str | None = "20260430_0013"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "ix_rate_limit_counters_window_start",
        "rate_limit_counters",
        ["window_start"],
    )
    op.create_index(
        "ix_profile_access_grants_revoked_created",
        "profile_access_grants",
        ["revoked_at", "created_at"],
    )
    op.create_index(
        "ix_profile_access_grants_expires_created",
        "profile_access_grants",
        ["expires_at", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_profile_access_grants_expires_created", table_name="profile_access_grants")
    op.drop_index("ix_profile_access_grants_revoked_created", table_name="profile_access_grants")
    op.drop_index("ix_rate_limit_counters_window_start", table_name="rate_limit_counters")
