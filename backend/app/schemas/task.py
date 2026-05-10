from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class UserBrief(BaseModel):
    full_name: str
    email: str

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = "todo"
    priority: Optional[str] = "normal"
    assignee_user_id: Optional[int] = None
    due_date: Optional[datetime] = None
    customer_id: Optional[int] = None
    job_id: Optional[int] = None

class TaskCreate(TaskBase):
    title: str

class TaskUpdate(TaskBase):
    pass

class TaskInDBBase(TaskBase):
    id: int
    workspace_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Task(TaskInDBBase):
    assignee: Optional[UserBrief] = None
