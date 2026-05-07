from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    author_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    entity_type = Column(String, nullable=False)  # customer, job, task, etc.
    entity_id = Column(Integer, nullable=False)
    
    body = Column(Text, nullable=False)
    parent_comment_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    author = relationship("User")
    parent = relationship("Comment", remote_side=[id], backref="replies")
