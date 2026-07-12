import logging
from sqlalchemy.orm import Session
from fastapi import BackgroundTasks
from .notification_service import create_notification, notify_watchers
from ..models.task import Task
from ..models.user import User
from ..models.workspace import Workspace
from .email_service import send_email_background
from . import email_templates
from ..core.config import settings

logger = logging.getLogger(__name__)

STATUS_LABELS = {
    "todo": "Yapılacak",
    "in_progress": "İşlemde",
    "review": "İncelemede",
    "completed": "Tamamlandı",
    "overdue": "Gecikti"
}

def notify_task_assigned(db: Session, workspace_id: int, actor_id: int, task: Task, background_tasks: BackgroundTasks):
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
        
        # Prepare email
        assignee = db.query(User).filter(User.id == task.assignee_user_id).first()
        actor = db.query(User).filter(User.id == actor_id).first()
        workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
        
        if assignee and actor and workspace and (settings.RESEND_ENABLED or settings.SMTP_ENABLED):
            email_data = email_templates.task_assigned(
                task_title=task.title,
                priority=task.priority,
                due_date=task.due_date.strftime("%d.%m.%Y") if task.due_date else None,
                assigner_name=actor.full_name,
                workspace_name=workspace.name
            )
            
            background_tasks.add_task(
                send_email_background,
                to=assignee.email,
                subject=email_data["subject"],
                html_body=email_data["html"],
                text_body=email_data["text"],
                template_key="task_assigned",
                workspace_id=workspace_id,
                user_id=assignee.id,
                related_entity_type="task",
                related_entity_id=task.id
            )
            
    except Exception as e:
        logger.error(f"Failed to send task assignment notification: {e}")

def notify_task_status_changed(db: Session, workspace_id: int, actor_id: int, task: Task, old_status: str, background_tasks: BackgroundTasks):
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
        actor = db.query(User).filter(User.id == actor_id).first()
        workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
        
        for user_id in recipient_ids:
            if user_id == actor_id:
                continue
                
            # create_notification already handles user_id == actor_id check but we check above for email
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
            
            # Send Email
            recipient = db.query(User).filter(User.id == user_id).first()
            if recipient and actor and workspace:
                email_data = email_templates.task_status_changed(
                    task_title=task.title,
                    old_status=old_status,
                    new_status=task.status,
                    actor_name=actor.full_name,
                    workspace_name=workspace.name
                )
                
                background_tasks.add_task(
                    send_email_background,
                    to=recipient.email,
                    subject=email_data["subject"],
                    html_body=email_data["html"],
                    text_body=email_data["text"],
                    template_key="task_status_changed",
                    workspace_id=workspace_id,
                    user_id=recipient.id,
                    related_entity_type="task",
                    related_entity_id=task.id
                )
                
    except Exception as e:
        logger.error(f"Failed to send task status change notification: {e}")
