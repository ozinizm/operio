from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..core.database import get_db
from ..core.deps import get_current_super_admin
from ..models import (
    User, Workspace, WorkspaceMember, WorkspaceModule, Activity,
    Customer, Job, Offer, Task, FinanceEntry, InventoryItem,
    DeliveryService, RequestTicket, FileAsset, Notification, Comment,
    PlatformSetting, SupportRequest
)
from ..schemas.workspace import Workspace as WorkspaceSchema, WorkspaceCreate, WorkspaceUpdate, PlatformWorkspaceCreate
from ..schemas.platform import PlatformSettingSchema, PlatformSettingUpdate, SupportRequestSchema, SupportRequestUpdate, PlatformUserCreate
from ..core.security import get_password_hash
from ..services.activity_service import log_audit_event
from ..services.email_service import send_email, send_email_background
from ..services import email_templates
from ..models import EmailLog
from datetime import datetime
from pydantic import BaseModel
from fastapi.responses import JSONResponse

# Standard module keys
CORE_MODULES = ["dashboard", "customers", "jobs", "settings"]
ADDITIONAL_MODULES = [
    "offers", "tasks", "operations", "delivery_service", 
    "complaints", "finance", "inventory", "data_import", 
    "reports", "notifications", "files"
]
ALL_MODULES = CORE_MODULES + ADDITIONAL_MODULES

from ..core.module_registry import MODULE_REGISTRY, SECTOR_PACKS
from ..models.workspace_module import WorkspaceModule

router = APIRouter()

@router.get("/available-modules")
def get_available_modules(
    current_super_admin: User = Depends(get_current_super_admin),
) -> List[Any]:
    """Returns all available modules from the registry."""
    return [
        definition.to_dict() 
        for definition in MODULE_REGISTRY.values() 
        if definition.is_available
    ]

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
    background_tasks: BackgroundTasks,
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
        else:
            # If user exists, but we are assigning them as owner of a new workspace 
            # with a provided password, we should update their password and force change.
            # This covers the "first login" flow for platform-created workspaces.
            user.password_hash = get_password_hash(workspace_in.owner_password)
            user.must_change_password = True
            user.is_active = True
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
        
        # 7. Send Welcome Email
        tpl = email_templates.welcome_workspace_admin(
            full_name=user.full_name,
            email=user.email,
            temporary_password=workspace_in.owner_password
        )
        background_tasks.add_task(
            send_email_background,
            to=user.email,
            subject=tpl["subject"],
            html_body=tpl["html"],
            text_body=tpl["text"],
            template_key="welcome_workspace_admin",
            workspace_id=workspace.id,
            user_id=user.id
        )

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

@router.post("/workspaces/{workspace_id}/users")
def create_workspace_user(
    workspace_id: int,
    user_in: PlatformUserCreate,
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(get_current_super_admin),
) -> Any:
    # 1. Check workspace
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # 2. Check if user already exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        # Check if already a member
        member = db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user.id
        ).first()
        if member:
            raise HTTPException(status_code=400, detail="Kullanıcı zaten bu işletmeye kayıtlı.")
    else:
        # Create new user
        user = User(
            email=user_in.email,
            full_name=user_in.full_name,
            password_hash=get_password_hash(user_in.password),
            must_change_password=True,
            is_active=user_in.is_active
        )
        db.add(user)
        db.flush()
    
    # 3. Create membership
    member = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=user.id,
        role=user_in.role,
        is_active=user_in.is_active
    )
    db.add(member)
    
    # 4. Audit Log
    log_audit_event(
        db=db,
        action="user.created",
        entity_type="user",
        entity_id=user.id,
        workspace_id=workspace_id,
        actor_user=current_super_admin,
        description=f"İşletmeye yeni kullanıcı eklendi (Platform): {user.email} (Rol: {user_in.role})"
    )
    
    db.commit()
    
    return {
        "id": member.id,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": member.role,
        "is_active": member.is_active,
        "created_at": member.created_at
    }


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
    background_tasks: BackgroundTasks,
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

    # Send Email Notification
    tpl = email_templates.password_reset_by_admin(
        full_name=user.full_name,
        temporary_password=data.temporary_password
    )
    background_tasks.add_task(
        send_email_background,
        to=user.email,
        subject=tpl["subject"],
        html_body=tpl["html"],
        text_body=tpl["text"],
        template_key="password_reset_by_admin",
        workspace_id=workspace_id,
        user_id=user.id
    )
    
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

