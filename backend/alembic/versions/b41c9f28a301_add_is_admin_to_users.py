"""add is_admin to users

Revision ID: b41c9f28a301
Revises: a84b181350da
Create Date: 2026-08-12 16:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b41c9f28a301'
down_revision: Union[str, Sequence[str], None] = 'a84b181350da'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('is_admin', sa.Boolean(), server_default=sa.text('false'), nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'is_admin')
