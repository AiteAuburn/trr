"""Align community food share latest index."""

from collections.abc import Sequence

from alembic import op

revision: str = "20260430_0025"
down_revision: str | None = "20260430_0024"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_index("ix_food_shares_food_item_eaten_created", table_name="food_shares")
    op.create_index(
        "ix_food_shares_food_item_eaten_created_id",
        "food_shares",
        ["food_item_id", "eaten_at", "created_at", "id"],
    )


def downgrade() -> None:
    op.drop_index("ix_food_shares_food_item_eaten_created_id", table_name="food_shares")
    op.create_index(
        "ix_food_shares_food_item_eaten_created",
        "food_shares",
        ["food_item_id", "eaten_at", "created_at"],
    )
