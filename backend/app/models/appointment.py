from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, ForeignKeyConstraint, Text, Numeric, Table, UniqueConstraint, func
from sqlalchemy.orm import relationship
from ..core.database import Base


appointment_service_staff = Table(
    "appointment_service_staff",
    Base.metadata,
    Column("workspace_id", Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), primary_key=True),
    Column("service_id", Integer, primary_key=True),
    Column("staff_id", Integer, primary_key=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now(), nullable=False),
    ForeignKeyConstraint(
        ["service_id", "workspace_id"],
        ["appointment_services.id", "appointment_services.workspace_id"],
        ondelete="CASCADE",
    ),
    ForeignKeyConstraint(
        ["staff_id", "workspace_id"],
        ["appointment_staff.id", "appointment_staff.workspace_id"],
        ondelete="CASCADE",
    ),
)


class AppointmentSettings(Base):
    __tablename__ = "appointment_settings"

    id = Column(Integer, primary_key=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), unique=True, nullable=False, index=True)
    is_public_enabled = Column(Boolean, default=False, nullable=False)
    public_slug = Column(String(120), unique=True, nullable=True, index=True)
    business_name = Column(String(180), nullable=True)
    headline = Column(String(220), default="Online randevunuzu oluşturun")
    description = Column(Text, nullable=True)
    logo_url = Column(String(500), nullable=True)
    cover_url = Column(String(500), nullable=True)
    accent_color = Column(String(20), default="#E11D48")
    address = Column(String(500), nullable=True)
    phone = Column(String(50), nullable=True)
    whatsapp = Column(String(50), nullable=True)
    timezone = Column(String(80), default="Europe/Istanbul")
    slot_interval_minutes = Column(Integer, default=30)
    min_notice_hours = Column(Integer, default=2)
    max_advance_days = Column(Integer, default=60)
    require_approval = Column(Boolean, default=True)
    success_message = Column(Text, default="Randevu talebiniz alınmıştır. İşletme onayından sonra bilgilendirileceksiniz.")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class AppointmentService(Base):
    __tablename__ = "appointment_services"
    __table_args__ = (UniqueConstraint("id", "workspace_id", name="uq_appointment_services_id_workspace"),)

    id = Column(Integer, primary_key=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    name = Column(String(180), nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=30, nullable=False)
    price = Column(Numeric(12, 2), nullable=True)
    currency = Column(String(8), default="TRY")
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)

    # Soft delete
    is_deleted = Column(Boolean, default=False, nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    staff = relationship("AppointmentStaff", secondary=appointment_service_staff, back_populates="services")

    @property
    def staff_ids(self):
        return [item.id for item in self.staff]


class AppointmentStaff(Base):
    __tablename__ = "appointment_staff"
    __table_args__ = (UniqueConstraint("id", "workspace_id", name="uq_appointment_staff_id_workspace"),)

    id = Column(Integer, primary_key=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    name = Column(String(180), nullable=False)
    title = Column(String(180), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    photo_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)

    # Soft delete
    is_deleted = Column(Boolean, default=False, nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    services = relationship("AppointmentService", secondary=appointment_service_staff, back_populates="staff")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    service_id = Column(Integer, ForeignKey("appointment_services.id"), nullable=True, index=True)
    staff_id = Column(Integer, ForeignKey("appointment_staff.id"), nullable=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True, index=True)
    customer_name = Column(String(180), nullable=False)
    customer_phone = Column(String(50), nullable=False)
    customer_email = Column(String(255), nullable=True)
    starts_at = Column(DateTime(timezone=True), nullable=False, index=True)
    ends_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(40), default="pending", nullable=False)  # pending, confirmed, completed, cancelled, no_show
    notes = Column(Text, nullable=True)
    source = Column(String(40), default="public")

    # Soft delete
    is_deleted = Column(Boolean, default=False, nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    service = relationship("AppointmentService")
    staff = relationship("AppointmentStaff")
