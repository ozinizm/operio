from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class FinanceEntryBase(BaseModel):
    type: str # income, expense
    title: str
    description: Optional[str] = None
    amount: float = 0.0
    currency: str = "TRY"
    status: str = "pending"
    category: Optional[str] = None
    due_date: Optional[datetime] = None
    customer_id: Optional[int] = None
    job_id: Optional[int] = None

class FinanceEntryCreate(FinanceEntryBase):
    pass

class FinanceEntryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    customer_id: Optional[int] = None
    job_id: Optional[int] = None

class FinanceEntry(FinanceEntryBase):
    id: int
    workspace_id: int
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class FinanceSummary(BaseModel):
    total_income: float
    total_expense: float
    net_profit: float
    pending_collection: float
    overdue_collection: float
    # monthly charts data can be added later
