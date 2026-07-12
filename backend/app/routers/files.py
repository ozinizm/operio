import os
import uuid
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, get_current_workspace_member, require_permission
from app.core.permissions import Permission
from app.models.file_asset import FileAsset
from app.schemas.file_asset import FileAssetResponse, FileAssetUpdate
from app.core.config import settings
from app.services.activity_service import create_activity
from app.services.notification_service import notify_watchers, add_watcher
from app.core.entity_access import get_workspace_entity_or_404
from datetime import datetime

router = APIRouter(prefix="/files", tags=["Files"], dependencies=[Depends(require_permission(Permission.FILE_VIEW))])

ALLOWED_EXTENSIONS = {
    "pdf", "doc", "docx", "xls", "xlsx", "csv", 
    "jpg", "jpeg", "png", "webp", "txt"
}

def get_workspace_upload_dir(workspace_id: int):
    path = os.path.join(settings.UPLOAD_DIR, str(workspace_id))
    if not os.path.exists(path):
        os.makedirs(path, exist_ok=True)
    return path

@router.post("/upload", response_model=FileAssetResponse)
async def upload_file(
    file: UploadFile = File(...),
    category: str = Form(...),
    description: Optional[str] = Form(None),
    customer_id: Optional[int] = Form(None),
    job_id: Optional[int] = Form(None),
    offer_id: Optional[int] = Form(None),
    task_id: Optional[int] = Form(None),
    finance_entry_id: Optional[int] = Form(None),
    delivery_service_id: Optional[int] = Form(None),
    request_ticket_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    member = Depends(get_current_workspace_member),
    permission_member = Depends(require_permission(Permission.FILE_WRITE)),
):
    # Validate extension
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type .{ext} not allowed")

    # Validate size (approximate check before reading)
    # file.file.seek(0, 2)
    # size = file.file.tell()
    # file.file.seek(0)
    # if size > settings.MAX_UPLOAD_MB * 1024 * 1024:
    #     raise HTTPException(status_code=400, detail="File too large")

    workspace_id = member.workspace_id
    related_entities = {
        "customer": customer_id,
        "job": job_id,
        "offer": offer_id,
        "task": task_id,
        "finance_entry": finance_entry_id,
        "delivery_service": delivery_service_id,
        "request_ticket": request_ticket_id,
    }
    for entity_type, entity_id in related_entities.items():
        if entity_id is not None:
            get_workspace_entity_or_404(
                db, workspace_id=workspace_id, entity_type=entity_type, entity_id=entity_id
            )
    upload_dir = get_workspace_upload_dir(workspace_id)
    
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")

    file_size = os.path.getsize(file_path)
    
    # Check size again
    if file_size > settings.MAX_UPLOAD_MB * 1024 * 1024:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"File too large (Max {settings.MAX_UPLOAD_MB}MB)")

    new_file = FileAsset(
        workspace_id=workspace_id,
        uploaded_by_user_id=current_user.id,
        customer_id=customer_id,
        job_id=job_id,
        offer_id=offer_id,
        task_id=task_id,
        finance_entry_id=finance_entry_id,
        delivery_service_id=delivery_service_id,
        request_ticket_id=request_ticket_id,
        original_filename=file.filename,
        stored_filename=unique_filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type,
        category=category,
        description=description
    )
    
    db.add(new_file)
    db.commit()
    db.refresh(new_file)
    
    # Log activity
    create_activity(
        db, 
        workspace_id=workspace_id,
        actor_id=current_user.id,
        action="file.created",
        entity_type="file",
        entity_id=new_file.id,
        description=f"'{file.filename}' dosyası yüklendi. (Kategori: {category})"
    )
    
    # Notify watchers of the related entity
    if job_id:
        notify_watchers(db, workspace_id, "job", job_id, "file_uploaded", "Yeni Dosya Yüklendi", f"'{file.filename}' dosyası işe eklendi.", actor_user_id=current_user.id)
    elif customer_id:
        notify_watchers(db, workspace_id, "customer", customer_id, "file_uploaded", "Yeni Dosya Yüklendi", f"'{file.filename}' dosyası müşteri kaydına eklendi.", actor_user_id=current_user.id)
    elif delivery_service_id:
        notify_watchers(db, workspace_id, "delivery_service", delivery_service_id, "file_uploaded", "Yeni Dosya Yüklendi", f"'{file.filename}' dosyası teslimat kaydına eklendi.", actor_user_id=current_user.id)
    elif request_ticket_id:
        notify_watchers(db, workspace_id, "request_ticket", request_ticket_id, "file_uploaded", "Yeni Dosya Yüklendi", f"'{file.filename}' dosyası talep kaydına eklendi.", actor_user_id=current_user.id)
    
    return new_file

