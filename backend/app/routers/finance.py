from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..core.database import get_db
from ..core.deps import get_current_user, get_current_workspace, check_role
from ..models.user import User
from ..models.workspace import Workspace
from ..models.finance import FinanceEntry as FinanceModel
from ..schemas.finance import FinanceEntry, FinanceEntryCreate, FinanceEntryUpdate, FinanceSummary
from ..services.activity_service import create_activity
from datetime import datetime

router = APIRouter()

# Allowed roles for finance: owner, admin, finance
finance_access = Depends(check_role(["owner", "admin", "finance"]))

@router.get("/entries", response_model=List[FinanceEntry])
def read_finance_entries(
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    type: Optional[str] = None,
    status: Optional[str] = None,
    customer_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    _ = finance_access
) -> Any:
    query = db.query(FinanceModel).filter(FinanceModel.workspace_id == workspace.id)
    if type:
        query = query.filter(FinanceModel.type == type)
    if status:
        query = query.filter(FinanceModel.status == status)
    if customer_id:
        query = query.filter(FinanceModel.customer_id == customer_id)
    return query.offset(skip).limit(limit).all()

@router.post("/entries", response_model=FinanceEntry)
def create_finance_entry(
    *,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    entry_in: FinanceEntryCreate,
    _ = finance_access
) -> Any:
    entry = FinanceModel(
        **entry_in.dict(),
        workspace_id=workspace.id
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    
    create_activity(
        db, workspace.id, user.id, "finance", entry.id, "create",
        f"{entry.title} finans kaydı oluşturuldu ({entry.amount} {entry.currency})."
    )
    
    return entry

@router.get("/summary", response_model=FinanceSummary)
def get_finance_summary(
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    _ = finance_access
) -> Any:
    base_query = db.query(FinanceModel).filter(FinanceModel.workspace_id == workspace.id)
    
    total_income = db.query(func.sum(FinanceModel.amount)).filter(
        FinanceModel.workspace_id == workspace.id,
        FinanceModel.type == "income",
        FinanceModel.status == "paid"
    ).scalar() or 0.0
    
    total_expense = db.query(func.sum(FinanceModel.amount)).filter(
        FinanceModel.workspace_id == workspace.id,
        FinanceModel.type == "expense",
        FinanceModel.status == "paid"
    ).scalar() or 0.0
    
    pending_collection = db.query(func.sum(FinanceModel.amount)).filter(
        FinanceModel.workspace_id == workspace.id,
        FinanceModel.type == "income",
        FinanceModel.status == "pending"
    ).scalar() or 0.0
    
    overdue_collection = db.query(func.sum(FinanceModel.amount)).filter(
        FinanceModel.workspace_id == workspace.id,
        FinanceModel.type == "income",
        FinanceModel.status == "overdue"
    ).scalar() or 0.0
    
    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "net_profit": total_income - total_expense,
        "pending_collection": pending_collection,
        "overdue_collection": overdue_collection
    }

@router.get("/entries/{entry_id}", response_model=FinanceEntry)
def read_finance_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    _ = finance_access
) -> Any:
    entry = db.query(FinanceModel).filter(FinanceModel.id == entry_id, FinanceModel.workspace_id == workspace.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry

@router.put("/entries/{entry_id}", response_model=FinanceEntry)
def update_finance_entry(
    *,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    entry_id: int,
    entry_in: FinanceEntryUpdate,
    _ = finance_access
) -> Any:
    entry = db.query(FinanceModel).filter(FinanceModel.id == entry_id, FinanceModel.workspace_id == workspace.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    update_data = entry_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entry, field, value)
        
    db.add(entry)
    db.commit()
    db.refresh(entry)
    
    create_activity(
        db, workspace.id, user.id, "finance", entry.id, "update",
        f"{entry.title} finans kaydı güncellendi."
    )
    
    return entry

@router.delete("/entries/{entry_id}", response_model=FinanceEntry)
def delete_finance_entry(
    *,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    entry_id: int,
    _ = finance_access
) -> Any:
    entry = db.query(FinanceModel).filter(FinanceModel.id == entry_id, FinanceModel.workspace_id == workspace.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    db.delete(entry)
    db.commit()
    
    create_activity(
        db, workspace.id, user.id, "finance", entry_id, "delete",
        f"{entry.title} finans kaydı silindi."
    )
    
    return entry
