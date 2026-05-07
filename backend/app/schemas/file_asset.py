from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class FileAssetBase(BaseModel):
    category: str
    description: Optional[str] = None
    customer_id: Optional[int] = None
    job_id: Optional[int] = None
    offer_id: Optional[int] = None
    task_id: Optional[int] = None
    finance_entry_id: Optional[int] = None

class FileAssetCreate(FileAssetBase):
    pass

class FileAssetUpdate(BaseModel):
    category: Optional[str] = None
    description: Optional[str] = None
    customer_id: Optional[int] = None
    job_id: Optional[int] = None
    offer_id: Optional[int] = None
    task_id: Optional[int] = None
    finance_entry_id: Optional[int] = None

class FileAssetResponse(FileAssetBase):
    id: int
    workspace_id: int
    uploaded_by_user_id: int
    original_filename: str
    stored_filename: str
    file_path: str
    file_size: int
    mime_type: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
