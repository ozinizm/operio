import logging
from sqlalchemy.orm import Session
from .notification_service import create_notification, notify_watchers
from ..models.task import Task

logger = logging.getLogger(__name__)

STATUS_LABELS = {
    "todo": "Yapılacak",
    "in_progress": "İşlemde",
    "review": "İncelemede",
    "completed": "Tamamlandı",
    "overdue": "Gecikti"
}

def notify_task_assigned(db: Session, workspace_id: int, actor_id: int, task: Task):
    """
    Sends notification to the assigned user.
    """
    if not task.assignee_user_id:
        return
        
    try:
        # Don't notify if actor is the same as recipient
        if task.assignee_user_id == actor_id:
            return
            
        create_notification(
            db,
            workspace_id=workspace_id,
            user_id=task.assignee_user_id,
            type="task_assigned",
            title="Yeni Görev Atandı",
            message=f"\"{task.title}\" görevi sana atandı.",
            actor_user_id=actor_id,
            entity_type="task",
            entity_id=task.id
        )
    except Exception as e:
        logger.error(f"Failed to send task assignment notification: {e}")

def notify_task_status_changed(db: Session, workspace_id: int, actor_id: int, task: Task, old_status: str):
    """
    Sends notification to creator, assignee and watchers when status changes.
    """
    if task.status == old_status:
        return
        
    try:
        status_label = STATUS_LABELS.get(task.status, task.status)
        title = "Görev Durumu Güncellendi"
        message = f"\"{task.title}\" görevi \"{status_label}\" olarak güncellendi."
        
        # Collect all potential recipient IDs
        recipient_ids = set()
        if task.creator_id:
            recipient_ids.add(task.creator_id)
        if task.assignee_user_id:
            recipient_ids.add(task.assignee_user_id)
            
        # Add watchers
        from ..models.watcher import EntityWatcher
        watchers = db.query(EntityWatcher).filter(
            EntityWatcher.workspace_id == workspace_id,
            EntityWatcher.entity_type == "task",
            EntityWatcher.entity_id == task.id
        ).all()
        for watcher in watchers:
            recipient_ids.add(watcher.user_id)
            
        # Send notifications
        for user_id in recipient_ids:
            # create_notification already handles user_id == actor_id check
            create_notification(
                db,
                workspace_id=workspace_id,
                user_id=user_id,
                type="task_status_changed",
                title=title,
                message=message,
                actor_user_id=actor_id,
                entity_type="task",
                entity_id=task.id
            )
    except Exception as e:
        logger.error(f"Failed to send task status change notification: {e}")
