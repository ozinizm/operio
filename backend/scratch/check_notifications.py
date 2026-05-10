import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.database import SessionLocal
from app.models.notification import Notification
from app.models.user import User

def check_notifications():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "staff@operio.dev").first()
        print(f"Staff User ID: {user.id}")
        
        notifications = db.query(Notification).filter(Notification.user_id == user.id).all()
        print(f"Total notifications for Staff: {len(notifications)}")
        for n in notifications:
            print(f"- ID: {n.id}, Type: {n.type}, Title: {n.title}, Workspace: {n.workspace_id}, IsRead: {n.is_read}, Entity: {n.entity_id}")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_notifications()
