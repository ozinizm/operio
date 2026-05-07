from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    responsible_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    converted_job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    
    offer_no = Column(String, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    amount = Column(Float, default=0.0)
    currency = Column(String, default="TRY")
    status = Column(String, default="draft")  # draft, sent, approved, rejected, expired
    valid_until = Column(DateTime, nullable=True)
    
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    workspace = relationship("Workspace")
    customer = relationship("Customer")
    responsible_user = relationship("User", foreign_keys=[responsible_user_id])
    deleted_by_user = relationship("User", foreign_keys=[deleted_by_user_id])
    converted_job = relationship("Job", foreign_keys=[converted_job_id])
