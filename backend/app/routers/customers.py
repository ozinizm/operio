from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.deps import get_current_user, get_current_workspace
from ..models.user import User
from ..models.workspace import Workspace
from ..models.customer import Customer as CustomerModel
from ..schemas.customer import Customer, CustomerCreate, CustomerUpdate
from ..services.activity_service import create_activity

router = APIRouter()

@router.get("/", response_model=List[Customer])
def read_customers(
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    q: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    query = db.query(CustomerModel).filter(CustomerModel.workspace_id == workspace.id)
    
    if q:
        query = query.filter(CustomerModel.name.ilike(f"%{q}%"))
    if status:
        query = query.filter(CustomerModel.status == status)
        
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=Customer)
def create_customer(
    *,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    customer_in: CustomerCreate,
) -> Any:
    customer = CustomerModel(
        **customer_in.dict(),
        workspace_id=workspace.id
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    
    create_activity(
        db, workspace.id, user.id, "customer", customer.id, "create",
        f"{customer.name} müşterisi oluşturuldu."
    )
    
    return customer

@router.get("/{customer_id}", response_model=Customer)
def read_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
) -> Any:
    customer = db.query(CustomerModel).filter(
        CustomerModel.id == customer_id,
        CustomerModel.workspace_id == workspace.id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.put("/{customer_id}", response_model=Customer)
def update_customer(
    *,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    customer_id: int,
    customer_in: CustomerUpdate,
) -> Any:
    customer = db.query(CustomerModel).filter(
        CustomerModel.id == customer_id,
        CustomerModel.workspace_id == workspace.id
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
        db, workspace.id, user.id, "customer", customer.id, "update",
        f"{customer.name} müşteri bilgileri güncellendi."
    )
    
    return customer

@router.delete("/{customer_id}", response_model=Customer)
def delete_customer(
    *,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    customer_id: int,
) -> Any:
    customer = db.query(CustomerModel).filter(
        CustomerModel.id == customer_id,
        CustomerModel.workspace_id == workspace.id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db.delete(customer)
    db.commit()
    
    create_activity(
        db, workspace.id, user.id, "customer", customer_id, "delete",
        f"{customer.name} müşterisi silindi."
    )
    
    return customer
