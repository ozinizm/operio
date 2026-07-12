from datetime import timedelta, timezone, datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.appointment import AppointmentSettings, AppointmentService, AppointmentStaff, Appointment
from ..schemas.appointment import PublicAppointmentConfig, AppointmentCreatePublic, AppointmentOut, AppointmentPublicOut
from ..core.limiter import limiter
from ..core.config import settings as app_settings
from ..services.activity_service import log_audit_event


router = APIRouter()


@router.get("/{slug}", response_model=PublicAppointmentConfig)
def public_config(slug: str, db: Session = Depends(get_db)):
    settings = db.query(AppointmentSettings).filter(AppointmentSettings.public_slug == slug, AppointmentSettings.is_public_enabled == True).first()
    if not settings: raise HTTPException(404, "Randevu sayfası bulunamadı.")
    services = db.query(AppointmentService).filter(AppointmentService.workspace_id == settings.workspace_id, AppointmentService.is_active == True, (AppointmentService.is_deleted == False) | (AppointmentService.is_deleted.is_(None))).order_by(AppointmentService.sort_order).all()
    staff = db.query(AppointmentStaff).filter(AppointmentStaff.workspace_id == settings.workspace_id, AppointmentStaff.is_active == True, (AppointmentStaff.is_deleted == False) | (AppointmentStaff.is_deleted.is_(None))).all()
    return {"settings": settings, "services": services, "staff": staff}


@router.post("/{slug}", response_model=AppointmentPublicOut, status_code=201)
@limiter.limit("5/minute")
def create_public_appointment(request: Request, slug: str, payload: AppointmentCreatePublic, db: Session = Depends(get_db)):
    # Origin check
    origin = request.headers.get("origin")
    if origin and app_settings.CORS_ORIGINS and app_settings.CORS_ORIGINS != ["*"] and app_settings.CORS_ORIGINS != "*":
        allowed_origins = app_settings.CORS_ORIGINS
        if isinstance(allowed_origins, str):
            allowed_origins = [allowed_origins]
        if origin not in allowed_origins:
            raise HTTPException(status_code=403, detail="Origin not allowed")

    settings = db.query(AppointmentSettings).filter(AppointmentSettings.public_slug == slug, AppointmentSettings.is_public_enabled == True).first()

    if not settings: raise HTTPException(404, "Randevu sayfası bulunamadı.")
    service = db.query(AppointmentService).filter(AppointmentService.id == payload.service_id, AppointmentService.workspace_id == settings.workspace_id, AppointmentService.is_active == True, (AppointmentService.is_deleted == False) | (AppointmentService.is_deleted.is_(None))).first()
    if not service: raise HTTPException(404, "Hizmet bulunamadı.")
    if payload.staff_id:
        staff = db.query(AppointmentStaff).filter(AppointmentStaff.id == payload.staff_id, AppointmentStaff.workspace_id == settings.workspace_id, AppointmentStaff.is_active == True, (AppointmentStaff.is_deleted == False) | (AppointmentStaff.is_deleted.is_(None))).first()
        if not staff: raise HTTPException(404, "Personel bulunamadı.")
        if staff not in service.staff:
            raise HTTPException(422, "Seçilen uzman bu hizmeti vermiyor.")
    if payload.starts_at.tzinfo is None:
        raise HTTPException(422, "Randevu zamanı saat dilimi içermelidir.")
    now = datetime.now(timezone.utc)
    starts_at_utc = payload.starts_at.astimezone(timezone.utc)
    if starts_at_utc < now + timedelta(hours=settings.min_notice_hours):
        raise HTTPException(422, "Bu saat için minimum bildirim süresi sağlanmıyor.")
    if starts_at_utc > now + timedelta(days=settings.max_advance_days):
        raise HTTPException(422, "Bu tarih için henüz randevu alınamıyor.")
    ends_at_utc = starts_at_utc + timedelta(minutes=service.duration_minutes)

    conflict_filters = [
        Appointment.workspace_id == settings.workspace_id,
        Appointment.status.in_(["pending", "confirmed"]),
        Appointment.starts_at < ends_at_utc,
        Appointment.ends_at > starts_at_utc,
        (Appointment.is_deleted == False) | (Appointment.is_deleted.is_(None))
    ]
    if payload.staff_id:
        conflict_filters.append(Appointment.staff_id == payload.staff_id)
    else:
        conflict_filters.append(Appointment.staff_id.is_(None))

    conflict = db.query(Appointment).filter(*conflict_filters).first()
    if conflict: raise HTTPException(409, "Seçilen saat artık müsait değil.")
    item = Appointment(
        workspace_id=settings.workspace_id,
        service_id=service.id,
        staff_id=payload.staff_id,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        customer_email=payload.customer_email,
        starts_at=starts_at_utc,
        ends_at=ends_at_utc,
        status="pending" if settings.require_approval else "confirmed",
        notes=payload.notes,
        source="public",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    log_audit_event(
        db, action="appointment.created", entity_type="appointment",
        entity_id=item.id, workspace_id=settings.workspace_id, actor_user=None,
        description=f"Online randevu oluşturuldu: {item.customer_name}"
    )
    return item
