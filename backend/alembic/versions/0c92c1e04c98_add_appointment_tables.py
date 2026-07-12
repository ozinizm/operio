"""add_appointment_tables

Revision ID: 0c92c1e04c98
Revises: f2131d27b29d
Create Date: 2026-07-11 15:26:28.890226

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0c92c1e04c98'
down_revision: Union[str, None] = 'f2131d27b29d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. appointment_settings
    op.create_table(
        'appointment_settings',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('workspace_id', sa.Integer(), sa.ForeignKey('workspaces.id'), unique=True, nullable=False),
        sa.Column('is_public_enabled', sa.Boolean(), default=False, nullable=False),
        sa.Column('public_slug', sa.String(length=120), unique=True, nullable=True),
        sa.Column('business_name', sa.String(length=180), nullable=True),
        sa.Column('headline', sa.String(length=220), default='Online randevunuzu oluşturun', nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('logo_url', sa.String(length=500), nullable=True),
        sa.Column('cover_url', sa.String(length=500), nullable=True),
        sa.Column('accent_color', sa.String(length=20), default='#E11D48', nullable=False),
        sa.Column('address', sa.String(length=500), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('whatsapp', sa.String(length=50), nullable=True),
        sa.Column('timezone', sa.String(length=80), default='Europe/Istanbul', nullable=False),
        sa.Column('slot_interval_minutes', sa.Integer(), default=30, nullable=False),
        sa.Column('min_notice_hours', sa.Integer(), default=2, nullable=False),
        sa.Column('max_advance_days', sa.Integer(), default=60, nullable=False),
        sa.Column('require_approval', sa.Boolean(), default=True, nullable=False),
        sa.Column('success_message', sa.Text(), default='Randevu talebiniz alınmıştır. İşletme onayından sonra bilgilendirileceksiniz.', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True)
    )
    op.create_index(op.f('ix_appointment_settings_workspace_id'), 'appointment_settings', ['workspace_id'], unique=True)
    op.create_index(op.f('ix_appointment_settings_public_slug'), 'appointment_settings', ['public_slug'], unique=True)

    # 2. appointment_services
    op.create_table(
        'appointment_services',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('workspace_id', sa.Integer(), sa.ForeignKey('workspaces.id'), nullable=False),
        sa.Column('name', sa.String(length=180), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), default=30, nullable=False),
        sa.Column('price', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('currency', sa.String(length=8), default='TRY', nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True, nullable=False),
        sa.Column('sort_order', sa.Integer(), default=0, nullable=False),
        # Soft delete
        sa.Column('is_deleted', sa.Boolean(), default=False, nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by_user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True)
    )
    op.create_index(op.f('ix_appointment_services_workspace_id'), 'appointment_services', ['workspace_id'], unique=False)

    # 3. appointment_staff
    op.create_table(
        'appointment_staff',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('workspace_id', sa.Integer(), sa.ForeignKey('workspaces.id'), nullable=False),
        sa.Column('name', sa.String(length=180), nullable=False),
        sa.Column('title', sa.String(length=180), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('photo_url', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True, nullable=False),
        # Soft delete
        sa.Column('is_deleted', sa.Boolean(), default=False, nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by_user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True)
    )
    op.create_index(op.f('ix_appointment_staff_workspace_id'), 'appointment_staff', ['workspace_id'], unique=False)

    # 4. appointments
    op.create_table(
        'appointments',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('workspace_id', sa.Integer(), sa.ForeignKey('workspaces.id'), nullable=False),
        sa.Column('service_id', sa.Integer(), sa.ForeignKey('appointment_services.id'), nullable=True),
        sa.Column('staff_id', sa.Integer(), sa.ForeignKey('appointment_staff.id'), nullable=True),
        sa.Column('customer_id', sa.Integer(), sa.ForeignKey('customers.id'), nullable=True),
        sa.Column('customer_name', sa.String(length=180), nullable=False),
        sa.Column('customer_phone', sa.String(length=50), nullable=False),
        sa.Column('customer_email', sa.String(length=255), nullable=True),
        sa.Column('starts_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ends_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(length=40), default='pending', nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('source', sa.String(length=40), default='public', nullable=False),
        # Soft delete
        sa.Column('is_deleted', sa.Boolean(), default=False, nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_by_user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True)
    )
    op.create_index(op.f('ix_appointments_workspace_id'), 'appointments', ['workspace_id'], unique=False)
    op.create_index(op.f('ix_appointments_service_id'), 'appointments', ['service_id'], unique=False)
    op.create_index(op.f('ix_appointments_staff_id'), 'appointments', ['staff_id'], unique=False)
    op.create_index(op.f('ix_appointments_customer_id'), 'appointments', ['customer_id'], unique=False)
    op.create_index(op.f('ix_appointments_starts_at'), 'appointments', ['starts_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_appointments_starts_at'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_customer_id'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_staff_id'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_service_id'), table_name='appointments')
    op.drop_index(op.f('ix_appointments_workspace_id'), table_name='appointments')
    op.drop_table('appointments')

    op.drop_index(op.f('ix_appointment_staff_workspace_id'), table_name='appointment_staff')
    op.drop_table('appointment_staff')

    op.drop_index(op.f('ix_appointment_services_workspace_id'), table_name='appointment_services')
    op.drop_table('appointment_services')

    op.drop_index(op.f('ix_appointment_settings_public_slug'), table_name='appointment_settings')
    op.drop_index(op.f('ix_appointment_settings_workspace_id'), table_name='appointment_settings')
    op.drop_table('appointment_settings')
