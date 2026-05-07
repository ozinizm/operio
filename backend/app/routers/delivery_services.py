from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.deps import get_current_user, get_current_workspace
from ..models.user import User
from ..models.workspace import Workspace
from ..models.delivery_service import DeliveryService as DeliveryModel
from ..schemas.delivery_service import DeliveryServiceResponse, DeliveryServiceCreate, DeliveryServiceUpdate
from ..services.activity_service import create_activity
from ..services.notification_service import create_notification, notify_watchers, add_watcher
from datetime import datetime

router = APIRouter(tags=["Delivery & Service"])

@router.get("/", response_model=List[DeliveryServiceResponse])
def read_delivery_services(
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    customer_id: Optional[int] = None,
    job_id: Optional[int] = None,
    assigned_user_id: Optional[int] = None,
    status: Optional[str] = None,
    type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    query = db.query(DeliveryModel).filter(
        DeliveryModel.workspace_id == workspace.id,
        DeliveryModel.is_deleted == False
    )
    
    if customer_id:
        query = query.filter(DeliveryModel.customer_id == customer_id)
    if job_id:
        query = query.filter(DeliveryModel.job_id == job_id)
    if assigned_user_id:
        query = query.filter(DeliveryModel.assigned_user_id == assigned_user_id)
    if status:
        query = query.filter(DeliveryModel.status == status)
    if type:
        query = query.filter(DeliveryModel.type == type)
    if start_date:
        query = query.filter(DeliveryModel.scheduled_at >= start_date)
    if end_date:
        query = query.filter(DeliveryModel.scheduled_at <= end_date)
        
    items = query.order_by(DeliveryModel.scheduled_at.asc()).offset(skip).limit(limit).all()
    
    # Enrichment
    result = []
    for item in items:
        resp = DeliveryServiceResponse.model_validate(item)
        resp.customer_name = item.customer.name if item.customer else None
        resp.job_title = item.job.title if item.job else None
        resp.assigned_user_name = item.assigned_user.full_name if item.assigned_user else None
        result.append(resp)
        
    return result

@router.post("/", response_model=DeliveryServiceResponse)
def create_delivery_service(
    *,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    delivery_in: DeliveryServiceCreate,
) -> Any:
    delivery = DeliveryModel(
        **delivery_in.dict(),
        workspace_id=workspace.id
    )
    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    
    create_activity(
        db, workspace.id, user.id, "delivery_service", delivery.id, "delivery.created",
        f"Yeni {delivery.type} planlaması yapıldı: {delivery.title}"
    )
    
    # Notifications
    if delivery.assigned_user_id:
        create_notification(
            db, workspace.id, delivery.assigned_user_id, "delivery_assigned",
            "Yeni Teslimat/Servis Atandı",
            f"'{delivery.title}' için görevlendirildiniz. Tarih: {delivery.scheduled_at.strftime('%d.%m.%Y %H:%M')}",
            actor_user_id=user.id,
            entity_type="delivery_service",
            entity_id=delivery.id
        )
        add_watcher(db, workspace.id, delivery.assigned_user_id, "delivery_service", delivery.id)
    
    # Auto-watch for creator
    add_watcher(db, workspace.id, user.id, "delivery_service", delivery.id)
    
    resp = DeliveryServiceResponse.model_validate(delivery)
    resp.customer_name = delivery.customer.name if delivery.customer else None
    return resp

@router.get("/{delivery_id}", response_model=DeliveryServiceResponse)
def read_delivery_service(
    delivery_id: int,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
) -> Any:
    delivery = db.query(DeliveryModel).filter(
        DeliveryModel.id == delivery_id,
        DeliveryModel.workspace_id == workspace.id,
        DeliveryModel.is_deleted == False
    ).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery/Service record not found")
        
    resp = DeliveryServiceResponse.model_validate(delivery)
    resp.customer_name = delivery.customer.name if delivery.customer else None
    resp.job_title = delivery.job.title if delivery.job else None
    resp.assigned_user_name = delivery.assigned_user.full_name if delivery.assigned_user else None
    return resp

@router.put("/{delivery_id}", response_model=DeliveryServiceResponse)
def update_delivery_service(
    *,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    delivery_id: int,
    delivery_in: DeliveryServiceUpdate,
) -> Any:
    delivery = db.query(DeliveryModel).filter(
        DeliveryModel.id == delivery_id,
        DeliveryModel.workspace_id == workspace.id,
        DeliveryModel.is_deleted == False
    ).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery/Service record not found")
    
    old_status = delivery.status
    update_data = delivery_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(delivery, field, value)
        
    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    
    if delivery.status != old_status:
        notify_watchers(
            db, workspace.id, "delivery_service", delivery.id, "delivery_status_changed",
            "Durum Güncellendi",
            f"'{delivery.title}' durumu '{delivery.status}' olarak güncellendi.",
            actor_user_id=user.id
        )
    
    create_activity(
        db, workspace.id, user.id, "delivery_service", delivery.id, "delivery.updated",
        f"{delivery.title} planlaması güncellendi."
    )
    
    resp = DeliveryServiceResponse.model_validate(delivery)
    resp.customer_name = delivery.customer.name if delivery.customer else None
    return resp

@router.post("/{delivery_id}/complete", response_model=DeliveryServiceResponse)
def complete_delivery_service(
    delivery_id: int,
    result_note: Optional[str] = None,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
) -> Any:
    delivery = db.query(DeliveryModel).filter(
        DeliveryModel.id == delivery_id,
        DeliveryModel.workspace_id == workspace.id,
        DeliveryModel.is_deleted == False
    ).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery/Service record not found")
        
    delivery.status = "completed"
    delivery.completed_at = datetime.utcnow()
    if result_note:
        delivery.result_note = result_note
        
    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    
    create_activity(
        db, workspace.id, user.id, "delivery_service", delivery.id, "delivery.completed",
        f"{delivery.title} tamamlandı."
    )
    
    # If linked to job, log activity on job
    if delivery.job_id:
        create_activity(
            db, workspace.id, user.id, "job", delivery.job_id, "delivery_completed",
            f"İşle ilgili {delivery.type} kaydı tamamlandı: {delivery.title}"
        )
        
    notify_watchers(
        db, workspace.id, "delivery_service", delivery.id, "delivery_completed",
        "İşlem Tamamlandı",
        f"'{delivery.title}' başarıyla tamamlandı.",
        actor_user_id=user.id
    )
    
    return delivery

@router.post("/{delivery_id}/postpone", response_model=DeliveryServiceResponse)
def postpone_delivery_service(
    delivery_id: int,
    new_date: datetime,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
) -> Any:
    delivery = db.query(DeliveryModel).filter(
        DeliveryModel.id == delivery_id,
        DeliveryModel.workspace_id == workspace.id,
        DeliveryModel.is_deleted == False
    ).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery/Service record not found")
        
    delivery.status = "postponed"
    delivery.scheduled_at = new_date
    if reason:
        delivery.notes = (delivery.notes or "") + f"\n[Erteleme Nedeni]: {reason}"
        
    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    
    create_activity(
        db, workspace.id, user.id, "delivery_service", delivery.id, "delivery.postponed",
        f"{delivery.title} ertelendi. Yeni tarih: {new_date.strftime('%d.%m.%Y %H:%M')}"
    )
    
    notify_watchers(
        db, workspace.id, "delivery_service", delivery.id, "delivery_postponed",
        "İşlem Ertelendi",
        f"'{delivery.title}' ertelendi. Yeni tarih: {new_date.strftime('%d.%m.%Y %H:%M')}",
        actor_user_id=user.id
    )
    
    return delivery

@router.post("/{delivery_id}/cancel", response_model=DeliveryServiceResponse)
def cancel_delivery_service(
    delivery_id: int,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
) -> Any:
    delivery = db.query(DeliveryModel).filter(
        DeliveryModel.id == delivery_id,
        DeliveryModel.workspace_id == workspace.id,
        DeliveryModel.is_deleted == False
    ).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery/Service record not found")
        
    delivery.status = "cancelled"
    if reason:
        delivery.result_note = f"İptal Nedeni: {reason}"
        
    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    
    create_activity(
        db, workspace.id, user.id, "delivery_service", delivery.id, "delivery.cancelled",
        f"{delivery.title} iptal edildi."
    )
    
    notify_watchers(
        db, workspace.id, "delivery_service", delivery.id, "delivery_cancelled",
        "İşlem İptal Edildi",
        f"'{delivery.title}' iptal edildi.",
        actor_user_id=user.id
    )
    
    return delivery

@router.delete("/{delivery_id}")
def delete_delivery_service(
    delivery_id: int,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
) -> Any:
    delivery = db.query(DeliveryModel).filter(
        DeliveryModel.id == delivery_id,
        DeliveryModel.workspace_id == workspace.id
    ).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery/Service record not found")
        
    delivery.is_deleted = True
    delivery.deleted_at = datetime.utcnow()
    delivery.deleted_by_user_id = user.id
    
    db.add(delivery)
    db.commit()
    
    create_activity(
        db, workspace.id, user.id, "delivery_service", delivery_id, "delivery.deleted",
        f"{delivery.title} kaydı arşivlendi."
    )
    
    return {"message": "Record deleted successfully"}
