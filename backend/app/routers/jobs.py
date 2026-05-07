from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.deps import get_current_user, get_current_workspace
from ..models.user import User
from ..models.workspace import Workspace
from ..models.job import Job as JobModel
from ..models.job_stage import JobStage as JobStageModel
from ..schemas.job import Job, JobCreate, JobUpdate
from ..schemas.job_stage import JobStage, JobStageCreate, JobStageUpdate, JobStageTemplateApply
from ..services.activity_service import create_activity
from ..services.notification_service import create_notification, notify_watchers, add_watcher
from datetime import datetime

router = APIRouter()

# --- Job CRUD ---

@router.get("/", response_model=List[Job])
def read_jobs(
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    customer_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    query = db.query(JobModel).filter(JobModel.workspace_id == workspace.id)
    if status:
        query = query.filter(JobModel.status == status)
    if priority:
        query = query.filter(JobModel.priority == priority)
    if customer_id:
        query = query.filter(JobModel.customer_id == customer_id)
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=Job)
def create_job(
    *,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    job_in: JobCreate,
) -> Any:
    job = JobModel(**job_in.dict(), workspace_id=workspace.id)
    db.add(job)
    db.commit()
    db.refresh(job)
    create_activity(db, workspace.id, user.id, "job", job.id, "create", f"{job.title} işi oluşturuldu.")
    
    # Auto-watch for creator and responsible
    add_watcher(db, workspace.id, user.id, "job", job.id)
    if job.responsible_user_id and job.responsible_user_id != user.id:
        add_watcher(db, workspace.id, job.responsible_user_id, "job", job.id)
        create_notification(
            db, workspace.id, job.responsible_user_id, "job_assigned",
            "Yeni İş Atandı",
            f"'{job.title}' işi size atandı.",
            actor_user_id=user.id,
            entity_type="job",
            entity_id=job.id
        )
    return job

@router.get("/{job_id}", response_model=Job)
def read_job(
    job_id: int,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
) -> Any:
    job = db.query(JobModel).filter(JobModel.id == job_id, JobModel.workspace_id == workspace.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.put("/{job_id}", response_model=Job)
def update_job(
    *,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    job_id: int,
    job_in: JobUpdate,
) -> Any:
    job = db.query(JobModel).filter(JobModel.id == job_id, JobModel.workspace_id == workspace.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    old_status = job.status
    update_data = job_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)
    db.add(job)
    db.commit()
    db.refresh(job)
    
    if job.status != old_status:
        notify_watchers(
            db, workspace.id, "job", job.id, "job_status_changed",
            "İş Durumu Değişti",
            f"'{job.title}' işinin durumu '{job.status}' olarak güncellendi.",
            actor_user_id=user.id
        )
    
    create_activity(db, workspace.id, user.id, "job", job.id, "update", f"{job.title} iş bilgileri güncellendi.")
    return job

@router.delete("/{job_id}", response_model=Job)
def delete_job(
    *,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    job_id: int,
) -> Any:
    job = db.query(JobModel).filter(JobModel.id == job_id, JobModel.workspace_id == workspace.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    create_activity(db, workspace.id, user.id, "job", job_id, "delete", f"{job.title} işi silindi.")
    return job

# --- Job Stages ---

@router.get("/{job_id}/stages", response_model=List[JobStage])
def read_job_stages(
    job_id: int,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
) -> Any:
    job = db.query(JobModel).filter(JobModel.id == job_id, JobModel.workspace_id == workspace.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return db.query(JobStageModel).filter(JobStageModel.job_id == job_id).order_by(JobStageModel.order_index.asc()).all()

@router.post("/{job_id}/stages", response_model=JobStage)
def create_job_stage(
    *,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    job_id: int,
    stage_in: JobStageCreate,
) -> Any:
    job = db.query(JobModel).filter(JobModel.id == job_id, JobModel.workspace_id == workspace.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    stage = JobStageModel(**stage_in.dict(), job_id=job_id, workspace_id=workspace.id)
    db.add(stage)
    db.commit()
    db.refresh(stage)
    
    update_job_progress(db, job)
    
    create_activity(db, workspace.id, user.id, "job_stage", stage.id, "create", f"{job.title} işine yeni aşama eklendi: {stage.title}")
    return stage

@router.put("/{job_id}/stages/{stage_id}", response_model=JobStage)
def update_job_stage(
    *,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    job_id: int,
    stage_id: int,
    stage_in: JobStageUpdate,
) -> Any:
    stage = db.query(JobStageModel).filter(
        JobStageModel.id == stage_id, 
        JobStageModel.job_id == job_id,
        JobStageModel.workspace_id == workspace.id
    ).first()
    if not stage:
        raise HTTPException(status_code=404, detail="Stage not found")
    
    update_data = stage_in.dict(exclude_unset=True)
    if update_data.get("status") == "completed" and stage.status != "completed":
        stage.completed_at = datetime.now()
    
    for field, value in update_data.items():
        setattr(stage, field, value)
        
    db.add(stage)
    db.commit()
    db.refresh(stage)
    
    job = db.query(JobModel).filter(JobModel.id == job_id).first()
    update_job_progress(db, job)
    
    create_activity(db, workspace.id, user.id, "job_stage", stage.id, "update", f"{stage.title} aşaması güncellendi (Durum: {stage.status})")
    return stage

@router.post("/{job_id}/stages/apply-template")
def apply_stage_template(
    job_id: int,
    template_in: JobStageTemplateApply,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
) -> Any:
    job = db.query(JobModel).filter(JobModel.id == job_id, JobModel.workspace_id == workspace.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    templates = {
        "furniture_production": [
            "Ölçü Alındı", "Malzeme Hazırlandı", "Üretimde", "Kalite Kontrol", "Montaj Planlandı", "Teslim Edildi"
        ],
        "technical_service": [
            "Talep Alındı", "Servis Planlandı", "Teknik Ekip Atandı", "Parça Bekleniyor", "İşlem Tamamlandı", "Müşteri Onayı Alındı"
        ],
        "agency_project": [
            "Brief Alındı", "Tasarımda", "Revizyonda", "Onaylandı", "Yayına Alındı", "Raporlandı"
        ]
    }
    
    stage_titles = templates.get(template_in.template_name)
    if not stage_titles:
        raise HTTPException(status_code=400, detail="Invalid template name")
    
    # Remove existing stages
    db.query(JobStageModel).filter(JobStageModel.job_id == job_id).delete()
    
    # Add new stages
    for idx, title in enumerate(stage_titles):
        stage = JobStageModel(
            workspace_id=workspace.id,
            job_id=job_id,
            title=title,
            order_index=idx,
            status="pending"
        )
        db.add(stage)
    
    job.progress = 0.0
    db.commit()
    
    create_activity(db, workspace.id, user.id, "job", job.id, "apply_template", f"İş akışı şablonu uygulandı: {template_in.template_name}")
    return {"message": f"Template {template_in.template_name} applied successfully"}

def update_job_progress(db: Session, job: JobModel):
    stages = db.query(JobStageModel).filter(JobStageModel.job_id == job.id).all()
    if not stages:
        return
    
    completed = [s for s in stages if s.status == "completed"]
    progress = (len(completed) / len(stages)) * 100
    job.progress = progress
    
    if progress == 100:
        job.status = "completed"
    elif progress > 0:
        job.status = "in_progress"
        
    db.add(job)
    db.commit()