@router.get("/", response_model=List[FileAssetResponse])
def list_files(
    customer_id: Optional[int] = Query(None),
    job_id: Optional[int] = Query(None),
    offer_id: Optional[int] = Query(None),
    task_id: Optional[int] = Query(None),
    delivery_service_id: Optional[int] = Query(None),
    request_ticket_id: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    member = Depends(get_current_workspace_member),
):
    query = db.query(FileAsset).filter(
        FileAsset.workspace_id == member.workspace_id,
        FileAsset.is_deleted == False
    )
    
    if customer_id:
        query = query.filter(FileAsset.customer_id == customer_id)
    if job_id:
        query = query.filter(FileAsset.job_id == job_id)
    if offer_id:
        query = query.filter(FileAsset.offer_id == offer_id)
    if task_id:
        query = query.filter(FileAsset.task_id == task_id)
    if delivery_service_id:
        query = query.filter(FileAsset.delivery_service_id == delivery_service_id)
    if request_ticket_id:
        query = query.filter(FileAsset.request_ticket_id == request_ticket_id)
    if category:
        query = query.filter(FileAsset.category == category)
    if search:
        query = query.filter(FileAsset.original_filename.ilike(f"%{search}%"))
        
    return query.order_by(FileAsset.created_at.desc()).all()

@router.get("/{file_id}", response_model=FileAssetResponse)
def get_file_info(
    file_id: int,
    db: Session = Depends(get_db),
    member = Depends(get_current_workspace_member)
):
    file_asset = db.query(FileAsset).filter(
        FileAsset.id == file_id, 
        FileAsset.workspace_id == member.workspace_id,
        FileAsset.is_deleted == False
    ).first()
    
    if not file_asset:
        raise HTTPException(status_code=404, detail="File not found")
    return file_asset

@router.get("/{file_id}/download")
def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    member = Depends(get_current_workspace_member)
):
    file_asset = db.query(FileAsset).filter(
        FileAsset.id == file_id, 
        FileAsset.workspace_id == member.workspace_id,
        FileAsset.is_deleted == False
    ).first()
    
    if not file_asset:
        raise HTTPException(status_code=404, detail="File not found")
        
    if not os.path.exists(file_asset.file_path):
        raise HTTPException(status_code=404, detail="Physical file missing on server")
        
    return FileResponse(
        path=file_asset.file_path,
        filename=file_asset.original_filename,
        media_type=file_asset.mime_type
    )

@router.put("/{file_id}", response_model=FileAssetResponse)
def update_file_info(
    file_id: int,
    file_update: FileAssetUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    member = Depends(get_current_workspace_member),
    permission_member = Depends(require_permission(Permission.FILE_WRITE)),
):
    file_asset = db.query(FileAsset).filter(
        FileAsset.id == file_id, 
        FileAsset.workspace_id == member.workspace_id,
        FileAsset.is_deleted == False
    ).first()
    
    if not file_asset:
        raise HTTPException(status_code=404, detail="File not found")
        
    update_data = file_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(file_asset, key, value)
        
    db.commit()
    db.refresh(file_asset)
    return file_asset

@router.delete("/{file_id}")
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    member = Depends(get_current_workspace_member),
    permission_member = Depends(require_permission(Permission.FILE_DELETE)),
):
    file_asset = db.query(FileAsset).filter(
        FileAsset.id == file_id, 
        FileAsset.workspace_id == member.workspace_id
    ).first()
    
    if not file_asset:
        raise HTTPException(status_code=404, detail="File not found")
        
    file_asset.is_deleted = True
    file_asset.deleted_at = datetime.now()
    file_asset.deleted_by_user_id = current_user.id
    
    db.add(file_asset)
    db.commit()
    
    # Log activity
    create_activity(
        db, 
        workspace_id=member.workspace_id,
        actor_id=current_user.id,
        action="file.deleted",
        entity_type="file",
        entity_id=file_id,
        description=f"'{file_asset.original_filename}' dosyası arşivlendi."
    )
    
    return {"message": "File archived successfully"}
