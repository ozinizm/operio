from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class WatcherBase(BaseModel):
    entity_type: str
    entity_id: int

class WatcherCreate(WatcherBase):
    pass

class WatcherResponse(WatcherBase):
    id: int
    workspace_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
