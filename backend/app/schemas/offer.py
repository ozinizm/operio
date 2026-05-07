from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class OfferBase(BaseModel):
    title: str
    description: Optional[str] = None
    amount: float = 0.0
    currency: str = "TRY"
    status: str = "draft"
    valid_until: Optional[datetime] = None
    responsible_user_id: Optional[int] = None
    customer_id: int

class OfferCreate(OfferBase):
    pass

class OfferUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    status: Optional[str] = None
    valid_until: Optional[datetime] = None
    responsible_user_id: Optional[int] = None
    customer_id: Optional[int] = None

class Offer(OfferBase):
    id: int
    workspace_id: int
    offer_no: Optional[str] = None
    converted_job_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
