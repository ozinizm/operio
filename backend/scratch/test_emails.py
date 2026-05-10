import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.models.task import Task
from app.models.user import User
from app.models.workspace import Workspace
from app.services.task_notification_service import notify_task_assigned, notify_task_status_changed
from app.services.email_service import send_email_background
from app.models.email_log import EmailLog
from fastapi import BackgroundTasks

def test_email_simulation():
    db = SessionLocal()
    try:
        # Create a mock BackgroundTasks instance
        bg_tasks = BackgroundTasks()
        
        # We need a task, an actor, and an assignee.
        workspace = db.query(Workspace).first()
        task = db.query(Task).first()
        owner = db.query(User).filter(User.id == task.creator_id).first()
        assignee = db.query(User).filter(User.id == task.assignee_user_id).first()
        
        if not all([workspace, task, owner, assignee]):
            print("Need data to test")
            return
            
        print("Testing notify_task_assigned...")
        notify_task_assigned(db, workspace.id, owner.id, task, bg_tasks)
        
        print("Testing notify_task_status_changed...")
        notify_task_status_changed(db, workspace.id, owner.id, task, "todo", bg_tasks)
        
        print(f"Background tasks enqueued: {len(bg_tasks.tasks)}")
        
        # Execute background tasks
        for bg_task in bg_tasks.tasks:
            print(f"Executing: {bg_task.func.__name__} with kwargs: {bg_task.kwargs.get('template_key')}")
            bg_task.func(*bg_task.args, **bg_task.kwargs)
            
        # Check email logs
        logs = db.query(EmailLog).order_by(EmailLog.id.desc()).limit(2).all()
        for log in logs:
            print(f"Log ID: {log.id}, Template: {log.template_key}, Status: {log.status}, Recipient: {log.recipient_email}")
            
    finally:
        db.close()

if __name__ == "__main__":
    test_email_simulation()
