from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..core.deps import get_current_user, get_current_workspace_member
from ..models.appointment import AppointmentSettings, AppointmentService, AppointmentStaff, Appointment
from ..models.workspace_module import WorkspaceModule
from ..services.activity_service import log_audit_event
from ..schemas.appointment import (
    AppointmentSettingsBase, AppointmentSettingsOut,
    AppointmentServiceIn, AppointmentServiceOut,
    AppointmentStaffIn, AppointmentStaffOut,
    AppointmentOut, AppointmentStatusUpdate,
)

router = APIRouter()


def workspace_id(member):
    return member.workspace_id


def ensure_manager(member):
    if member.role not in {"owner", "admin", "manager"}:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok.")


def resolve_service_staff(db: Session, workspace: int, staff_ids: List[int]):
    unique_ids = set(staff_ids)
    if not unique_ids:
        return []
    staff = db.query(AppointmentStaff).filter(
        AppointmentStaff.workspace_id == workspace,
        AppointmentStaff.id.in_(unique_ids),
        AppointmentStaff.is_active == True,
        (AppointmentStaff.is_deleted == False) | (AppointmentStaff.is_deleted.is_(None)),
    ).all()
    if len(staff) != len(unique_ids):
        raise HTTPException(status_code=422, detail="Seçilen uzmanlardan biri bu workspace için aktif değil.")
    return staff


def require_appointments_module(
    db: Session = Depends(get_db),
    member = Depends(get_current_workspace_member)
):
    db_m = db.query(WorkspaceModule).filter(
        WorkspaceModule.workspace_id == member.workspace_id,
        WorkspaceModule.module_key == "appointments"
    ).first()
    if not db_m or not db_m.is_enabled:
        raise HTTPException(status_code=403, detail="Randevu modülü bu workspace için aktif değil.")
    return member


@router.get("/settings", response_model=AppointmentSettingsOut)
def get_settings(db: Session = Depends(get_db), member=Depends(require_appointments_module), _user=Depends(get_current_user)):
    item = db.query(AppointmentSettings).filter(AppointmentSettings.workspace_id == workspace_id(member)).first()
    if not item:
        item = AppointmentSettings(workspace_id=workspace_id(member), business_name=getattr(member.workspace, "name", None))
        db.add(item); db.commit(); db.refresh(item)
    return item


@router.put("/settings", response_model=AppointmentSettingsOut)
def update_settings(payload: AppointmentSettingsBase, db: Session = Depends(get_db), member=Depends(require_appointments_module), _user=Depends(get_current_user)):
    ensure_manager(member)
    item = db.query(AppointmentSettings).filter(AppointmentSettings.workspace_id == workspace_id(member)).first()
    if not item:
        item = AppointmentSettings(workspace_id=workspace_id(member))
        db.add(item)
    data = payload.model_dump()
    if data.get("public_slug"):
        conflict = db.query(AppointmentSettings).filter(AppointmentSettings.public_slug == data["public_slug"], AppointmentSettings.workspace_id != workspace_id(member)).first()
        if conflict:
            raise HTTPException(status_code=409, detail="Bu randevu bağlantısı kullanımda.")
    for key, value in data.items(): setattr(item, key, value)
    db.commit(); db.refresh(item)
    return item


@router.get("/services", response_model=List[AppointmentServiceOut])
def list_services(db: Session = Depends(get_db), member=Depends(require_appointments_module), _user=Depends(get_current_user)):
    return db.query(AppointmentService).filter(
        AppointmentService.workspace_id == workspace_id(member),
        (AppointmentService.is_deleted == False) | (AppointmentService.is_deleted.is_(None))
    ).order_by(AppointmentService.sort_order, AppointmentService.id).all()


@router.post("/services", response_model=AppointmentServiceOut, status_code=201)
def create_service(payload: AppointmentServiceIn, db: Session = Depends(get_db), member=Depends(require_appointments_module), _user=Depends(get_current_user)):
    ensure_manager(member)
    data = payload.model_dump(exclude={"staff_ids"})
    item = AppointmentService(workspace_id=workspace_id(member), **data)
    item.staff = resolve_service_staff(db, workspace_id(member), payload.staff_ids)
    db.add(item); db.commit(); db.refresh(item)
    log_audit_event(
        db, action="service.created", entity_type="appointment_service",
        entity_id=item.id, workspace_id=workspace_id(member), actor_user=_user,
        description=f"Yeni hizmet eklendi: {item.name}"
    )
    return item


@router.put("/services/{service_id}", response_model=AppointmentServiceOut)
def update_service(service_id: int, payload: AppointmentServiceIn, db: Session = Depends(get_db), member=Depends(require_appointments_module), _user=Depends(get_current_user)):
    ensure_manager(member)
    item = db.query(AppointmentService).filter(
        AppointmentService.id == service_id,
        AppointmentService.workspace_id == workspace_id(member),
        (AppointmentService.is_deleted == False) | (AppointmentService.is_deleted.is_(None))
    ).first()
    if not item: raise HTTPException(404, "Hizmet bulunamadı.")
    for key, value in payload.model_dump(exclude={"staff_ids"}).items(): setattr(item, key, value)
    item.staff = resolve_service_staff(db, workspace_id(member), payload.staff_ids)
    db.commit(); db.refresh(item)
    log_audit_event(
        db, action="service.updated", entity_type="appointment_service",
        entity_id=item.id, workspace_id=workspace_id(member), actor_user=_user,
        description=f"Hizmet güncellendi: {item.name}"
    )
    return item


