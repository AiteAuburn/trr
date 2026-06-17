"""Add community point ledger source uniqueness."""

from collections.abc import Sequence

from alembic import op

revision: str = "20260430_0029"
down_revision: str | None = "20260430_0028"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_community_point_ledger_source",
        "community_point_ledger",
        ["source_type", "source_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_community_point_ledger_source",
        "community_point_ledger",
        type_="unique",
    )
