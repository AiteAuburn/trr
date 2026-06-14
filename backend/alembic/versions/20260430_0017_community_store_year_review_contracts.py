"""community store year review contracts

Revision ID: 20260430_0017
Revises: 20260430_0016
Create Date: 2026-04-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260430_0017"
down_revision: str | None = "20260430_0016"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "food_items",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("category", sa.String(length=40), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("normalized_name", sa.String(length=120), nullable=False),
        sa.Column("created_by_account_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["created_by_account_id"], ["accounts.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("category", "normalized_name", name="uq_food_item_category_normalized_name"),
    )
    op.create_index("ix_food_items_category", "food_items", ["category"])
    op.create_table(
        "food_shares",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("food_item_id", sa.Uuid(), nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=True),
        sa.Column("eaten_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("before_glucose", sa.Integer(), nullable=False),
        sa.Column("after_glucose", sa.Integer(), nullable=False),
        sa.Column("glucose_delta", sa.Integer(), nullable=False),
        sa.Column("serving_description", sa.String(length=160), nullable=True),
        sa.Column("public_note", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["food_item_id"], ["food_items.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_food_shares_account_id", "food_shares", ["account_id"])
    op.create_index("ix_food_shares_food_item_id", "food_shares", ["food_item_id"])
    op.create_table(
        "community_point_ledger",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("account_id", sa.Uuid(), nullable=True),
        sa.Column("delta", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(length=80), nullable=False),
        sa.Column("source_type", sa.String(length=80), nullable=False),
        sa.Column("source_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_community_point_ledger_account_id", "community_point_ledger", ["account_id"])
    op.create_table(
        "store_redemptions",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("account_id", sa.Uuid(), nullable=True),
        sa.Column("reward_code", sa.String(length=80), nullable=False),
        sa.Column("points_cost", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_store_redemptions_account_id", "store_redemptions", ["account_id"])


def downgrade() -> None:
    op.drop_index("ix_store_redemptions_account_id", table_name="store_redemptions")
    op.drop_table("store_redemptions")
    op.drop_index("ix_community_point_ledger_account_id", table_name="community_point_ledger")
    op.drop_table("community_point_ledger")
    op.drop_index("ix_food_shares_food_item_id", table_name="food_shares")
    op.drop_index("ix_food_shares_account_id", table_name="food_shares")
    op.drop_table("food_shares")
    op.drop_index("ix_food_items_category", table_name="food_items")
    op.drop_table("food_items")
