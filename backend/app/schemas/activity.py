from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class ActivityBase(BaseModel):
    actor_user_id: Optional[int] = None
    entity_type: str
    entity_id: Optional[int] = None
    action: str
    description: Optional[str] = None

class ActivityCreate(ActivityBase):
    workspace_id: int

class Activity(ActivityBase):
    id: int
    workspace_id: int
    created_at: datetime

    class Config:
        from_attributes = True
