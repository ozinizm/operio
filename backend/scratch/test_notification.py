import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.database import SessionLocal
from app.models.workspace import Workspace
from app.models.user import User
from app.models.task import Task
from app.services.task_notification_service import notify_task_assigned
import logging

logging.basicConfig(level=logging.DEBUG)

def test_notification():
    db = SessionLocal()
    try:
        # Get first available user and workspace
        workspace = db.query(Workspace).first()
        actor = db.query(User).filter(User.email == "admin@operio.dev").first()
        recipient = db.query(User).filter(User.email == "staff@operio.dev").first()
        
        print(f"Workspace: {workspace.id}, Actor: {actor.id}, Recipient: {recipient.id}")
        
        # Mock a task
        task = Task(id=9999, workspace_id=workspace.id, title="Test Notification Task", assignee_user_id=recipient.id)
        
        notify_task_assigned(db, workspace.id, actor.id, task)
        print("Notification creation passed without exceptions")
        
        # Verify db
        from app.models.notification import Notification
        n = db.query(Notification).filter(Notification.entity_id == 9999).first()
        if n:
            print("Notification exists in DB:", n.title)
            db.delete(n)
            db.commit()
        else:
            print("Notification NOT found in DB")
            
    except Exception as e:
        print("Exception:", e)
    finally:
        db.close()

if __name__ == "__main__":
    test_notification()
