from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import datetime

class WorkspaceBase(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    sector: Optional[str] = None
    status: Optional[str] = "pilot"
    plan: Optional[str] = "free"
    logo_url: Optional[str] = None
    primary_contact_name: Optional[str] = None
    primary_contact_email: Optional[str] = None
    primary_contact_phone: Optional[str] = None
    is_active: Optional[bool] = True

class WorkspaceCreate(WorkspaceBase):
    name: str
    slug: str

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
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Platform Admin Schemas
class PlatformWorkspaceCreate(BaseModel):
    name: str
    slug: str
    sector: Optional[str] = None
    status: Optional[str] = "pilot"
    owner_name: str
    owner_email: EmailStr
    owner_password: str
    active_modules: List[str] = []
