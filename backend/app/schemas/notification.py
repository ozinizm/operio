from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class NotificationBase(BaseModel):
    type: str
    title: str
    message: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None

class NotificationResponse(NotificationBase):
    id: int
    workspace_id: int
    user_id: int
    actor_user_id: Optional[int] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    actor_name: Optional[str] = None # For convenience

    class Config:
        from_attributes = True
