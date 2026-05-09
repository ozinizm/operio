"""Add email_logs table

Revision ID: f37fa62f3330
Revises: b2c3d4e5f6a1
Create Date: 2026-05-09 14:17:10.381480

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f37fa62f3330'
down_revision: Union[str, None] = 'b2c3d4e5f6a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'email_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('workspace_id', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('recipient_email', sa.String(), nullable=True),
        sa.Column('subject', sa.String(), nullable=True),
        sa.Column('template_key', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('provider', sa.String(), nullable=True),
        sa.Column('related_entity_type', sa.String(), nullable=True),
        sa.Column('related_entity_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], )
    )
    op.create_index(op.f('ix_email_logs_created_at'), 'email_logs', ['created_at'], unique=False)
    op.create_index(op.f('ix_email_logs_id'), 'email_logs', ['id'], unique=False)
    op.create_index(op.f('ix_email_logs_recipient_email'), 'email_logs', ['recipient_email'], unique=False)
    op.create_index(op.f('ix_email_logs_status'), 'email_logs', ['status'], unique=False)
    op.create_index(op.f('ix_email_logs_template_key'), 'email_logs', ['template_key'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_email_logs_template_key'), table_name='email_logs')
    op.drop_index(op.f('ix_email_logs_status'), table_name='email_logs')
    op.drop_index(op.f('ix_email_logs_recipient_email'), table_name='email_logs')
    op.drop_index(op.f('ix_email_logs_id'), table_name='email_logs')
    op.drop_index(op.f('ix_email_logs_created_at'), table_name='email_logs')
    op.drop_table('email_logs')
