from sqlalchemy.orm import Session
from ..models.notification import Notification
from ..models.watcher import EntityWatcher
from ..models.user import User
from typing import Optional, List

from ..core.broadcaster import broadcaster
from ..schemas.notification import NotificationResponse

def create_notification(
    db: Session,
    workspace_id: int,
    user_id: int,
    type: str,
    title: str,
    message: str,
    actor_user_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None
):
    # Don't notify the actor of their own action
    if user_id == actor_user_id:
        return None
        
    notification = Notification(
        workspace_id=workspace_id,
        user_id=user_id,
        actor_user_id=actor_user_id,
        type=type,
        title=title,
        message=message,
        entity_type=entity_type,
        entity_id=entity_id
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    # Real-time Broadcast via SSE
    try:
        # Use schema to normalize payload
        response_data = NotificationResponse.model_validate(notification)
        if notification.actor:
            response_data.actor_name = notification.actor.full_name
            
        payload = response_data.model_dump(mode='json')
        broadcaster.trigger(user_id, payload)
    except Exception as e:
        print(f"SSE Broadcast failed: {str(e)}")

    return notification

def notify_watchers(
    db: Session,
    workspace_id: int,
    entity_type: str,
    entity_id: int,
    type: str,
    title: str,
    message: str,
    actor_user_id: Optional[int] = None
):
    watchers = db.query(EntityWatcher).filter(
        EntityWatcher.workspace_id == workspace_id,
        EntityWatcher.entity_type == entity_type,
        EntityWatcher.entity_id == entity_id
    ).all()
    
    notifications = []
    for watcher in watchers:
        if watcher.user_id != actor_user_id:
            n = create_notification(
                db, 
                workspace_id=workspace_id,
                user_id=watcher.user_id,
                type=type,
                title=title,
                message=message,
                actor_user_id=actor_user_id,
                entity_type=entity_type,
                entity_id=entity_id
            )
            if n:
                notifications.append(n)
    return notifications

def add_watcher(db: Session, workspace_id: int, user_id: int, entity_type: str, entity_id: int):
    # Check if already watching
    existing = db.query(EntityWatcher).filter(
        EntityWatcher.workspace_id == workspace_id,
        EntityWatcher.user_id == user_id,
        EntityWatcher.entity_type == entity_type,
        EntityWatcher.entity_id == entity_id
    ).first()
    
    if not existing:
        watcher = EntityWatcher(
            workspace_id=workspace_id,
            user_id=user_id,
            entity_type=entity_type,
            entity_id=entity_id
        )
        db.add(watcher)
        db.commit()
        return watcher
    return existing

def notify_mentions(
    db: Session,
    workspace_id: int,
    text: str,
    title: str,
    message: str,
    actor_user_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None
):
    # Simple mention detection: @name or @email
    import re
    # Match @ followed by words (name) or email pattern
    mentions = re.findall(r"@([\w\s.@]+)", text)
    
    notified_user_ids = set()
    
    for mention in mentions:
        mention = mention.strip()
        # Search by email or full name
        user = db.query(User).filter(
            (User.email == mention) | (User.full_name.ilike(f"%{mention}%"))
        ).first()
        
        if user and user.id != actor_user_id and user.id not in notified_user_ids:
            create_notification(
                db,
                workspace_id=workspace_id,
                user_id=user.id,
                type="mention",
                title=title,
                message=message,
                actor_user_id=actor_user_id,
                entity_type=entity_type,
                entity_id=entity_id
            )
            notified_user_ids.add(user.id)
            
    return list(notified_user_ids)
