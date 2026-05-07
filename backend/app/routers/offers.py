from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.deps import get_current_user, get_current_workspace
from ..models.user import User
from ..models.workspace import Workspace
from ..models.offer import Offer as OfferModel
from ..models.job import Job as JobModel
from ..schemas.offer import Offer, OfferCreate, OfferUpdate
from ..services.activity_service import create_activity
from ..services.notification_service import create_notification, notify_watchers, add_watcher
from datetime import datetime
import random

router = APIRouter()

@router.get("/", response_model=List[Offer])
def read_offers(
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    return db.query(OfferModel).filter(
        OfferModel.workspace_id == workspace.id,
        OfferModel.is_deleted == False
    ).offset(skip).limit(limit).all()

@router.post("/", response_model=Offer)
def create_offer(
    *,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    offer_in: OfferCreate,
) -> Any:
    offer_no = f"OFF-{datetime.now().strftime('%Y%m%d')}-{random.randint(100, 999)}"
    offer = OfferModel(
        **offer_in.dict(),
        workspace_id=workspace.id,
        offer_no=offer_no
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)
    
    create_activity(
        db, workspace.id, user.id, "offer", offer.id, "offer.created",
        f"{offer.title} teklifi oluşturuldu."
    )
    
    # Auto-watch
    add_watcher(db, workspace.id, user.id, "offer", offer.id)
    if offer.responsible_user_id and offer.responsible_user_id != user.id:
        add_watcher(db, workspace.id, offer.responsible_user_id, "offer", offer.id)
        create_notification(
            db, workspace.id, offer.responsible_user_id, "offer_assigned",
            "Yeni Teklif Atandı",
            f"'{offer.title}' teklifi için sorumlu olarak atandınız.",
            actor_user_id=user.id,
            entity_type="offer",
            entity_id=offer.id
        )
    
    return offer

@router.get("/{offer_id}", response_model=Offer)
def read_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
) -> Any:
    offer = db.query(OfferModel).filter(
        OfferModel.id == offer_id, 
        OfferModel.workspace_id == workspace.id,
        OfferModel.is_deleted == False
    ).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    return offer

@router.put("/{offer_id}", response_model=Offer)
def update_offer(
    *,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    offer_id: int,
    offer_in: OfferUpdate,
) -> Any:
    offer = db.query(OfferModel).filter(
        OfferModel.id == offer_id, 
        OfferModel.workspace_id == workspace.id,
        OfferModel.is_deleted == False
    ).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    update_data = offer_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(offer, field, value)
        
    db.add(offer)
    db.commit()
    db.refresh(offer)
    
    create_activity(
        db, workspace.id, user.id, "offer", offer.id, "offer.updated",
        f"{offer.title} teklifi güncellendi."
    )
    
    return offer

@router.delete("/{offer_id}", response_model=Offer)
def delete_offer(
    *,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    offer_id: int,
) -> Any:
    offer = db.query(OfferModel).filter(
        OfferModel.id == offer_id, 
        OfferModel.workspace_id == workspace.id,
        OfferModel.is_deleted == False
    ).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    offer.is_deleted = True
    offer.deleted_at = datetime.now()
    offer.deleted_by_user_id = user.id
    
    db.add(offer)
    db.commit()
    
    create_activity(
        db, workspace.id, user.id, "offer", offer_id, "offer.deleted",
        f"{offer.title} teklifi arşivlendi."
    )
    
    return offer

@router.post("/{offer_id}/convert-to-job")
def convert_offer_to_job(
    offer_id: int,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
) -> Any:
    offer = db.query(OfferModel).filter(
        OfferModel.id == offer_id, 
        OfferModel.workspace_id == workspace.id,
        OfferModel.is_deleted == False
    ).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    if offer.converted_job_id:
        raise HTTPException(status_code=400, detail="Offer already converted to a job")
    
    # Create Job
    job = JobModel(
        workspace_id=workspace.id,
        customer_id=offer.customer_id,
        title=offer.title,
        status="new",
        priority="normal",
        progress=0.0,
        responsible_user_id=offer.responsible_user_id,
        description=offer.description
    )
    db.add(job)
    db.flush() # Get job id
    
    # Update offer
    offer.converted_job_id = job.id
    offer.status = "approved"
    
    db.commit()
    db.refresh(job)
    
    create_activity(
        db, workspace.id, user.id, "offer", offer.id, "offer.converted_to_job",
        f"{offer.title} teklifi işe dönüştürüldü: #{job.id}"
    )
    
    create_activity(
        db, workspace.id, user.id, "job", job.id, "job.created",
        f"Tekliften yeni iş oluşturuldu: {job.title}"
    )
    
    # Notify responsible about conversion
    if job.responsible_user_id:
        add_watcher(db, workspace.id, job.responsible_user_id, "job", job.id)
        create_notification(
            db, workspace.id, job.responsible_user_id, "offer_converted",
            "Teklif İşe Dönüştü",
            f"'{offer.title}' teklifi onaylandı ve işe dönüştürüldü.",
            actor_user_id=user.id,
            entity_type="job",
            entity_id=job.id
        )
    
    return {"job_id": job.id, "message": "Offer converted successfully"}
