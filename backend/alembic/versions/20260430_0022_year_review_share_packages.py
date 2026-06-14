"""Add year review share packages."""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260430_0022"
down_revision: str | None = "20260430_0021"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "year_review_share_packages",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("snapshot_id", sa.Uuid(), nullable=False),
        sa.Column("profile_id", sa.Uuid(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("privacy_level", sa.String(length=40), nullable=False),
        sa.Column("asset_kind", sa.String(length=40), nullable=False),
        sa.Column("asset_checksum_sha256", sa.String(length=64), nullable=False),
        sa.Column("share_text", sa.String(length=280), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("last_share_result", sa.String(length=40), nullable=True),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("shared_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["profile_id"], ["user_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["snapshot_id"], ["year_review_snapshots.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_year_review_share_packages_profile_id"),
        "year_review_share_packages",
        ["profile_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_year_review_share_packages_snapshot_id"),
        "year_review_share_packages",
        ["snapshot_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_year_review_share_packages_snapshot_id"), table_name="year_review_share_packages")
    op.drop_index(op.f("ix_year_review_share_packages_profile_id"), table_name="year_review_share_packages")
    op.drop_table("year_review_share_packages")
