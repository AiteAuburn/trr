"""revoked jwt denylist

Revision ID: 20260430_0007
Revises: 20260430_0006
Create Date: 2026-04-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260430_0007"
down_revision: str | None = "20260430_0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "revoked_jwts",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("jti_hash", sa.String(length=64), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_revoked_jwts_jti_hash", "revoked_jwts", ["jti_hash"])
    op.create_index("ix_revoked_jwts_expires_at", "revoked_jwts", ["expires_at"])


def downgrade() -> None:
    op.drop_index("ix_revoked_jwts_expires_at", table_name="revoked_jwts")
    op.drop_index("ix_revoked_jwts_jti_hash", table_name="revoked_jwts")
    op.drop_table("revoked_jwts")
