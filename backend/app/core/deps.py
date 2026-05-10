from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Header, Request, Query
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
    db: Session = Depends(get_db), 
    token: Optional[str] = Depends(oauth2_scheme),
    query_token: Optional[str] = Query(None, alias="token")
) -> User:
    final_token = token or query_token
    if not final_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(
            final_token, settings.SECRET_KEY, algorithms=["HS256"]
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
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Workspace:
    # Check for platform manager mode (Super Admin switching context)
    active_workspace_id = request.headers.get("X-Active-Workspace-Id")
    
    if current_user.is_super_admin and active_workspace_id:
        try:
            ws_id = int(active_workspace_id)
            workspace = db.query(Workspace).filter(Workspace.id == ws_id).first()
            if not workspace:
                raise HTTPException(status_code=404, detail="Selected workspace not found")
            if workspace.status == "archived":
                raise HTTPException(status_code=403, detail="Cannot access an archived workspace")
            return workspace
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid workspace ID header")

    # Normal user flow or Super Admin without header
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
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WorkspaceMember:
    # Check for platform manager mode (Super Admin switching context)
    active_workspace_id = request.headers.get("X-Active-Workspace-Id")
    
    if current_user.is_super_admin and active_workspace_id:
        try:
            ws_id = int(active_workspace_id)
            # Create a virtual/mock member for the Super Admin in this context
            # Or fetch if they happen to be a member (unlikely for random workspaces)
            member = db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == ws_id,
                WorkspaceMember.user_id == current_user.id
            ).first()
            
            if not member:
                # Return a synthetic member with "admin" or "owner" role for context
                return WorkspaceMember(
                    workspace_id=ws_id,
                    user_id=current_user.id,
                    role="owner", # Give full power in manager mode
                    is_active=True
                )
            return member
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid workspace ID header")

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
