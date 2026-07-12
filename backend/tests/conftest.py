import os
import sys
from pathlib import Path

import pytest
from fastapi import Request
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("SECRET_KEY", "test-only-secret-key-not-for-production")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from app.core.database import Base, get_db
from app.core.deps import get_current_user
from app.main import app
from app.models.comment import Comment
from app.models.customer import Customer
from app.models.job import Job
from app.models.notification import Notification
from app.models.watcher import EntityWatcher
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.models.workspace_module import WorkspaceModule


@pytest.fixture()
def api_env():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    workspace_a = Workspace(name="Workspace A", slug="workspace-a", status="active")
    workspace_b = Workspace(name="Workspace B", slug="workspace-b", status="active")
    owner = User(email="owner@test.local", full_name="Owner", password_hash="test")
    staff = User(email="staff@test.local", full_name="Staff", password_hash="test")
    other_staff = User(email="other@test.local", full_name="Other Staff", password_hash="test")
    platform_admin = User(email="platform@test.local", full_name="Platform Admin", password_hash="test", is_super_admin=True)
    inactive_staff = User(email="inactive@test.local", full_name="Inactive Staff", password_hash="test")
    outsider = User(email="outsider@test.local", full_name="Outsider", password_hash="test")
    owner_b = User(email="owner-b@test.local", full_name="Owner B", password_hash="test")
    db.add_all([workspace_a, workspace_b, owner, staff, other_staff, platform_admin, inactive_staff, outsider, owner_b])
    db.flush()
    db.add_all([
        WorkspaceMember(workspace_id=workspace_a.id, user_id=owner.id, role="owner", is_active=True),
        WorkspaceMember(workspace_id=workspace_a.id, user_id=staff.id, role="staff", is_active=True),
        WorkspaceMember(workspace_id=workspace_a.id, user_id=other_staff.id, role="staff", is_active=True),
        WorkspaceMember(workspace_id=workspace_a.id, user_id=inactive_staff.id, role="staff", is_active=False),
        WorkspaceMember(workspace_id=workspace_b.id, user_id=outsider.id, role="staff", is_active=True),
        WorkspaceMember(workspace_id=workspace_b.id, user_id=owner_b.id, role="owner", is_active=True),
    ])
    for module_key in ["tasks", "offers", "finance", "files", "reports", "notifications", "delivery_service", "complaints", "inventory", "data_import", "appointments"]:
        db.add(WorkspaceModule(workspace_id=workspace_a.id, module_key=module_key, is_enabled=True))
    customer_a = Customer(name="Customer A", workspace_id=workspace_a.id, status="active")
    customer_b = Customer(name="Customer B", workspace_id=workspace_b.id, status="active")
    db.add_all([customer_a, customer_b])
    db.flush()
    job_a = Job(title="Job A", customer_id=customer_a.id, workspace_id=workspace_a.id)
    job_b = Job(title="Job B", customer_id=customer_b.id, workspace_id=workspace_b.id)
    own_comment = Comment(
        workspace_id=workspace_a.id,
        author_user_id=staff.id,
        entity_type="customer",
        entity_id=customer_a.id,
        body="Own comment",
    )
    other_comment = Comment(
        workspace_id=workspace_a.id,
        author_user_id=other_staff.id,
        entity_type="customer",
        entity_id=customer_a.id,
        body="Other comment",
    )
    db.add_all([job_a, job_b, own_comment, other_comment])
    db.flush()
    db.add_all([
        EntityWatcher(workspace_id=workspace_a.id, user_id=inactive_staff.id, entity_type="customer", entity_id=customer_a.id),
        EntityWatcher(workspace_id=workspace_b.id, user_id=outsider.id, entity_type="customer", entity_id=customer_a.id),
    ])
    db.commit()

    ids = {
        "workspace_a": workspace_a.id,
        "workspace_b": workspace_b.id,
        "owner": owner.id,
        "staff": staff.id,
        "platform_admin": platform_admin.id,
        "other_staff": other_staff.id,
        "inactive_staff": inactive_staff.id,
        "outsider": outsider.id,
        "owner_b": owner_b.id,
        "customer_a": customer_a.id,
        "customer_b": customer_b.id,
        "job_a": job_a.id,
        "job_b": job_b.id,
        "own_comment": own_comment.id,
        "other_comment": other_comment.id,
        "Session": TestingSessionLocal,
    }
    db.close()

    def override_get_db():
        test_db = TestingSessionLocal()
        try:
            yield test_db
        finally:
            test_db.close()

    def override_get_current_user(request: Request):
        user_id = request.headers.get("X-Test-User-Id")
        if not user_id:
            raise AssertionError("X-Test-User-Id is required in permission tests")
        test_db = TestingSessionLocal()
        try:
            return test_db.query(User).filter(User.id == int(user_id)).one()
        finally:
            test_db.close()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    with TestClient(app) as client:
        yield client, ids

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture()
def staff_headers(api_env):
    _, ids = api_env
    return {"X-Test-User-Id": str(ids["staff"])}


@pytest.fixture()
def owner_headers(api_env):
    _, ids = api_env
    return {"X-Test-User-Id": str(ids["owner"])}
