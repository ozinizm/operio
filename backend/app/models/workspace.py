from sqlalchemy import Column, String, Boolean, DateTime, func, Integer, ForeignKey
from sqlalchemy.orm import relationship
from ..core.database import Base

class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=True)
    sector = Column(String, nullable=True)
    status = Column(String, default="pilot") # demo, pilot, active, suspended
    plan = Column(String, default="free")
    logo_url = Column(String, nullable=True)
    primary_contact_name = Column(String, nullable=True)
    primary_contact_email = Column(String, nullable=True)
    primary_contact_phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    members = relationship("WorkspaceMember", back_populates="workspace")
    customers = relationship("Customer", back_populates="workspace")
    jobs = relationship("Job", back_populates="workspace")
    tasks = relationship("Task", back_populates="workspace")
    activities = relationship("Activity", back_populates="workspace")

class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String, default="staff") # owner, admin, manager, staff, finance, field
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    workspace = relationship("Workspace", back_populates="members")
    user = relationship("User", back_populates="workspace_members")
