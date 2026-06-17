"""Add store redemption wallet index."""

from collections.abc import Sequence

from alembic import op

revision: str = "20260430_0027"
down_revision: str | None = "20260430_0026"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "ix_store_redemptions_account_created_id",
        "store_redemptions",
        ["account_id", "created_at", "id"],
    )


def downgrade() -> None:
    op.drop_index("ix_store_redemptions_account_created_id", table_name="store_redemptions")
