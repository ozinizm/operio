from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class Login(BaseModel):
    email: EmailStr
    password: str

class Register(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    workspace_name: str
    sector: Optional[str] = None

# ── /auth/me response schemas ─────────────────────────────────────────────────

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: Optional[str] = None
    is_active: bool = True
    is_super_admin: bool = False
    must_change_password: bool = False
    created_at: Optional[datetime] = None

class WorkspaceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sector: Optional[str] = None
    plan: Optional[str] = "free"
    is_active: bool = True

class AuthMeResponse(BaseModel):
    user: UserResponse
    workspace: Optional[WorkspaceResponse] = None
    role: Optional[str] = None

class ChangePassword(BaseModel):
    current_password: str
    new_password: str
    new_password_confirm: str
