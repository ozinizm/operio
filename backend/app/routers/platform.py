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
from ..services.activity_service import log_audit_event
from datetime import datetime
from pydantic import BaseModel

# Standard module keys
CORE_MODULES = ["dashboard", "customers", "jobs", "settings"]
ADDITIONAL_MODULES = [
    "offers", "tasks", "operations", "delivery_service", 
    "complaints", "finance", "inventory", "data_import", 
    "reports", "notifications", "files"
]
ALL_MODULES = CORE_MODULES + ADDITIONAL_MODULES

router = APIRouter()

@router.get("/workspaces", response_model=List[WorkspaceSchema])
def read_workspaces(
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(get_current_super_admin),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    workspaces = db.query(Workspace).offset(skip).limit(limit).all()
    for w in workspaces:
        w.members_count = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == w.id).count()
        w.modules_count = db.query(WorkspaceModule).filter(WorkspaceModule.workspace_id == w.id, WorkspaceModule.is_enabled == True).count()
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
                password_hash=get_password_hash(workspace_in.owner_password),
                must_change_password=True
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
        active_modules_in = workspace_in.active_modules or []
        all_modules_to_create = list(set(CORE_MODULES + active_modules_in))
        
        for module_key in all_modules_to_create:
            if module_key in ALL_MODULES:
                wm = WorkspaceModule(
                    workspace_id=workspace.id,
                    module_key=module_key,
                    is_enabled=True
                )
                db.add(wm)

        # 6. Audit Log
        log_audit_event(
            db=db,
            action="workspace.created",
            entity_type="workspace",
            entity_id=workspace.id,
            workspace_id=workspace.id,
            actor_user=current_super_admin,
            description=f"Yeni işletme oluşturuldu: {workspace.name}"
        )
        
        log_audit_event(
            db=db,
            action="user.created",
            entity_type="user",
            entity_id=user.id,
            workspace_id=workspace.id,
            actor_user=current_super_admin,
            description=f"İşletme sahibi kullanıcısı oluşturuldu: {user.email}"
        )

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
    
    workspace.members_count = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace.id).count()
    workspace.modules_count = db.query(WorkspaceModule).filter(WorkspaceModule.workspace_id == workspace.id, WorkspaceModule.is_enabled == True).count()
    
    return workspace

@router.put("/workspaces/{workspace_id}", response_model=WorkspaceSchema)
def update_workspace_platform(
    workspace_id: int,
    workspace_in: WorkspaceUpdate,
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(get_current_super_admin),
) -> Any:
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    old_status = workspace.status
    update_data = workspace_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(workspace, field, value)
    
    db.add(workspace)
    log_audit_event(
        db=db,
        action="workspace.updated",
        entity_type="workspace",
        entity_id=workspace.id,
        workspace_id=workspace.id,
        actor_user=current_super_admin,
        description=f"İşletme bilgileri güncellendi: {workspace.name}"
    )
    
    if workspace.status != old_status:
        log_audit_event(
            db=db,
            action="workspace.status_changed",
            entity_type="workspace",
            entity_id=workspace.id,
            workspace_id=workspace.id,
            actor_user=current_super_admin,
            description=f"İşletme durumu değişti: {old_status} -> {workspace.status}"
        )

    db.commit()
    db.refresh(workspace)
    return workspace

@router.get("/workspaces/{workspace_id}/members", response_model=List[Any])
def read_workspace_members(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(get_current_super_admin),
) -> Any:
    members = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace_id).all()
    # We want to return member info + user info
    result = []
    for m in members:
        user = db.query(User).filter(User.id == m.user_id).first()
        if user:
            result.append({
                "id": m.id,
                "user_id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": m.role,
                "is_active": m.is_active,
                "created_at": m.created_at
            })
    return result

@router.get("/workspaces/{workspace_id}/modules", response_model=List[Any])
def read_workspace_modules(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(get_current_super_admin),
) -> Any:
    # Get enabled modules from DB
    db_modules = db.query(WorkspaceModule).filter(WorkspaceModule.workspace_id == workspace_id).all()
    enabled_keys = {m.module_key for m in db_modules if m.is_enabled}
    
    # Return all modules with status
    result = []
    for m_key in ALL_MODULES:
        result.append({
            "module_key": m_key,
            "is_enabled": m_key in CORE_MODULES or m_key in enabled_keys,
            "is_core": m_key in CORE_MODULES
        })
    return result

