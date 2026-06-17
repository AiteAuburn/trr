"""Add year review share package constraints."""

from collections.abc import Sequence

from alembic import op

revision: str = "20260430_0028"
down_revision: str | None = "20260430_0027"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_check_constraint(
        "ck_year_review_share_packages_privacy_level",
        "year_review_share_packages",
        "privacy_level = 'public_summary'",
    )
    op.create_check_constraint(
        "ck_year_review_share_packages_asset_kind",
        "year_review_share_packages",
        "asset_kind = 'svg_card'",
    )
    op.create_check_constraint(
        "ck_year_review_share_packages_checksum_len",
        "year_review_share_packages",
        "char_length(asset_checksum_sha256) = 64",
    )
    op.create_check_constraint(
        "ck_year_review_share_packages_status",
        "year_review_share_packages",
        "status IN ('confirmed', 'opened', 'dismissed', 'revoked')",
    )
    op.create_check_constraint(
        "ck_year_review_share_packages_last_result",
        "year_review_share_packages",
        "last_share_result IS NULL OR last_share_result IN ('opened', 'dismissed')",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_year_review_share_packages_last_result",
        "year_review_share_packages",
        type_="check",
    )
    op.drop_constraint("ck_year_review_share_packages_status", "year_review_share_packages", type_="check")
    op.drop_constraint("ck_year_review_share_packages_checksum_len", "year_review_share_packages", type_="check")
    op.drop_constraint("ck_year_review_share_packages_asset_kind", "year_review_share_packages", type_="check")
    op.drop_constraint("ck_year_review_share_packages_privacy_level", "year_review_share_packages", type_="check")
