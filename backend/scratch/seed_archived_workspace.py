import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.database import SessionLocal
from app.models.workspace import Workspace, WorkspaceMember
from app.models.user import User
from app.models.task import Task
from app.models.customer import Customer

def seed_archived_workspace():
    db = SessionLocal()
    try:
        # Create user
        user = db.query(User).filter(User.email == "test_delete@operio.dev").first()
        if not user:
            user = User(email="test_delete@operio.dev", full_name="Test Delete", password_hash="hash")
            db.add(user)
            db.flush()
            
        # Create workspace
        ws = Workspace(name="Test Silinecek", slug="test-silinecek", status="archived")
        db.add(ws)
        db.flush()
        
        # Create member
        member = WorkspaceMember(workspace_id=ws.id, user_id=user.id, role="owner", is_active=True)
        db.add(member)
        db.flush()
        
        # Create customer
        customer = Customer(workspace_id=ws.id, name="Test Customer", status="active")
        db.add(customer)
        db.flush()
        
        # Create task
        task = Task(workspace_id=ws.id, customer_id=customer.id, title="Test Task", status="todo", priority="normal", creator_id=user.id)
        db.add(task)
        db.flush()
        
        db.commit()
        print("Archived workspace created.")
    except Exception as e:
        db.rollback()
        print("Error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    seed_archived_workspace()
