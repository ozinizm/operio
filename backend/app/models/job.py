from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, func, Text, Float, Boolean
from sqlalchemy.orm import relationship
from ..core.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    title = Column(String, nullable=False)
    job_type = Column(String, nullable=True)
    status = Column(String, default="new") # new, planned, in_progress, waiting, completed, delivered, cancelled
    priority = Column(String, default="normal") # low, normal, high, critical
    progress = Column(Float, default=0.0)
    responsible_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    due_date = Column(DateTime, nullable=True)
    description = Column(Text, nullable=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    workspace = relationship("Workspace", back_populates="jobs")
    customer = relationship("Customer", back_populates="jobs")
    responsible_user = relationship("User", foreign_keys=[responsible_user_id])
    deleted_by_user = relationship("User", foreign_keys=[deleted_by_user_id])
    tasks = relationship("Task", back_populates="job")
    stages = relationship("JobStage", back_populates="job", cascade="all, delete-orphan")
