"""add creator_id to tasks

Revision ID: f2131d27b29d
Revises: f37fa62f3330
Create Date: 2026-05-10 02:39:45.525842

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f2131d27b29d'
down_revision: Union[str, None] = 'f37fa62f3330'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('tasks', sa.Column('creator_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_tasks_creator_id', 'tasks', 'users', ['creator_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_tasks_creator_id', 'tasks', type_='foreignkey')
    op.drop_column('tasks', 'creator_id')
