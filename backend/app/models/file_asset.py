from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class FileAsset(Base):
    __tablename__ = "file_assets"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    offer_id = Column(Integer, ForeignKey("offers.id"), nullable=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    finance_entry_id = Column(Integer, ForeignKey("finance_entries.id"), nullable=True)
    delivery_service_id = Column(Integer, ForeignKey("delivery_services.id"), nullable=True)
    request_ticket_id = Column(Integer, ForeignKey("request_tickets.id"), nullable=True)
    
    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(BigInteger, nullable=False)  # Size in bytes
    mime_type = Column(String, nullable=False)
    category = Column(String, nullable=False)  # contract, offer, invoice, etc.
    description = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    workspace = relationship("Workspace")
    uploader = relationship("User")
    customer = relationship("Customer")
    job = relationship("Job")
    offer = relationship("Offer")
    task = relationship("Task")
    finance_entry = relationship("FinanceEntry")
    delivery_service = relationship("DeliveryService", back_populates="files")
    request_ticket = relationship("RequestTicket", back_populates="files")
