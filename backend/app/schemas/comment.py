from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class CommentBase(BaseModel):
    entity_type: str
    entity_id: int
    body: str
    parent_comment_id: Optional[int] = None

class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    body: str

class CommentResponse(CommentBase):
    id: int
    workspace_id: int
    author_user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    author_name: Optional[str] = None # For convenience

    class Config:
        from_attributes = True
