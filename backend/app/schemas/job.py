from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from .customer import Customer

class JobBase(BaseModel):
    title: Optional[str] = None
    job_type: Optional[str] = None
    status: Optional[str] = "new"
    priority: Optional[str] = "normal"
    progress: Optional[float] = 0.0
    responsible_user_id: Optional[int] = None
    due_date: Optional[datetime] = None
    description: Optional[str] = None
    customer_id: Optional[int] = None

class JobCreate(JobBase):
    title: str
    customer_id: int

class JobUpdate(JobBase):
    pass

class JobInDBBase(JobBase):
    id: int
    workspace_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Job(JobInDBBase):
    customer: Optional[Customer] = None