@router.get("/workspaces/{workspace_id}/export")
def export_workspace_data(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(get_current_super_admin),
):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Gather metadata
    data = {
        "export_metadata": {
            "timestamp": datetime.now().isoformat(),
            "exported_by": current_super_admin.email,
            "version": "1.0"
        },
        "workspace": {
            "id": workspace.id,
            "name": workspace.name,
            "slug": workspace.slug,
            "sector": workspace.sector,
            "status": workspace.status,
            "plan": workspace.plan,
            "created_at": workspace.created_at.isoformat() if workspace.created_at else None
        },
        "users": [
            {
                "id": m.user.id,
                "email": m.user.email,
                "full_name": m.user.full_name,
                "role": m.role,
                "is_active": m.is_active
            }
            for m in db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace_id).all()
        ],
        "modules": [
            {"key": m.module_key, "is_enabled": m.is_enabled}
            for m in db.query(WorkspaceModule).filter(WorkspaceModule.workspace_id == workspace_id).all()
        ],
        "customers": [
            {"id": c.id, "name": c.name, "email": c.email, "phone": c.phone}
            for c in db.query(Customer).filter(Customer.workspace_id == workspace_id).all()
        ],
        "jobs": [
            {"id": j.id, "title": j.title, "status": j.status}
            for j in db.query(Job).filter(Job.workspace_id == workspace_id).all()
        ],
        "offers": [
            {"id": o.id, "title": o.title, "status": o.status, "total_amount": float(o.total_amount) if o.total_amount else 0}
            for o in db.query(Offer).filter(Offer.workspace_id == workspace_id).all()
        ],
        "tasks": [
            {"id": t.id, "title": t.title, "status": t.status}
            for t in db.query(Task).filter(Task.workspace_id == workspace_id).all()
        ],
        "finance_entries": [
            {"id": f.id, "type": f.type, "amount": float(f.amount) if f.amount else 0, "category": f.category}
            for f in db.query(FinanceEntry).filter(FinanceEntry.workspace_id == workspace_id).all()
        ],
        "inventory": [
            {"id": i.id, "name": i.name, "sku": i.sku, "quantity": i.quantity}
            for i in db.query(InventoryItem).filter(InventoryItem.workspace_id == workspace_id).all()
        ],
        "delivery_services": [
            {"id": d.id, "title": d.title, "status": d.status}
            for d in db.query(DeliveryService).filter(DeliveryService.workspace_id == workspace_id).all()
        ],
        "request_tickets": [
            {"id": r.id, "subject": r.subject, "status": r.status}
            for r in db.query(RequestTicket).filter(RequestTicket.workspace_id == workspace_id).all()
        ],
        "file_metadata": [
            {"id": f.id, "name": f.file_name, "size": f.file_size}
            for f in db.query(FileAsset).filter(FileAsset.workspace_id == workspace_id).all()
        ],
        "audit_logs_count": db.query(Activity).filter(Activity.workspace_id == workspace_id).count()
    }

    log_audit_event(
        db=db,
        action="platform.workspace_exported",
        entity_type="workspace",
        entity_id=workspace.id,
        workspace_id=workspace.id,
        actor_user=current_super_admin,
        description=f"İşletme verileri dışa aktarıldı (Metadata): {workspace.name}"
    )
    db.commit()

    filename = f"operio-workspace-{workspace.slug}-backup-{datetime.now().strftime('%Y-%m-%d')}.json"
    return JSONResponse(
        content=data,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

class HardDeleteRequest(BaseModel):
    confirm_slug: str
    backup_confirmed: bool

@router.delete("/workspaces/{workspace_id}/hard-delete")
def hard_delete_workspace(
    workspace_id: int,
    data: HardDeleteRequest,
    db: Session = Depends(get_db),
    current_super_admin: User = Depends(get_current_super_admin),
):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Safeguards
    if workspace.status != "archived":
        raise HTTPException(status_code=400, detail="Sadece arşivlenmiş işletmeler kalıcı olarak silinebilir.")
    
    if data.confirm_slug != workspace.slug:
        raise HTTPException(status_code=400, detail="İşletme kısa adı (slug) eşleşmiyor.")
    
    if not data.backup_confirmed:
        raise HTTPException(status_code=400, detail="Lütfen yedeği aldığınızı onaylayın.")

    try:
        # Log before deletion (while workspace exists)
        log_audit_event(
            db=db,
            action="platform.workspace_hard_delete_requested",
            entity_type="workspace",
            entity_id=workspace.id,
            workspace_id=workspace.id,
            actor_user=current_super_admin,
            description=f"İşletme kalıcı silme işlemi başlatıldı: {workspace.name} ({workspace.slug})"
        )
        db.flush()

        # Delete all related records in order
        from ..models import (
            EmailLog, ImportJob, JobStage, EntityWatcher
        )
        
        models_to_clean = [
            # 1. Leaf nodes (no other tables depend on these)
            Activity, Comment, Notification, EmailLog, EntityWatcher,
            FileAsset, FinanceEntry, RequestTicket, DeliveryService,
            Task, JobStage, Offer,
            # 2. Mid nodes (depend on Customer, but parents to leaves)
            Job,
            # 3. Root nodes (depend only on Workspace)
            Customer, InventoryItem, ImportJob, WorkspaceModule, WorkspaceMember
        ]
        
        for model in models_to_clean:
            db.query(model).filter(model.workspace_id == workspace_id).delete(synchronize_session=False)

        # Finally delete workspace
        workspace_name = workspace.name
        workspace_slug = workspace.slug
        db.delete(workspace)
        
        # Log global audit (workspace_id will be null)
        log_audit_event(
            db=db,
            action="platform.workspace_hard_deleted",
            entity_type="platform",
            entity_id=0,
            actor_user=current_super_admin,
            description=f"İşletme kalıcı olarak silindi: {workspace_name} ({workspace_slug})"
        )

        db.commit()
        return {"message": f"İşletme '{workspace_name}' başarıyla kalıcı olarak silindi."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Silme işlemi sırasında hata oluştu. Bazı veriler silinememiş olabilir. Hata: {str(e)}")

# --- Platform Settings Management ---

@router.get("/settings", response_model=List[PlatformSettingSchema])
def get_platform_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
):
    return db.query(PlatformSetting).all()

@router.put("/settings")
def update_platform_settings(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
):
    for key, value in data.items():
        setting = db.query(PlatformSetting).filter(PlatformSetting.key == key).first()
        if setting:
            setting.value = str(value)
            setting.updated_by_id = current_user.id
        else:
            new_setting = PlatformSetting(
                key=key,
                value=str(value),
                updated_by_id=current_user.id,
                is_public=key.startswith("support_") or key.startswith("platform_")
            )
            db.add(new_setting)
    
    log_audit_event(
        db=db,
        action="platform.settings.updated",
        entity_type="platform",
        entity_id=0,
        actor_user=current_user,
        description="Sistem ayarları güncellendi."
    )
    
    db.commit()
    return {"message": "Sistem ayarları başarıyla güncellendi."}

# --- Support Requests Management ---

@router.get("/support-requests", response_model=List[SupportRequestSchema])
def get_support_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
):
    return db.query(SupportRequest).order_by(SupportRequest.created_at.desc()).all()

