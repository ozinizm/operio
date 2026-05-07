from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class InventoryItemBase(BaseModel):
    sku: Optional[str] = None
    name: str
    category: Optional[str] = None
    unit: str
    quantity: float = 0.0
    min_quantity: float = 0.0
    purchase_price: Optional[float] = None
    sale_price: Optional[float] = None
    supplier: Optional[str] = None
    warehouse_location: Optional[str] = None
    notes: Optional[str] = None
    status: str = "active"

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    quantity: Optional[float] = None
    min_quantity: Optional[float] = None
    purchase_price: Optional[float] = None
    sale_price: Optional[float] = None
    supplier: Optional[str] = None
    warehouse_location: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class InventoryItem(InventoryItemBase):
    id: int
    workspace_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class InventorySummary(BaseModel):
    total_items: int
    low_stock_items: int
    out_of_stock_items: int
    total_stock_value: float
    categories_count: int
