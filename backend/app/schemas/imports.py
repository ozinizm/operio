from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class ImportJobBase(BaseModel):
    import_type: str
    filename: str
    status: str = "uploaded"
    total_rows: int = 0
    valid_rows: int = 0
    invalid_rows: int = 0
    skipped_rows: int = 0
    imported_rows: int = 0
    error_report_json: Optional[Any] = None
    preview_json: Optional[Any] = None

class ImportJob(ImportJobBase):
    id: int
    workspace_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ImportPreviewResponse(BaseModel):
    import_job_id: int
    total_rows: int
    valid_rows: int
    invalid_rows: int
    skipped_rows: int
    preview_rows: List[dict]
    errors: List[dict]
