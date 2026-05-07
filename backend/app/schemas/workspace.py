from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class WorkspaceBase(BaseModel):
    name: Optional[str] = None
    sector: Optional[str] = None
    plan: Optional[str] = "free"
    is_active: Optional[bool] = True

class WorkspaceCreate(WorkspaceBase):
    name: str

class WorkspaceUpdate(WorkspaceBase):
    pass

class WorkspaceInDBBase(WorkspaceBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Workspace(WorkspaceInDBBase):
    pass

class WorkspaceMemberBase(BaseModel):
    workspace_id: int
    user_id: int
    role: str
    is_active: bool = True

class WorkspaceMemberCreate(WorkspaceMemberBase):
    pass

class WorkspaceMember(WorkspaceMemberBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
