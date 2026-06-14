"""Add achievement unlock records."""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260430_0023"
down_revision: str | None = "20260430_0022"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "achievement_unlocks",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("profile_id", sa.Uuid(), nullable=False),
        sa.Column("achievement_id", sa.String(length=80), nullable=False),
        sa.Column("category", sa.String(length=40), nullable=False),
        sa.Column("kind", sa.String(length=40), nullable=False),
        sa.Column("level", sa.Integer(), nullable=False),
        sa.Column("unlocked_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["profile_id"], ["user_profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("profile_id", "achievement_id", name="uq_achievement_unlock_profile_achievement"),
    )
    op.create_index(
        op.f("ix_achievement_unlocks_profile_id"),
        "achievement_unlocks",
        ["profile_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_achievement_unlocks_profile_id"), table_name="achievement_unlocks")
    op.drop_table("achievement_unlocks")
