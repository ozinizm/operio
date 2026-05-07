from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.deps import get_current_user, get_current_workspace_member
from ..models.watcher import EntityWatcher
from ..schemas.watcher import WatcherCreate, WatcherResponse
from ..services.notification_service import add_watcher

router = APIRouter(prefix="/watchers", tags=["Watchers"])

@router.post("/watch", response_model=WatcherResponse)
def watch_entity(
    watcher_in: WatcherCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    member = Depends(get_current_workspace_member)
):
    watcher = add_watcher(
        db, 
        workspace_id=member.workspace_id,
        user_id=current_user.id,
        entity_type=watcher_in.entity_type,
        entity_id=watcher_in.entity_id
    )
    return watcher

@router.post("/unwatch")
def unwatch_entity(
    watcher_in: WatcherCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    member = Depends(get_current_workspace_member)
):
    watcher = db.query(EntityWatcher).filter(
        EntityWatcher.workspace_id == member.workspace_id,
        EntityWatcher.user_id == current_user.id,
        EntityWatcher.entity_type == watcher_in.entity_type,
        EntityWatcher.entity_id == watcher_in.entity_id
    ).first()
    
    if watcher:
        db.delete(watcher)
        db.commit()
        
    return {"message": "Stopped watching entity"}

@router.get("/", response_model=List[WatcherResponse])
def list_watched_entities(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    member = Depends(get_current_workspace_member)
):
    watchers = db.query(EntityWatcher).filter(
        EntityWatcher.workspace_id == member.workspace_id,
        EntityWatcher.user_id == current_user.id
    ).all()
    return watchers
