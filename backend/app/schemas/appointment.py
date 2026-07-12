from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
import re


class AppointmentSettingsBase(BaseModel):
    is_public_enabled: bool = False
    public_slug: Optional[str] = None
    business_name: Optional[str] = None
    headline: str = "Online randevunuzu oluşturun"
    description: Optional[str] = None
    logo_url: Optional[str] = None
    cover_url: Optional[str] = None
    accent_color: str = "#E11D48"
    address: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    timezone: str = "Europe/Istanbul"
    slot_interval_minutes: int = Field(default=30, ge=10, le=240)
    min_notice_hours: int = Field(default=2, ge=0, le=720)
    max_advance_days: int = Field(default=60, ge=1, le=365)
    require_approval: bool = True
    success_message: str = "Randevu talebiniz alınmıştır. İşletme onayından sonra bilgilendirileceksiniz."

    @field_validator("public_slug")
    @classmethod
    def validate_slug(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if v == "":
                return None
            if not re.match(r'^[a-z0-9][a-z0-9-]*[a-z0-9]$', v):
                raise ValueError("Slug sadece küçük harf, rakam ve tire içerebilir, tire ile başlayıp bitemez.")
        return v


class AppointmentSettingsOut(AppointmentSettingsBase):
    id: int
    workspace_id: int
    model_config = {"from_attributes": True}


class AppointmentServiceIn(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    description: Optional[str] = None
    duration_minutes: int = Field(default=30, ge=5, le=1440)
    price: Optional[Decimal] = None
    currency: str = "TRY"
    is_active: bool = True
    sort_order: int = 0
    staff_ids: List[int] = Field(default_factory=list)


class AppointmentServiceOut(AppointmentServiceIn):
    id: int
    workspace_id: int
    model_config = {"from_attributes": True}


class AppointmentStaffIn(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    photo_url: Optional[str] = None
    is_active: bool = True


class AppointmentStaffOut(AppointmentStaffIn):
    id: int
    workspace_id: int
    model_config = {"from_attributes": True}


class AppointmentCreatePublic(BaseModel):
    service_id: int
    staff_id: Optional[int] = None
    customer_name: str = Field(min_length=2, max_length=180)
    customer_phone: str = Field(min_length=7, max_length=50)
    customer_email: Optional[str] = None
    starts_at: datetime
    notes: Optional[str] = None


class AppointmentOut(BaseModel):
    id: int
    workspace_id: int
    service_id: Optional[int]
    staff_id: Optional[int]
    customer_id: Optional[int]
    customer_name: str
    customer_phone: str
    customer_email: Optional[str]
    starts_at: datetime
    ends_at: datetime
    status: str
    notes: Optional[str]
    source: str
    model_config = {"from_attributes": True}


class AppointmentPublicOut(BaseModel):
    id: int
    service_id: Optional[int]
    staff_id: Optional[int]
    customer_id: Optional[int]
    customer_name: str
    customer_phone: str
    customer_email: Optional[str]
    starts_at: datetime
    ends_at: datetime
    status: str
    notes: Optional[str]
    source: str
    model_config = {"from_attributes": True}


class AppointmentStatusUpdate(BaseModel):
    status: str


class AppointmentSettingsPublicOut(AppointmentSettingsBase):
    id: int
    model_config = {"from_attributes": True}


class AppointmentServicePublicOut(AppointmentServiceIn):
    id: int
    model_config = {"from_attributes": True}


class AppointmentStaffPublicOut(AppointmentStaffIn):
    id: int
    model_config = {"from_attributes": True}


class PublicAppointmentConfig(BaseModel):
    settings: AppointmentSettingsPublicOut
    services: List[AppointmentServicePublicOut]
    staff: List[AppointmentStaffPublicOut]
