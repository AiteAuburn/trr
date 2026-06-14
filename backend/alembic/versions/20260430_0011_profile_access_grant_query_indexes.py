"""profile access grant query indexes

Revision ID: 20260430_0011
Revises: 20260430_0010
Create Date: 2026-04-30
"""

from collections.abc import Sequence

from alembic import op

revision: str = "20260430_0011"
down_revision: str | None = "20260430_0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "ix_profile_access_grants_profile_created",
        "profile_access_grants",
        ["profile_id", "created_at"],
    )
    op.create_index(
        "ix_profile_access_grants_grantee_revoked_created",
        "profile_access_grants",
        ["grantee_account_id", "revoked_at", "created_at"],
    )
    op.create_index(
        "ix_profile_access_grants_grantee_expires",
        "profile_access_grants",
        ["grantee_account_id", "expires_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_profile_access_grants_grantee_expires", table_name="profile_access_grants")
    op.drop_index(
        "ix_profile_access_grants_grantee_revoked_created",
        table_name="profile_access_grants",
    )
    op.drop_index("ix_profile_access_grants_profile_created", table_name="profile_access_grants")
