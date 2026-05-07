from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Recipient
    actor_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Who triggered it
    
    type = Column(String, nullable=False)  # task_assigned, comment_added, etc.
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    
    entity_type = Column(String, nullable=True)
    entity_id = Column(Integer, nullable=True)
    
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    workspace = relationship("Workspace")
    user = relationship("User", foreign_keys=[user_id])
    actor = relationship("User", foreign_keys=[actor_user_id])
