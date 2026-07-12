from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.deps import get_current_user, require_permission
from ..core.permissions import Permission
from ..models.user import User
from ..models.workspace import Workspace
from ..models.customer import Customer as CustomerModel
from ..schemas.customer import Customer, CustomerCreate, CustomerUpdate
from ..services.activity_service import create_activity
from ..services.notification_service import notify_watchers
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[Customer])
def read_customers(
    db: Session = Depends(get_db),
    member = Depends(require_permission(Permission.CUSTOMER_VIEW)),
    q: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    query = db.query(CustomerModel).filter(
        CustomerModel.workspace_id == member.workspace_id,
        CustomerModel.is_deleted == False
    )
    
    if q:
        query = query.filter(CustomerModel.name.ilike(f"%{q}%"))
    if status:
        query = query.filter(CustomerModel.status == status)
        
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=Customer)
def create_customer(
    *,
    db: Session = Depends(get_db),
    member = Depends(require_permission(Permission.CUSTOMER_CREATE)),
    user: User = Depends(get_current_user),
    customer_in: CustomerCreate,
) -> Any:
    customer = CustomerModel(
        **customer_in.dict(),
        workspace_id=member.workspace_id
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    
    create_activity(
        db, member.workspace_id, user.id, "customer", customer.id, "customer.created",
        f"{customer.name} müşterisi oluşturuldu."
    )
    return customer

@router.get("/{customer_id}", response_model=Customer)
def read_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    member = Depends(require_permission(Permission.CUSTOMER_VIEW)),
) -> Any:
    customer = db.query(CustomerModel).filter(
        CustomerModel.id == customer_id,
        CustomerModel.workspace_id == member.workspace_id,
        CustomerModel.is_deleted == False
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.put("/{customer_id}", response_model=Customer)
@router.patch("/{customer_id}", response_model=Customer)
def update_customer(
    *,
    db: Session = Depends(get_db),
    member = Depends(require_permission(Permission.CUSTOMER_UPDATE)),
    user: User = Depends(get_current_user),
    customer_id: int,
    customer_in: CustomerUpdate,
) -> Any:
    customer = db.query(CustomerModel).filter(
        CustomerModel.id == customer_id,
        CustomerModel.workspace_id == member.workspace_id,
        CustomerModel.is_deleted == False
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_data = customer_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)
        
    db.add(customer)
    db.commit()
    db.refresh(customer)
    
    create_activity(
        db, member.workspace_id, user.id, "customer", customer.id, "customer.updated",
        f"{customer.name} müşteri bilgileri güncellendi."
    )
    notify_watchers(
        db, member.workspace_id, "customer", customer.id, "customer_updated",
        "Müşteri Bilgileri Güncellendi",
        f"{user.full_name}, {customer.name} müşteri bilgilerini güncelledi.",
        actor_user_id=user.id,
    )
    
    return customer

@router.delete("/{customer_id}", response_model=Customer)
def delete_customer(
    *,
    db: Session = Depends(get_db),
    member = Depends(require_permission(Permission.CUSTOMER_DELETE)),
    user: User = Depends(get_current_user),
    customer_id: int,
) -> Any:
    customer = db.query(CustomerModel).filter(
        CustomerModel.id == customer_id,
        CustomerModel.workspace_id == member.workspace_id,
        CustomerModel.is_deleted == False
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    customer.is_deleted = True
    customer.deleted_at = datetime.now()
    customer.deleted_by_user_id = user.id
    
    db.add(customer)
    db.commit()
    
    create_activity(
        db, member.workspace_id, user.id, "customer", customer_id, "customer.deleted",
        f"{customer.name} müşterisi arşivlendi."
    )
    
    return customer


def _set_customer_status(db, member, user, customer_id: int, new_status: str):
    customer = db.query(CustomerModel).filter(
        CustomerModel.id == customer_id,
        CustomerModel.workspace_id == member.workspace_id,
        CustomerModel.is_deleted == False,
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    customer.status = new_status
    db.commit()
    db.refresh(customer)
    create_activity(
        db, member.workspace_id, user.id, "customer", customer.id, "customer.status_changed",
        f"{customer.name} müşteri durumu {new_status} olarak güncellendi.",
    )
    notify_watchers(
        db, member.workspace_id, "customer", customer.id, "customer_status_changed",
        "Müşteri Durumu Güncellendi",
        f"{user.full_name}, {customer.name} müşteri durumunu güncelledi.",
        actor_user_id=user.id,
    )
    return customer


@router.post("/{customer_id}/activate", response_model=Customer)
def activate_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    member=Depends(require_permission(Permission.CUSTOMER_UPDATE)),
    user: User = Depends(get_current_user),
):
    return _set_customer_status(db, member, user, customer_id, "active")


@router.post("/{customer_id}/deactivate", response_model=Customer)
def deactivate_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    member=Depends(require_permission(Permission.CUSTOMER_UPDATE)),
    user: User = Depends(get_current_user),
):
    return _set_customer_status(db, member, user, customer_id, "passive")
