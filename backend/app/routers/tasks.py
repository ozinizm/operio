from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.deps import get_current_user, get_current_workspace
from ..models.user import User
from ..models.workspace import Workspace
from ..models.task import Task as TaskModel
from ..schemas.task import Task, TaskCreate, TaskUpdate
from ..services.activity_service import create_activity
from ..services.notification_service import add_watcher
from ..services.task_notification_service import notify_task_assigned, notify_task_status_changed
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[Task])
def read_tasks(
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    status: Optional[str] = None,
    assignee_user_id: Optional[int] = None,
    job_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    from sqlalchemy.orm import joinedload
    query = db.query(TaskModel).options(joinedload(TaskModel.assignee)).filter(
        TaskModel.workspace_id == workspace.id,
        TaskModel.is_deleted == False
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
    task_in: TaskCreate,
) -> Any:
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
        notify_task_assigned(db, workspace.id, user.id, task)
        # Auto-watch for assignee
        add_watcher(db, workspace.id, task.assignee_user_id, "task", task.id)
    
    return task

@router.put("/{task_id}", response_model=Task)
def update_task(
    *,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
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
    
    old_assignee_id = task.assignee_user_id
    old_status = task.status
    
    update_data = task_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
        
    db.add(task)
    db.commit()
    db.refresh(task)
    
    # Notifications
    if task.assignee_user_id and task.assignee_user_id != old_assignee_id:
        notify_task_assigned(db, workspace.id, user.id, task)
        add_watcher(db, workspace.id, task.assignee_user_id, "task", task.id)
        
    if task.status != old_status:
        notify_task_status_changed(db, workspace.id, user.id, task, old_status)
        
    if task.status == "completed" and old_status != "completed":
        create_activity(
            db, workspace.id, user.id, "task", task.id, "task.completed",
            f"{task.title} görevi tamamlandı."
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
