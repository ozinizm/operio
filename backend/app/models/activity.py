from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, func, Text
from sqlalchemy.orm import relationship
from ..core.database import Base

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)
    actor_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_email = Column(String, nullable=True)
    entity_type = Column(String, nullable=False) # customer, job, task, etc.
    entity_id = Column(Integer, nullable=True)
    action = Column(String, nullable=False) # customer.created, job.updated, etc.
    description = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True) # For storing extra details as JSON string
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    workspace = relationship("Workspace", back_populates="activities")
