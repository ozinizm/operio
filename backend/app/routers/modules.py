from typing import Any, List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from datetime import datetime
from ..core.database import get_db
from ..core.deps import get_current_user, get_current_workspace
from ..models.user import User
from ..models.workspace import Workspace
from ..models.workspace_module import WorkspaceModule
from ..core.module_registry import MODULE_REGISTRY, SECTOR_PACKS
from ..services.activity_service import create_activity

router = APIRouter()

@router.get("/")
def list_modules(
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace)
) -> Any:
    # Fetch existing module settings from DB
    db_modules = db.query(WorkspaceModule).filter(
        WorkspaceModule.workspace_id == workspace.id
    ).all()
    
    settings_map = {m.module_key: m for m in db_modules}
    
    result = []
    for key, definition in MODULE_REGISTRY.items():
        db_m = settings_map.get(key)
        
        is_enabled = definition.is_available
        if db_m:
            is_enabled = db_m.is_enabled
        elif definition.is_core:
            is_enabled = True
        elif not definition.is_available:
            is_enabled = False
        else:
            # Respect registry status (active/passive) for default
            is_enabled = definition.status == 'active'
            
        module_dict = definition.to_dict()
        module_dict["is_enabled"] = is_enabled
        result.append(module_dict)
        
    return result

@router.get("/enabled")
def get_enabled_modules(
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace)
) -> List[str]:
    db_modules = db.query(WorkspaceModule).filter(
        WorkspaceModule.workspace_id == workspace.id,
        WorkspaceModule.is_enabled == False
    ).all()
    
    disabled_keys = {m.module_key for m in db_modules}
    
    return [
        key for key, m in MODULE_REGISTRY.items() 
        if key not in disabled_keys and m.is_available
    ]

@router.get("/sidebar")
def get_sidebar_modules(
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace)
) -> List[Dict[str, Any]]:
    db_modules = db.query(WorkspaceModule).filter(
        WorkspaceModule.workspace_id == workspace.id,
        WorkspaceModule.is_enabled == False
    ).all()
    
    disabled_keys = {m.module_key for m in db_modules}
    
    enabled_defs = [
        m for key, m in MODULE_REGISTRY.items() 
        if key not in disabled_keys and m.is_available
    ]
    
    # Sort by sidebar_order
    enabled_defs.sort(key=lambda x: x.sidebar_order)
    
    return [
        {
            "key": m.key,
            "label": m.sidebar_label,
            "route": m.route,
            "icon": m.icon,
            "order": m.sidebar_order
        }
        for m in enabled_defs
    ]

@router.post("/{module_key}/enable")
def enable_module(
    module_key: str,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user)
) -> Any:
    if module_key not in MODULE_REGISTRY:
        raise HTTPException(status_code=404, detail="Module not found")
        
    definition = MODULE_REGISTRY[module_key]
    if not definition.is_available:
        raise HTTPException(status_code=400, detail="Module is not available yet")
        
    db_m = db.query(WorkspaceModule).filter(
        WorkspaceModule.workspace_id == workspace.id,
        WorkspaceModule.module_key == module_key
    ).first()
    
    if not db_m:
        db_m = WorkspaceModule(
            workspace_id=workspace.id,
            module_key=module_key,
            is_enabled=True,
            enabled_at=datetime.utcnow(),
            enabled_by_user_id=user.id
        )
        db.add(db_m)
    else:
        db_m.is_enabled = True
        db_m.enabled_at = datetime.utcnow()
        db_m.enabled_by_user_id = user.id
        db_m.disabled_at = None
        
    db.commit()
    
    create_activity(
        db, workspace.id, user.id, "module", 0, "enable",
        f"{definition.name} modülü aktif edildi."
    )
    
    return {"message": f"Module {module_key} enabled"}

@router.post("/{module_key}/disable")
def disable_module(
    module_key: str,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user)
) -> Any:
    if module_key not in MODULE_REGISTRY:
        raise HTTPException(status_code=404, detail="Module not found")
        
    definition = MODULE_REGISTRY[module_key]
    if definition.is_core or not definition.can_disable:
        raise HTTPException(status_code=400, detail="Core modules cannot be disabled")
        
    db_m = db.query(WorkspaceModule).filter(
        WorkspaceModule.workspace_id == workspace.id,
        WorkspaceModule.module_key == module_key
    ).first()
    
    if not db_m:
        db_m = WorkspaceModule(
            workspace_id=workspace.id,
            module_key=module_key,
            is_enabled=False,
            disabled_at=datetime.utcnow()
        )
        db.add(db_m)
    else:
        db_m.is_enabled = False
        db_m.disabled_at = datetime.utcnow()
        
    db.commit()
    
    create_activity(
        db, workspace.id, user.id, "module", 0, "disable",
        f"{definition.name} modülü devre dışı bırakıldı."
    )
    
    return {"message": f"Module {module_key} disabled"}

@router.post("/packs/{pack_key}/enable")
def enable_sector_pack(
    pack_key: str,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user)
) -> Any:
    if pack_key not in SECTOR_PACKS:
        raise HTTPException(status_code=404, detail="Sector pack not found")
        
    pack = SECTOR_PACKS[pack_key]
    recommended_keys = pack["recommended"]
    
    for key in recommended_keys:
        if key in MODULE_REGISTRY and MODULE_REGISTRY[key].is_available:
            db_m = db.query(WorkspaceModule).filter(
                WorkspaceModule.workspace_id == workspace.id,
                WorkspaceModule.module_key == key
            ).first()
            
            if not db_m:
                db_m = WorkspaceModule(
                    workspace_id=workspace.id,
                    module_key=key,
                    is_enabled=True,
                    enabled_at=datetime.utcnow(),
                    enabled_by_user_id=user.id
                )
                db.add(db_m)
            else:
                db_m.is_enabled = True
                db_m.enabled_at = datetime.utcnow()
                db_m.enabled_by_user_id = user.id
                db_m.disabled_at = None
                
    db.commit()
    
    create_activity(
        db, workspace.id, user.id, "module_pack", 0, "enable",
        f"{pack['name']} aktif edildi."
    )
    
    return {"message": f"Sector pack {pack_key} enabled"}
