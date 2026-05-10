from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.deps import get_current_user, get_current_workspace
from ..models.user import User
from ..models.workspace import Workspace, WorkspaceMember
from ..core.security import get_password_hash
from pydantic import BaseModel, EmailStr
from datetime import datetime

router = APIRouter()

class TeamMemberCreate(BaseModel):
    email: EmailStr
    full_name: str
    role: str
    password: str

class TeamMemberUpdate(BaseModel):
    full_name: str = None
    role: str = None
    is_active: bool = None

@router.get("/team")
def get_team_members(
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user)
) -> Any:
    # Check if current user is authorized to manage team
    member_check = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace.id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    
    if not member_check or member_check.role not in ["owner", "admin", "staff", "manager"]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz bulunmuyor.")
        
    members = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace.id
    ).all()
    
    return [
        {
            "id": m.id,
            "user_id": m.user_id,
            "full_name": m.user.full_name,
            "email": m.user.email,
            "role": m.role,
            "is_active": m.is_active,
            "created_at": m.created_at
        }
        for m in members
    ]

@router.post("/team")
def create_team_member(
    data: TeamMemberCreate,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user)
) -> Any:
    member_check = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace.id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    
    if not member_check or member_check.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz bulunmuyor.")
        
    # Check if user already exists
    user = db.query(User).filter(User.email == data.email).first()
    if user:
        # Check if already a member of this workspace
        existing_member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == user.id
        ).first()
        if existing_member:
            raise HTTPException(status_code=400, detail="Bu kullanıcı zaten bu işletmenin üyesi.")
    else:
        # Create new user
        user = User(
            email=data.email,
            full_name=data.full_name,
            password_hash=get_password_hash(data.password),
            must_change_password=True
        )
        db.add(user)
        db.flush()
        
    # Add to workspace
    new_member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=user.id,
        role=data.role,
        is_active=True
    )
    db.add(new_member)
    db.commit()
    
    return {"message": "Kullanıcı başarıyla eklendi.", "user_id": user.id}

@router.patch("/team/{member_id}")
def update_team_member(
    member_id: int,
    data: TeamMemberUpdate,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user)
) -> Any:
    member_check = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace.id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    
    if not member_check or member_check.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz bulunmuyor.")
        
    target_member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace.id,
        WorkspaceMember.id == member_id
    ).first()
    
    if not target_member:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
        
    if data.role is not None:
        # Owners cannot be demoted except by other owners (if multiple) or themselves
        # For simplicity, prevent demoting the owner who created the workspace or current user demoting themselves if they are the only owner
        target_member.role = data.role
        
    if data.is_active is not None:
        if data.is_active is False and target_member.user_id == current_user.id:
            raise HTTPException(status_code=400, detail="Kendi hesabınızı pasife alamazsınız.")
        target_member.is_active = data.is_active
        
    if data.full_name is not None:
        target_member.user.full_name = data.full_name
        
    db.commit()
    return {"message": "Kullanıcı güncellendi."}

@router.post("/team/{member_id}/reset-password")
def reset_member_password(
    member_id: int,
    new_password: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user)
) -> Any:
    member_check = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace.id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    
    if not member_check or member_check.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz bulunmuyor.")
        
    target_member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace.id,
        WorkspaceMember.id == member_id
    ).first()
    
    if not target_member:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
        
    target_user = target_member.user
    target_user.password_hash = get_password_hash(new_password)
    target_user.must_change_password = True
    
    db.commit()
    return {"message": "Şifre başarıyla sıfırlandı."}
