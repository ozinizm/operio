from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List

class DeliveryServiceBase(BaseModel):
    title: str
    type: str
    status: str = "planned"
    scheduled_at: datetime
    customer_id: int
    job_id: Optional[int] = None
    assigned_user_id: Optional[int] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    notes: Optional[str] = None
    result_note: Optional[str] = None

class DeliveryServiceCreate(DeliveryServiceBase):
    pass

class DeliveryServiceUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    assigned_user_id: Optional[int] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    notes: Optional[str] = None
    result_note: Optional[str] = None

class DeliveryServiceResponse(DeliveryServiceBase):
    id: int
    workspace_id: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Nested info
    customer_name: Optional[str] = None
    job_title: Optional[str] = None
    assigned_user_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
