from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class CustomerBase(BaseModel):
    name: Optional[str] = None
    sector: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = "active"
    responsible_user_id: Optional[int] = None
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    name: str

class CustomerUpdate(CustomerBase):
    pass

class CustomerInDBBase(CustomerBase):
    id: int
    workspace_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Customer(CustomerInDBBase):
    pass
