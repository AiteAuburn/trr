"""add optional password hashes for email and password authentication

Revision ID: 20261003_0034
Revises: 20260926_0033
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20261003_0034"
down_revision: str | None = "20260926_0033"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None
migration_phase = "expand"
rollback_compatible = True


def upgrade() -> None:
    op.add_column("accounts", sa.Column("password_hash", sa.String(length=512), nullable=True))


def downgrade() -> None:
    op.drop_column("accounts", "password_hash")
