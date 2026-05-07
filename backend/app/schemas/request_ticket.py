from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class RequestTicketBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: str
    priority: str = "normal"
    status: str = "new"
    source: str = "internal"
    customer_id: int
    job_id: Optional[int] = None
    delivery_service_id: Optional[int] = None
    assigned_user_id: Optional[int] = None

class RequestTicketCreate(RequestTicketBase):
    pass

class RequestTicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    source: Optional[str] = None
    assigned_user_id: Optional[int] = None
    resolution_note: Optional[str] = None

class RequestTicketResponse(RequestTicketBase):
    id: int
    workspace_id: int
    resolved_at: Optional[datetime] = None
    resolution_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Nested info
    customer_name: Optional[str] = None
    job_title: Optional[str] = None
    assigned_user_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
