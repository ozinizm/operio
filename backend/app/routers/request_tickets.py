from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.deps import get_current_user, get_current_workspace, require_permission
from ..core.permissions import Permission
from ..models.user import User
from ..models.workspace import Workspace
from ..models.request_ticket import RequestTicket as RequestModel
from ..schemas.request_ticket import RequestTicketResponse, RequestTicketCreate, RequestTicketUpdate
from ..services.activity_service import create_activity
from ..services.notification_service import create_notification, notify_watchers, add_watcher
from ..core.entity_access import get_workspace_entity_or_404
from datetime import datetime

router = APIRouter(tags=["Complaints & Requests"], dependencies=[Depends(require_permission(Permission.REQUEST_VIEW))])

@router.get("/", response_model=List[RequestTicketResponse])
def read_requests(
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    customer_id: Optional[int] = None,
    job_id: Optional[int] = None,
    delivery_service_id: Optional[int] = None,
    assigned_user_id: Optional[int] = None,
    status: Optional[str] = None,
    type: Optional[str] = None,
    priority: Optional[str] = None,
    source: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    query = db.query(RequestModel).filter(
        RequestModel.workspace_id == workspace.id,
        RequestModel.is_deleted == False
    )
    
    if customer_id:
        query = query.filter(RequestModel.customer_id == customer_id)
    if job_id:
        query = query.filter(RequestModel.job_id == job_id)
    if delivery_service_id:
        query = query.filter(RequestModel.delivery_service_id == delivery_service_id)
    if assigned_user_id:
        query = query.filter(RequestModel.assigned_user_id == assigned_user_id)
    if status:
        query = query.filter(RequestModel.status == status)
    if type:
        query = query.filter(RequestModel.type == type)
    if priority:
        query = query.filter(RequestModel.priority == priority)
    if source:
        query = query.filter(RequestModel.source == source)
        
    items = query.order_by(RequestModel.created_at.desc()).offset(skip).limit(limit).all()
    
    # Enrichment
    result = []
    for item in items:
        resp = RequestTicketResponse.model_validate(item)
        resp.customer_name = item.customer.name if item.customer else None
        resp.job_title = item.job.title if item.job else None
        resp.assigned_user_name = item.assigned_user.full_name if item.assigned_user else None
        result.append(resp)
        
    return result

@router.post("/", response_model=RequestTicketResponse)
def create_request(
    *,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    request_in: RequestTicketCreate,
) -> Any:
    for entity_type, entity_id in {
        "customer": request_in.customer_id,
        "job": request_in.job_id,
        "delivery_service": request_in.delivery_service_id,
    }.items():
        if entity_id is not None:
            get_workspace_entity_or_404(db, workspace_id=workspace.id, entity_type=entity_type, entity_id=entity_id)
    request = RequestModel(
        **request_in.dict(),
        workspace_id=workspace.id
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    
    create_activity(
        db, workspace.id, user.id, "request_ticket", request.id, "request.created",
        f"Yeni talep oluşturuldu: {request.title} ({request.type})"
    )
    
    # Notifications
    if request.assigned_user_id:
        create_notification(
            db, workspace.id, request.assigned_user_id, "ticket_assigned",
            "Yeni Talep Atandı",
            f"'{request.title}' talebi size atandı. Öncelik: {request.priority}",
            actor_user_id=user.id,
            entity_type="request_ticket",
            entity_id=request.id
        )
        add_watcher(db, workspace.id, request.assigned_user_id, "request_ticket", request.id)
    
    if request.priority == "critical":
        # Notify admins/managers about critical tickets (simple implementation)
        # We could fetch all admins here, but for MVP we just notify assigned or creator
        pass
    
    add_watcher(db, workspace.id, user.id, "request_ticket", request.id)
    
    resp = RequestTicketResponse.model_validate(request)
    resp.customer_name = request.customer.name if request.customer else None
    return resp

@router.get("/{request_id}", response_model=RequestTicketResponse)
def read_request(
    request_id: int,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
) -> Any:
    request = db.query(RequestModel).filter(
        RequestModel.id == request_id,
        RequestModel.workspace_id == workspace.id,
        RequestModel.is_deleted == False
    ).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request ticket not found")
        
    resp = RequestTicketResponse.model_validate(request)
    resp.customer_name = request.customer.name if request.customer else None
    resp.job_title = request.job.title if request.job else None
    resp.assigned_user_name = request.assigned_user.full_name if request.assigned_user else None
    return resp

@router.put("/{request_id}", response_model=RequestTicketResponse)
def update_request(
    *,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    request_id: int,
    request_in: RequestTicketUpdate,
) -> Any:
    request = db.query(RequestModel).filter(
        RequestModel.id == request_id,
        RequestModel.workspace_id == workspace.id,
        RequestModel.is_deleted == False
    ).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request ticket not found")
    
    old_status = request.status
    update_data = request_in.dict(exclude_unset=True)
    for field, entity_type in {
        "customer_id": "customer", "job_id": "job", "delivery_service_id": "delivery_service"
    }.items():
        if update_data.get(field) is not None:
            get_workspace_entity_or_404(db, workspace_id=workspace.id, entity_type=entity_type, entity_id=update_data[field])
    for field, value in update_data.items():
        setattr(request, field, value)
        
    db.add(request)
    db.commit()
    db.refresh(request)
    
    if request.status != old_status:
        notify_watchers(
            db, workspace.id, "request_ticket", request.id, "ticket_status_changed",
            "Talep Durumu Değişti",
            f"'{request.title}' durumu '{request.status}' olarak güncellendi.",
            actor_user_id=user.id
        )
    
    create_activity(
        db, workspace.id, user.id, "request_ticket", request.id, "request.updated",
        f"{request.title} talebi güncellendi."
    )
    
    resp = RequestTicketResponse.model_validate(request)
    resp.customer_name = request.customer.name if request.customer else None
    return resp

@router.post("/{request_id}/resolve", response_model=RequestTicketResponse)
def resolve_request(
    request_id: int,
    resolution_note: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
) -> Any:
    request = db.query(RequestModel).filter(
        RequestModel.id == request_id,
        RequestModel.workspace_id == workspace.id,
        RequestModel.is_deleted == False
    ).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request ticket not found")
        
    request.status = "resolved"
    request.resolved_at = datetime.utcnow()
    request.resolution_note = resolution_note
        
    db.add(request)
    db.commit()
    db.refresh(request)
    
    create_activity(
        db, workspace.id, user.id, "request_ticket", request.id, "request.resolved",
        f"{request.title} talebi çözüldü."
    )
    
    notify_watchers(
        db, workspace.id, "request_ticket", request.id, "ticket_resolved",
        "Talep Çözüldü",
        f"'{request.title}' talebi çözüldü. Not: {resolution_note}",
        actor_user_id=user.id
    )
    
    return request

@router.post("/{request_id}/close", response_model=RequestTicketResponse)
def close_request(
    request_id: int,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
) -> Any:
    request = db.query(RequestModel).filter(
        RequestModel.id == request_id,
        RequestModel.workspace_id == workspace.id,
        RequestModel.is_deleted == False
    ).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request ticket not found")
        
    request.status = "closed"
        
    db.add(request)
    db.commit()
    db.refresh(request)
    
    create_activity(
        db, workspace.id, user.id, "request_ticket", request.id, "request.closed",
        f"{request.title} talebi kapatıldı."
    )
    
    return request

@router.post("/{request_id}/reopen", response_model=RequestTicketResponse)
def reopen_request(
    request_id: int,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
) -> Any:
    request = db.query(RequestModel).filter(
        RequestModel.id == request_id,
        RequestModel.workspace_id == workspace.id,
        RequestModel.is_deleted == False
    ).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request ticket not found")
        
    request.status = "in_progress"
        
    db.add(request)
    db.commit()
    db.refresh(request)
    
    create_activity(
        db, workspace.id, user.id, "request_ticket", request.id, "request.reopened",
        f"{request.title} talebi yeniden açıldı."
    )
    
    notify_watchers(
        db, workspace.id, "request_ticket", request.id, "ticket_reopened",
        "Talep Yeniden Açıldı",
        f"'{request.title}' talebi yeniden işleme alındı.",
        actor_user_id=user.id
    )
    
    return request

@router.delete("/{request_id}")
def delete_request(
    request_id: int,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
) -> Any:
    request = db.query(RequestModel).filter(
        RequestModel.id == request_id,
        RequestModel.workspace_id == workspace.id
    ).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request ticket not found")
        
    request.is_deleted = True
    request.deleted_at = datetime.utcnow()
    request.deleted_by_user_id = user.id
    
    db.add(request)
    db.commit()
    
    create_activity(
        db, workspace.id, user.id, "request_ticket", request_id, "request.deleted",
        f"{request.title} talebi arşivlendi."
    )
    
    return {"message": "Ticket deleted successfully"}
