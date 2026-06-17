"""Add community food lookup indexes."""

from collections.abc import Sequence

from alembic import op

revision: str = "20260430_0024"
down_revision: str | None = "20260430_0023"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index("ix_food_items_normalized_name", "food_items", ["normalized_name"])
    op.create_index(
        "ix_food_shares_food_item_eaten_created",
        "food_shares",
        ["food_item_id", "eaten_at", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_food_shares_food_item_eaten_created", table_name="food_shares")
    op.drop_index("ix_food_items_normalized_name", table_name="food_items")
