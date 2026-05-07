from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..core.database import get_db
from ..core.deps import get_current_super_admin
from ..models.user import User
from ..models.workspace import Workspace, WorkspaceMember
from ..models.workspace_module import WorkspaceModule
from ..models.activity import Activity
from ..schemas.workspace import Workspace as WorkspaceSchema, WorkspaceCreate, WorkspaceUpdate, PlatformWorkspaceCreate
from ..schemas.user import User as UserSchema
from ..core.security import get_password_hash
from datetime import datetime

router = APIRouter()

@router.get("/workspaces", response_model=List[WorkspaceSchema])
def read_workspaces(
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(get_current_super_admin),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    workspaces = db.query(Workspace).offset(skip).limit(limit).all()
    return workspaces

@router.post("/workspaces", response_model=WorkspaceSchema)
def create_workspace_full(
    *,
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(get_current_super_admin),
    workspace_in: PlatformWorkspaceCreate,
) -> Any:
    # 1. Check if slug or email exists
    if db.query(Workspace).filter(Workspace.slug == workspace_in.slug).first():
        raise HTTPException(status_code=400, detail="Workspace slug already exists")
    
    # Start transaction (FastAPI/SQLAlchemy handles this via db Session)
    try:
        # 2. Create Workspace
        workspace = Workspace(
            name=workspace_in.name,
            slug=workspace_in.slug,
            sector=workspace_in.sector,
            status=workspace_in.status,
            primary_contact_name=workspace_in.owner_name,
            primary_contact_email=workspace_in.owner_email
        )
        db.add(workspace)
        db.flush()

        # 3. Create/Get Owner User
        user = db.query(User).filter(User.email == workspace_in.owner_email).first()
        if not user:
            user = User(
                email=workspace_in.owner_email,
                full_name=workspace_in.owner_name,
                password_hash=get_password_hash(workspace_in.owner_password)
            )
            db.add(user)
            db.flush()

        # 4. Create Membership
        membership = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=user.id,
            role="owner"
        )
        db.add(membership)

        # 5. Active Modules
        # Core modules (always active)
        core_modules = ["dashboard", "customers", "jobs", "tasks", "settings", "modules", "notifications"]
        all_modules = list(set(core_modules + workspace_in.active_modules))
        
        for module_key in all_modules:
            wm = WorkspaceModule(
                workspace_id=workspace.id,
                module_key=module_key,
                is_enabled=True
            )
            db.add(wm)

        # 6. Audit Log
        audit = Activity(
            workspace_id=workspace.id,
            actor_user_id=current_super_admin.id,
            entity_type="workspace",
            entity_id=workspace.id,
            action="create",
            description=f"Yeni işletme oluşturuldu: {workspace.name}"
        )
        db.add(audit)

        db.commit()
        db.refresh(workspace)
        return workspace
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating workspace: {str(e)}")

@router.get("/workspaces/{workspace_id}", response_model=WorkspaceSchema)
def read_workspace(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(get_current_super_admin),
) -> Any:
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace

@router.get("/audit-logs", response_model=List[Any]) # Simplified for now
def read_audit_logs(
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(get_current_super_admin),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    logs = db.query(Activity).order_by(Activity.created_at.desc()).offset(skip).limit(limit).all()
    return logs
