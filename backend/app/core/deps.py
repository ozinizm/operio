from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Header, Request, Query
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from .config import settings
from .database import get_db
from .permissions import Permission, has_permission
from ..models.user import User
from ..models.workspace import Workspace, WorkspaceMember
from ..models.workspace_module import WorkspaceModule
from .module_registry import MODULE_REGISTRY
from ..schemas.auth import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_user(
    request: Request,
    db: Session = Depends(get_db), 
    token: Optional[str] = Depends(oauth2_scheme),
    query_token: Optional[str] = Query(None, alias="token")
) -> User:
    final_token = token or request.cookies.get("access_token") or query_token
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

def _resolve_workspace_member(
    request: Request,
    db: Session,
    current_user: User,
) -> WorkspaceMember:
    active_workspace_id = request.headers.get("X-Active-Workspace-Id")

    if current_user.is_super_admin and active_workspace_id:
        try:
            ws_id = int(active_workspace_id)
            workspace = db.query(Workspace).filter(Workspace.id == ws_id).first()
            if not workspace:
                raise HTTPException(status_code=404, detail="Selected workspace not found")
            if workspace.status == "archived":
                raise HTTPException(status_code=403, detail="Cannot access an archived workspace")
            member = db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == ws_id,
                WorkspaceMember.user_id == current_user.id,
                WorkspaceMember.is_active == True,
            ).one_or_none()
            if member:
                return member
            return WorkspaceMember(
                workspace_id=ws_id,
                user_id=current_user.id,
                role="owner",
                is_active=True,
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid workspace ID header")

    query = db.query(WorkspaceMember).filter(
        WorkspaceMember.user_id == current_user.id,
        WorkspaceMember.is_active == True,
    )

    if active_workspace_id:
        try:
            query = query.filter(WorkspaceMember.workspace_id == int(active_workspace_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid workspace ID header")

    # Preserve the existing single-workspace flow while making multi-membership
    # selection deterministic when no explicit workspace header is supplied.
    members = query.order_by(
        WorkspaceMember.workspace_id.asc(),
        WorkspaceMember.id.asc(),
    ).limit(1).all()
    member = members[0] if members else None

    if not member:
        raise HTTPException(status_code=404, detail="No active workspace found for user")
    return member


def get_current_workspace(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Workspace:
    member = _resolve_workspace_member(request, db, current_user)
    workspace = db.query(Workspace).filter(Workspace.id == member.workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="No active workspace found for user")
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
    return _resolve_workspace_member(request, db, current_user)

def check_role(allowed_roles: list):
    def role_checker(member: WorkspaceMember = Depends(get_current_workspace_member)):
        if member.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this resource"
            )
        return member.role
    return role_checker


def require_permission(permission: Permission):
    def permission_checker(
        member: WorkspaceMember = Depends(get_current_workspace_member),
    ) -> WorkspaceMember:
        if not has_permission(member.role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this resource",
            )
        return member

    return permission_checker


def require_module(module_key: str):
    """Reject direct API access when a workspace is not entitled to a module."""
    if module_key not in MODULE_REGISTRY:
        raise ValueError(f"Unknown module key: {module_key}")

    def module_checker(
        db: Session = Depends(get_db),
        member: WorkspaceMember = Depends(get_current_workspace_member),
    ) -> WorkspaceMember:
        definition = MODULE_REGISTRY[module_key]
        if not definition.is_available:
            raise HTTPException(status_code=403, detail="Module is not available")
        if definition.is_core:
            return member
        entitlement = db.query(WorkspaceModule).filter(
            WorkspaceModule.workspace_id == member.workspace_id,
            WorkspaceModule.module_key == module_key,
            WorkspaceModule.is_enabled == True,
        ).first()
        if not entitlement:
            raise HTTPException(status_code=403, detail="Module is not enabled for this workspace")
        return member

    return module_checker

def get_current_super_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have platform admin permissions"
        )
    return current_user