@router.delete("/services/{service_id}", status_code=204)
def delete_service(service_id: int, db: Session = Depends(get_db), member=Depends(require_appointments_module), _user=Depends(get_current_user)):
    ensure_manager(member)
    item = db.query(AppointmentService).filter(
        AppointmentService.id == service_id,
        AppointmentService.workspace_id == workspace_id(member),
        (AppointmentService.is_deleted == False) | (AppointmentService.is_deleted.is_(None))
    ).first()
    if not item: raise HTTPException(404, "Hizmet bulunamadı.")

    # Soft delete
    item.is_deleted = True
    item.deleted_at = datetime.utcnow()
    item.deleted_by_user_id = _user.id
    db.commit()

    log_audit_event(
        db, action="service.deleted", entity_type="appointment_service",
        entity_id=item.id, workspace_id=workspace_id(member), actor_user=_user,
        description=f"Hizmet silindi: {item.name}"
    )


@router.get("/staff", response_model=List[AppointmentStaffOut])
def list_staff(db: Session = Depends(get_db), member=Depends(require_appointments_module), _user=Depends(get_current_user)):
    return db.query(AppointmentStaff).filter(
        AppointmentStaff.workspace_id == workspace_id(member),
        (AppointmentStaff.is_deleted == False) | (AppointmentStaff.is_deleted.is_(None))
    ).order_by(AppointmentStaff.id).all()


@router.post("/staff", response_model=AppointmentStaffOut, status_code=201)
def create_staff(payload: AppointmentStaffIn, db: Session = Depends(get_db), member=Depends(require_appointments_module), _user=Depends(get_current_user)):
    ensure_manager(member)
    item = AppointmentStaff(workspace_id=workspace_id(member), **payload.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    log_audit_event(
        db, action="staff.created", entity_type="appointment_staff",
        entity_id=item.id, workspace_id=workspace_id(member), actor_user=_user,
        description=f"Yeni personel eklendi: {item.name}"
    )
    return item


@router.put("/staff/{staff_id}", response_model=AppointmentStaffOut)
def update_staff(staff_id: int, payload: AppointmentStaffIn, db: Session = Depends(get_db), member=Depends(require_appointments_module), _user=Depends(get_current_user)):
    ensure_manager(member)
    item = db.query(AppointmentStaff).filter(
        AppointmentStaff.id == staff_id,
        AppointmentStaff.workspace_id == workspace_id(member),
        (AppointmentStaff.is_deleted == False) | (AppointmentStaff.is_deleted.is_(None))
    ).first()
    if not item: raise HTTPException(404, "Personel bulunamadı.")
    for key, value in payload.model_dump().items(): setattr(item, key, value)
    db.commit(); db.refresh(item)
    log_audit_event(
        db, action="staff.updated", entity_type="appointment_staff",
        entity_id=item.id, workspace_id=workspace_id(member), actor_user=_user,
        description=f"Personel güncellendi: {item.name}"
    )
    return item


@router.delete("/staff/{staff_id}", status_code=204)
def delete_staff(staff_id: int, db: Session = Depends(get_db), member=Depends(require_appointments_module), _user=Depends(get_current_user)):
    ensure_manager(member)
    item = db.query(AppointmentStaff).filter(
        AppointmentStaff.id == staff_id,
        AppointmentStaff.workspace_id == workspace_id(member),
        (AppointmentStaff.is_deleted == False) | (AppointmentStaff.is_deleted.is_(None))
    ).first()
    if not item: raise HTTPException(404, "Personel bulunamadı.")

    # Soft delete
    item.is_deleted = True
    item.deleted_at = datetime.utcnow()
    item.deleted_by_user_id = _user.id
    db.commit()

    log_audit_event(
        db, action="staff.deleted", entity_type="appointment_staff",
        entity_id=item.id, workspace_id=workspace_id(member), actor_user=_user,
        description=f"Personel silindi: {item.name}"
    )


@router.get("", response_model=List[AppointmentOut])
def list_appointments(db: Session = Depends(get_db), member=Depends(require_appointments_module), _user=Depends(get_current_user)):
    return db.query(Appointment).filter(
        Appointment.workspace_id == workspace_id(member),
        (Appointment.is_deleted == False) | (Appointment.is_deleted.is_(None))
    ).order_by(Appointment.starts_at.desc()).limit(500).all()


@router.patch("/{appointment_id}/status", response_model=AppointmentOut)
def update_status(appointment_id: int, payload: AppointmentStatusUpdate, db: Session = Depends(get_db), member=Depends(require_appointments_module), _user=Depends(get_current_user)):
    ensure_manager(member)
    allowed = {"pending", "confirmed", "completed", "cancelled", "no_show"}
    if payload.status not in allowed: raise HTTPException(422, "Geçersiz durum.")
    item = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.workspace_id == workspace_id(member),
        (Appointment.is_deleted == False) | (Appointment.is_deleted.is_(None))
    ).first()
    if not item: raise HTTPException(404, "Randevu bulunamadı.")
    item.status = payload.status
    db.commit(); db.refresh(item)
    log_audit_event(
        db, action="appointment.status_updated", entity_type="appointment",
        entity_id=item.id, workspace_id=workspace_id(member), actor_user=_user,
        description=f"Randevu durumu {payload.status} olarak güncellendi: {item.customer_name}"
    )
    return item