@router.patch("/support-requests/{request_id}")
def update_support_request(
    request_id: int,
    data: SupportRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
):
    req = db.query(SupportRequest).filter(SupportRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Talep bulunamadı.")
    
    if data.status:
        req.status = data.status
        if data.status in ["resolved", "cancelled"]:
            req.resolved_at = datetime.utcnow()
            req.resolved_by_id = current_user.id
            
    if data.note is not None:
        req.note = data.note
        
    db.commit()
    return {"message": "Talep başarıyla güncellendi."}

# --- User Management Helpers ---

@router.get("/users/search-by-email")
def search_user_by_email(
    email: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Bu e-posta ile kayıtlı kullanıcı bulunamadı.")
    
    # Get workspace info
    workspaces = []
    memberships = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == user.id).all()
    for m in memberships:
        ws = db.query(Workspace).filter(Workspace.id == m.workspace_id).first()
        if ws:
            workspaces.append({
                "id": ws.id,
                "name": ws.name,
                "role": m.role
            })
            
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "is_super_admin": user.is_super_admin,
        "workspaces": workspaces
    }

@router.get("/email-logs")
def get_email_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin),
    status: Optional[str] = None,
    template_key: Optional[str] = None,
    recipient_email: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    query = db.query(EmailLog)
    
    if status:
        query = query.filter(EmailLog.status == status)
    if template_key:
        query = query.filter(EmailLog.template_key == template_key)
    if recipient_email:
        query = query.filter(EmailLog.recipient_email.ilike(f"%{recipient_email}%"))
        
    total = query.count()
    logs = query.order_by(EmailLog.created_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "items": [
            {
                "id": log.id,
                "recipient_email": log.recipient_email,
                "subject": log.subject,
                "template_key": log.template_key,
                "status": log.status,
                "error_message": log.error_message,
                "created_at": log.created_at,
                "sent_at": log.sent_at
            } for log in logs
        ]
    }
