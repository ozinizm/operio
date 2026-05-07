from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from .config import settings
from .database import get_db
from ..models.user import User
from ..models.workspace import Workspace, WorkspaceMember
from ..schemas.auth import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=["HS256"]
        )
        token_data = TokenPayload(**payload)
    except (JWTError, Exception):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = db.query(User).filter(User.id == token_data.sub).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def get_current_workspace(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Workspace:
    # Get the active workspace for the user (for MVP, we just take the first active one)
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.user_id == current_user.id,
        WorkspaceMember.is_active == True
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="No active workspace found for user")
        
    workspace = db.query(Workspace).filter(Workspace.id == member.workspace_id).first()
    return workspace

def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_current_workspace_member(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WorkspaceMember:
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.user_id == current_user.id,
        WorkspaceMember.is_active == True
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="No active workspace found for user")
    return member

def check_role(allowed_roles: list):
    def role_checker(member: WorkspaceMember = Depends(get_current_workspace_member)):
        if member.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this resource"
            )
        return member.role
    return role_checker

def get_current_super_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have platform admin permissions"
        )
    return current_user
