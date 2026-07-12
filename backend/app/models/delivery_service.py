from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class DeliveryService(Base):
    __tablename__ = "delivery_services"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    
    title = Column(String, nullable=False)
    type = Column(String, nullable=False) # delivery, service, installation, pickup, inspection, maintenance
    status = Column(String, default="planned") # planned, on_the_way, in_progress, completed, postponed, cancelled
    
    scheduled_at = Column(DateTime, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    address = Column(String, nullable=True)
    contact_person = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    contact_email = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    result_note = Column(Text, nullable=True)
    
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace")
    customer = relationship("Customer")
    job = relationship("Job")
    assigned_user = relationship("User", foreign_keys=[assigned_user_id])
    deleted_by_user = relationship("User", foreign_keys=[deleted_by_user_id])
    files = relationship("FileAsset", back_populates="delivery_service")
