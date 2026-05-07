from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, func, JSON, Text
from sqlalchemy.orm import relationship
from ..core.database import Base

class ImportJob(Base):
    __tablename__ = "import_jobs"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    import_type = Column(String, nullable=False) # inventory, customers, jobs, finance, complaints_requests
    filename = Column(String, nullable=False)
    status = Column(String, default="uploaded") # uploaded, previewed, completed, failed
    total_rows = Column(Integer, default=0)
    valid_rows = Column(Integer, default=0)
    invalid_rows = Column(Integer, default=0)
    skipped_rows = Column(Integer, default=0)
    imported_rows = Column(Integer, default=0)
    error_report_json = Column(JSON, nullable=True)
    preview_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    workspace = relationship("Workspace")
    user = relationship("User")
