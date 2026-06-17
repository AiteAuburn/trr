"""Add community leaderboard lookup indexes."""

from collections.abc import Sequence

from alembic import op

revision: str = "20260430_0026"
down_revision: str | None = "20260430_0025"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "ix_food_shares_account_food_item",
        "food_shares",
        ["account_id", "food_item_id"],
    )
    op.create_index(
        "ix_community_point_ledger_account_delta",
        "community_point_ledger",
        ["account_id", "delta"],
    )
    op.create_index(
        "ix_community_public_profiles_opt_in_display",
        "community_public_profiles",
        ["leaderboard_opt_in", "display_name", "account_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_community_public_profiles_opt_in_display", table_name="community_public_profiles")
    op.drop_index("ix_community_point_ledger_account_delta", table_name="community_point_ledger")
    op.drop_index("ix_food_shares_account_food_item", table_name="food_shares")
