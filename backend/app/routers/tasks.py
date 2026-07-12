from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.deps import get_current_user, get_current_workspace, get_current_workspace_member
from ..core.permissions import Permission, has_permission
from ..models.user import User
from ..models.workspace import Workspace
from ..models.workspace import WorkspaceMember
from ..models.watcher import EntityWatcher
from ..models.customer import Customer
from ..models.task import Task as TaskModel
from ..schemas.task import Task, TaskCreate, TaskUpdate
from ..services.activity_service import create_activity
from ..services.notification_service import add_watcher
from ..services.task_notification_service import notify_task_assigned, notify_task_status_changed
from datetime import datetime

router = APIRouter()


def validate_task_assignment(db: Session, member: WorkspaceMember, actor_id: int, assignee_id: Optional[int]) -> None:
    if assignee_id is None:
        return
    assignee = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == member.workspace_id,
        WorkspaceMember.user_id == assignee_id,
        WorkspaceMember.is_active == True,
    ).first()
    if not assignee:
        raise HTTPException(status_code=422, detail="Atanan kullanıcı bu workspace içinde aktif değil")
    if assignee_id != actor_id and not has_permission(member.role, Permission.TASK_ASSIGN):
        raise HTTPException(status_code=403, detail="Başka bir kullanıcıya görev atama yetkiniz yok")

@router.get("/", response_model=List[Task])
def read_tasks(
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    status: Optional[str] = None,
    assignee_user_id: Optional[int] = None,
    job_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    from sqlalchemy.orm import joinedload
    from ..models.workspace import WorkspaceMember
    
    query = db.query(TaskModel).options(joinedload(TaskModel.assignee)).filter(
        TaskModel.workspace_id == workspace.id,
        TaskModel.is_deleted == False
    )
    
    # RBAC: Staff can only see tasks assigned to them or created by them
    member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace.id,
        WorkspaceMember.user_id == user.id
    ).first()
    
    if member and member.role == "staff":
        from sqlalchemy import or_
        query = query.filter(
            or_(
                TaskModel.assignee_user_id == user.id,
                TaskModel.creator_id == user.id
            )
        )
    
    if status:
        query = query.filter(TaskModel.status == status)
    if assignee_user_id:
        query = query.filter(TaskModel.assignee_user_id == assignee_user_id)
    if job_id:
        query = query.filter(TaskModel.job_id == job_id)
        
    tasks = query.offset(skip).limit(limit).all()
    return tasks

@router.post("/", response_model=Task)
def create_task(
    *,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    member: WorkspaceMember = Depends(get_current_workspace_member),
    background_tasks: BackgroundTasks,
    task_in: TaskCreate,
) -> Any:
    if not has_permission(member.role, Permission.TASK_CREATE):
        raise HTTPException(status_code=403, detail="Görev oluşturma yetkiniz yok")
    validate_task_assignment(db, member, user.id, task_in.assignee_user_id)
    if task_in.customer_id is not None:
        get_customer = db.query(Customer).filter(Customer.id == task_in.customer_id, Customer.workspace_id == workspace.id).first()
        if not get_customer:
            raise HTTPException(status_code=404, detail="Customer not found")
    task = TaskModel(
        **task_in.dict(),
        workspace_id=workspace.id,
        creator_id=user.id
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    
    create_activity(
        db, workspace.id, user.id, "task", task.id, "task.created",
        f"{task.title} görevi oluşturuldu."
    )
    
    if task.assignee_user_id:
        notify_task_assigned(db, workspace.id, user.id, task, background_tasks)
        # Auto-watch for assignee
        add_watcher(db, workspace.id, task.assignee_user_id, "task", task.id)
    
    return task

@router.put("/{task_id}", response_model=Task)
def update_task(
    *,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    member: WorkspaceMember = Depends(get_current_workspace_member),
    background_tasks: BackgroundTasks,
    task_id: int,
    task_in: TaskUpdate,
) -> Any:
    task = db.query(TaskModel).filter(
        TaskModel.id == task_id,
        TaskModel.workspace_id == workspace.id,
        TaskModel.is_deleted == False
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if member.role == "staff" and task.creator_id != user.id and task.assignee_user_id != user.id:
        raise HTTPException(status_code=403, detail="Bu görevi güncelleme yetkiniz yok")
    
    old_assignee_id = task.assignee_user_id
    old_status = task.status
    
    update_data = task_in.dict(exclude_unset=True)
    if "assignee_user_id" in update_data:
        validate_task_assignment(db, member, user.id, update_data["assignee_user_id"])
    for field, value in update_data.items():
        setattr(task, field, value)
        
    db.add(task)
    db.commit()
    db.refresh(task)
    
    # Notifications
    if task.assignee_user_id and task.assignee_user_id != old_assignee_id:
        notify_task_assigned(db, workspace.id, user.id, task, background_tasks)
        add_watcher(db, workspace.id, task.assignee_user_id, "task", task.id)
    if old_assignee_id and old_assignee_id != task.assignee_user_id:
        db.query(EntityWatcher).filter(
            EntityWatcher.workspace_id == workspace.id,
            EntityWatcher.user_id == old_assignee_id,
            EntityWatcher.entity_type == "task",
            EntityWatcher.entity_id == task.id,
        ).delete(synchronize_session=False)
        db.commit()
        
    if task.status != old_status:
        notify_task_status_changed(db, workspace.id, user.id, task, old_status, background_tasks)
        
    if task.status == "completed" and old_status != "completed":
        create_activity(
            db, workspace.id, user.id, "task", task.id, "task.completed",
            f"{task.title} görevi tamamlandı."
        )
        if task.customer_id:
            customer = db.query(Customer).filter(Customer.id == task.customer_id, Customer.workspace_id == workspace.id).first()
            if customer:
                create_activity(
                    db, workspace.id, user.id, "customer", customer.id, "customer.task_completed",
                    f"{user.full_name}, {customer.name} müşterisine bağlı “{task.title}” görevini tamamladı."
                )
    else:
        create_activity(
            db, workspace.id, user.id, "task", task.id, "task.updated",
            f"{task.title} görevi güncellendi."
        )
    
    return task

@router.delete("/{task_id}", response_model=Task)
def delete_task(
    *,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    task_id: int,
) -> Any:
    task = db.query(TaskModel).filter(
        TaskModel.id == task_id,
        TaskModel.workspace_id == workspace.id,
        TaskModel.is_deleted == False
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.is_deleted = True
    task.deleted_at = datetime.now()
    task.deleted_by_user_id = user.id
    
    db.add(task)
    db.commit()
    
    create_activity(
        db, workspace.id, user.id, "task", task_id, "task.deleted",
        f"{task.title} görevi arşivlendi."
    )
    
    return task
