"""minimize raw text stored in records

Revision ID: 20260430_0003
Revises: 20260430_0002
Create Date: 2026-04-30
"""

from collections.abc import Sequence

from alembic import op

revision: str = "20260430_0003"
down_revision: str | None = "20260430_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE records
        SET
          payload = payload
            - 'description'
            - 'text'
            - 'note'
            - 'notes'
            - 'free_text'
            - 'transcript'
            - 'source_text'
            - 'raw_transcript'
            - 'raw_text'
            - 'original_text'
            - 'normalized_text',
          metadata_json = metadata_json
            - 'transcript'
            - 'source_text'
            - 'raw_transcript'
            - 'raw_text'
            - 'original_text'
            - 'normalized_text'
        """
    )


def downgrade() -> None:
    pass
