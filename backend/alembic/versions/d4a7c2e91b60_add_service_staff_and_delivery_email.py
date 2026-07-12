"""add service staff mapping and delivery contact email

Revision ID: d4a7c2e91b60
Revises: 0c92c1e04c98
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4a7c2e91b60"
down_revision: Union[str, None] = "0c92c1e04c98"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("appointment_services") as batch_op:
        batch_op.create_unique_constraint(
            "uq_appointment_services_id_workspace", ["id", "workspace_id"]
        )
    with op.batch_alter_table("appointment_staff") as batch_op:
        batch_op.create_unique_constraint(
            "uq_appointment_staff_id_workspace", ["id", "workspace_id"]
        )
    op.create_table(
        "appointment_service_staff",
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("service_id", sa.Integer(), nullable=False),
        sa.Column("staff_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["service_id", "workspace_id"],
            ["appointment_services.id", "appointment_services.workspace_id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["staff_id", "workspace_id"],
            ["appointment_staff.id", "appointment_staff.workspace_id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("workspace_id", "service_id", "staff_id"),
    )
    op.create_index("ix_appointment_service_staff_service", "appointment_service_staff", ["service_id"])
    op.create_index("ix_appointment_service_staff_staff", "appointment_service_staff", ["staff_id"])
    with op.batch_alter_table("delivery_services") as batch_op:
        batch_op.add_column(sa.Column("contact_email", sa.String(length=255), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("delivery_services") as batch_op:
        batch_op.drop_column("contact_email")
    op.drop_index("ix_appointment_service_staff_staff", table_name="appointment_service_staff")
    op.drop_index("ix_appointment_service_staff_service", table_name="appointment_service_staff")
    op.drop_table("appointment_service_staff")
    with op.batch_alter_table("appointment_staff") as batch_op:
        batch_op.drop_constraint("uq_appointment_staff_id_workspace", type_="unique")
    with op.batch_alter_table("appointment_services") as batch_op:
        batch_op.drop_constraint("uq_appointment_services_id_workspace", type_="unique")
