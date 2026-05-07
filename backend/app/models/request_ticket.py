from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class RequestTicket(Base):
    __tablename__ = "request_tickets"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    delivery_service_id = Column(Integer, ForeignKey("delivery_services.id"), nullable=True)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String, nullable=False) # complaint, request, revision, support, warranty, information
    priority = Column(String, default="normal") # low, normal, high, critical
    status = Column(String, default="new") # new, reviewing, in_progress, waiting_customer, resolved, closed, cancelled
    source = Column(String, default="internal") # phone, whatsapp, email, website, internal, other
    
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolution_note = Column(Text, nullable=True)
    
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace")
    customer = relationship("Customer")
    job = relationship("Job")
    delivery_service = relationship("DeliveryService")
    assigned_user = relationship("User", foreign_keys=[assigned_user_id])
    deleted_by_user = relationship("User", foreign_keys=[deleted_by_user_id])
    files = relationship("FileAsset", back_populates="request_ticket")
