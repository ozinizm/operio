from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class JobStageBase(BaseModel):
    title: str
    status: str = "pending"
    order_index: int = 0
    due_date: Optional[datetime] = None
    notes: Optional[str] = None
    responsible_user_id: Optional[int] = None

class JobStageCreate(JobStageBase):
    pass

class JobStageUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    order_index: Optional[int] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None
    responsible_user_id: Optional[int] = None
    completed_at: Optional[datetime] = None

class JobStage(JobStageBase):
    id: int
    workspace_id: int
    job_id: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class JobStageTemplateApply(BaseModel):
    template_name: str # furniture_production, technical_service, agency_project
