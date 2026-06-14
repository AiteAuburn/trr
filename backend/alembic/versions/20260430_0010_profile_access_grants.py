"""profile access grants

Revision ID: 20260430_0010
Revises: 20260430_0009
Create Date: 2026-04-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260430_0010"
down_revision: str | None = "20260430_0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "profile_access_grants",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("profile_id", sa.Uuid(), nullable=False),
        sa.Column("grantee_account_id", sa.Uuid(), nullable=False),
        sa.Column("grant_type", sa.String(length=80), nullable=False),
        sa.Column("scopes", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["profile_id"], ["user_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["grantee_account_id"], ["accounts.id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_profile_access_grants_profile_grantee",
        "profile_access_grants",
        ["profile_id", "grantee_account_id"],
    )
    op.create_index(
        "ix_profile_access_grants_grantee",
        "profile_access_grants",
        ["grantee_account_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_profile_access_grants_grantee", table_name="profile_access_grants")
    op.drop_index("ix_profile_access_grants_profile_grantee", table_name="profile_access_grants")
    op.drop_table("profile_access_grants")
