from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from ..core.database import get_db
from ..core.deps import get_current_user, get_current_workspace_member
from ..models.notification import Notification
from ..schemas.notification import NotificationResponse
from ..models.task import Task
from ..services.notification_service import create_notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/", response_model=List[NotificationResponse])
def list_notifications(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    member = Depends(get_current_workspace_member)
):
    notifications = db.query(Notification).filter(
        Notification.workspace_id == member.workspace_id,
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(limit).all()
    
    result = []
    for n in notifications:
        nr = NotificationResponse.model_validate(n)
        if n.actor:
            nr.actor_name = n.actor.full_name
        result.append(nr)
    return result

@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    member = Depends(get_current_workspace_member)
):
    count = db.query(Notification).filter(
        Notification.workspace_id == member.workspace_id,
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return {"count": count}

@router.post("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    db.commit()
    return {"message": "Notification marked as read"}

@router.post("/mark-all-read")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    member = Depends(get_current_workspace_member)
):
    db.query(Notification).filter(
        Notification.workspace_id == member.workspace_id,
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({
        "is_read": True,
        "read_at": datetime.utcnow()
    }, synchronize_session=False)
    
    db.commit()
    return {"message": "All notifications marked as read"}

@router.post("/generate-task-reminders")
def generate_task_reminders(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    member = Depends(get_current_workspace_member)
):
    # Only owner/admin/manager
    if member.role not in ["owner", "admin", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
        
    workspace_id = member.workspace_id
    today = datetime.utcnow().date()
    
    # Find tasks due today or overdue
    tasks = db.query(Task).filter(
        Task.workspace_id == workspace_id,
        Task.status != "completed",
        func.date(Task.due_date) <= today
    ).all()
    
    created_count = 0
    for task in tasks:
        if task.assignee_user_id:
            # Avoid duplicates for same task/day
            existing = db.query(Notification).filter(
                Notification.workspace_id == workspace_id,
                Notification.user_id == task.assignee_user_id,
                Notification.entity_type == "task",
                Notification.entity_id == task.id,
                func.date(Notification.created_at) == today,
                Notification.type.in_(["task_due_soon", "task_overdue"])
            ).first()
            
            if not existing:
                type = "task_overdue" if task.due_date.date() < today else "task_due_soon"
                title = "Görev Gecikti" if type == "task_overdue" else "Görev Süresi Yaklaşıyor"
                message = f"'{task.title}' görevi için planlanan süre: {task.due_date.strftime('%d.%m.%Y')}"
                
                create_notification(
                    db,
                    workspace_id=workspace_id,
                    user_id=task.assignee_user_id,
                    type=type,
                    title=title,
                    message=message,
                    actor_user_id=current_user.id,
                    entity_type="task",
                    entity_id=task.id
                )
                created_count += 1
                
    return {"message": f"{created_count} reminders generated"}

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    db.delete(notification)
    db.commit()
    return {"message": "Notification deleted"}
