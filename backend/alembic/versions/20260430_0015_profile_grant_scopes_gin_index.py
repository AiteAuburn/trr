"""profile grant scopes gin index

Revision ID: 20260430_0015
Revises: 20260430_0014
Create Date: 2026-04-30
"""

from collections.abc import Sequence

from alembic import op

revision: str = "20260430_0015"
down_revision: str | None = "20260430_0014"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "ix_profile_access_grants_scopes_gin",
        "profile_access_grants",
        ["scopes"],
        postgresql_using="gin",
    )


def downgrade() -> None:
    op.drop_index("ix_profile_access_grants_scopes_gin", table_name="profile_access_grants")
