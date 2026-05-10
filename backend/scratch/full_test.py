import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.database import SessionLocal
from app.models.workspace import Workspace
from app.models.user import User
from app.models.task import Task
from app.models.notification import Notification
from app.services.task_notification_service import notify_task_assigned, notify_task_status_changed
import logging

def full_test():
    db = SessionLocal()
    try:
        # 1. Setup actors
        workspace = db.query(Workspace).first()
        admin = db.query(User).filter(User.email == "admin@operio.dev").first()
        staff = db.query(User).filter(User.email == "staff@operio.dev").first()
        
        print(f"Admin ID: {admin.id}, Staff ID: {staff.id}, Workspace ID: {workspace.id}")
        
        # 2. Clear old test notifications
        db.query(Notification).filter(Notification.entity_id == 8888).delete()
        db.commit()
        
        # 3. Simulate Task Creation (like in tasks.py)
        # In tasks.py: task = TaskModel(..., assignee_user_id=staff.id)
        task = Task(id=8888, workspace_id=workspace.id, title="QA Test Task", assignee_user_id=staff.id, creator_id=admin.id, status="todo")
        db.add(task)
        db.commit()
        db.refresh(task)
        
        # 4. Trigger assignment notification
        if task.assignee_user_id:
            notify_task_assigned(db, workspace.id, admin.id, task)
            
        # 5. Check if notification is created
        n_assign = db.query(Notification).filter(Notification.entity_id == task.id, Notification.type == "task_assigned").first()
        if n_assign:
            print(f"PASS: Assignment notification created. Recipient: {n_assign.user_id}, Actor: {n_assign.actor_user_id}")
        else:
            print("FAIL: Assignment notification NOT created.")
            
        # 6. Simulate Status Change
        old_status = task.status
        task.status = "in_progress"
        db.commit()
        
        notify_task_status_changed(db, workspace.id, staff.id, task, old_status)
        
        # 7. Check if status change notification is created for admin (creator)
        n_status = db.query(Notification).filter(Notification.entity_id == task.id, Notification.type == "task_status_changed").first()
        if n_status:
            print(f"PASS: Status change notification created. Recipient: {n_status.user_id}, Actor: {n_status.actor_user_id}")
        else:
            print("FAIL: Status change notification NOT created.")
            
    finally:
        db.close()

if __name__ == "__main__":
    full_test()
