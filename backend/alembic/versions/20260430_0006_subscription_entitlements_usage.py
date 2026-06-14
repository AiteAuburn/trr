"""subscription entitlements usage

Revision ID: 20260430_0006
Revises: 20260430_0005
Create Date: 2026-04-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260430_0006"
down_revision: str | None = "20260430_0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "plans",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("code", sa.String(length=80), nullable=False, unique=True),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column("billing_interval", sa.String(length=40), nullable=False),
        sa.Column("price_cents", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="TWD"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "plan_entitlements",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("plan_id", sa.Uuid(), nullable=False),
        sa.Column("entitlement_key", sa.String(length=120), nullable=False),
        sa.Column("value_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["plan_id"], ["plans.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("plan_id", "entitlement_key", name="uq_plan_entitlement_key"),
    )
    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("plan_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("trial_started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("trial_ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("current_period_started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("current_period_ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("referral_code", sa.String(length=80), nullable=True),
        sa.Column("preserves_intro_price", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["plan_id"], ["plans.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_subscriptions_account_id", "subscriptions", ["account_id"])
    op.create_table(
        "usage_counters",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("counter_key", sa.String(length=120), nullable=False),
        sa.Column("period_start", sa.Date(), nullable=False),
        sa.Column("period_end", sa.Date(), nullable=False),
        sa.Column("used_units", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.UniqueConstraint(
            "account_id",
            "counter_key",
            "period_start",
            name="uq_usage_counter_account_key_period",
        ),
    )
    op.create_index("ix_usage_counters_account_id", "usage_counters", ["account_id"])


def downgrade() -> None:
    op.drop_index("ix_usage_counters_account_id", table_name="usage_counters")
    op.drop_table("usage_counters")
    op.drop_index("ix_subscriptions_account_id", table_name="subscriptions")
    op.drop_table("subscriptions")
    op.drop_table("plan_entitlements")
    op.drop_table("plans")