@router.post("/workspaces/{workspace_id}/modules/toggle")
def toggle_workspace_module(
    workspace_id: int,
    module_key: str,
    enabled: bool,
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(get_current_super_admin),
) -> Any:
    if module_key in CORE_MODULES:
        raise HTTPException(status_code=400, detail="Core modules cannot be disabled")
        
    wm = db.query(WorkspaceModule).filter(
        WorkspaceModule.workspace_id == workspace_id,
        WorkspaceModule.module_key == module_key
    ).first()
    
    if not wm:
        wm = WorkspaceModule(
            workspace_id=workspace_id,
            module_key=module_key,
            is_enabled=enabled,
            enabled_at=datetime.utcnow() if enabled else None,
            enabled_by_user_id=current_super_admin.id if enabled else None
        )
        db.add(wm)
    else:
        wm.is_enabled = enabled
        if enabled:
            wm.enabled_at = datetime.utcnow()
            wm.enabled_by_user_id = current_super_admin.id
        else:
            wm.disabled_at = datetime.utcnow()
    
    log_audit_event(
        db=db,
        action="module.enabled" if enabled else "module.disabled",
        entity_type="module",
        entity_id=workspace_id,
        workspace_id=workspace_id,
        actor_user=current_super_admin,
        description=f"Modül {'aktif' if enabled else 'pasif'} edildi: {module_key}"
    )
    
    db.commit()
    
    return {"status": "ok", "module_key": module_key, "is_enabled": enabled}

@router.get("/workspaces/{workspace_id}/activities", response_model=List[Any])
def read_workspace_activities(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(get_current_super_admin),
    skip: int = 0,
    limit: int = 50,
) -> Any:
    logs = db.query(Activity).filter(Activity.workspace_id == workspace_id).order_by(Activity.created_at.desc()).offset(skip).limit(limit).all()
    
    # Return as list of dicts for safer serialization
    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "description": log.description,
            "actor_email": log.actor_email,
            "created_at": log.created_at.isoformat() if log.created_at else None
        })
    return result

@router.get("/audit-logs", response_model=List[Any])
def read_audit_logs(
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(get_current_super_admin),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    logs = db.query(Activity).order_by(Activity.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "description": log.description,
            "actor_email": log.actor_email,
            "created_at": log.created_at.isoformat() if log.created_at else None
        })
    return result

@router.post("/workspaces/{workspace_id}/enter")
def enter_workspace_context(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(get_current_super_admin),
) -> Any:
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    if workspace.status == "archived":
        raise HTTPException(status_code=403, detail="Cannot enter an archived workspace")
        
    # Audit Log
    log_audit_event(
        db=db,
        action="platform.workspace_context_entered",
        entity_type="workspace",
        entity_id=workspace.id,
        workspace_id=workspace.id,
        actor_user=current_super_admin,
        description=f"İşletme paneline yönetici moduyla giriş yapıldı: {workspace.name}",
        metadata={
            "mode": "platform_manager",
            "workspace_slug": workspace.slug
        }
    )
    
    db.commit()
    
    return {
        "workspace_id": workspace.id,
        "workspace_name": workspace.name,
        "workspace_slug": workspace.slug,
        "status": workspace.status,
        "message": "Workspace context ready"
    }

class ResetPasswordRequest(BaseModel):
    temporary_password: str

@router.post("/workspaces/{workspace_id}/users/{user_id}/reset-password")
def reset_user_password(
    workspace_id: int,
    user_id: int,
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(get_current_super_admin),
):
    # Verify user belongs to workspace
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Kullanıcı bu işletmeye ait değil.")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
        
    user.password_hash = get_password_hash(data.temporary_password)
    user.must_change_password = True
    db.commit()
    
    log_audit_event(
        db=db,
        action="user.password_reset",
        entity_type="user",
        entity_id=user.id,
        workspace_id=workspace_id,
        actor_user=current_super_admin,
        description=f"Kullanıcı şifresi sıfırlandı (Platform): {user.email}"
    )
    
    return {"message": "Şifre başarıyla sıfırlandı."}
