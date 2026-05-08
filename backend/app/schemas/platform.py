from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime

class PlatformSettingBase(BaseModel):
    key: str
    value: Optional[str] = None
    value_type: str = "string"
    description: Optional[str] = None
    is_public: bool = False

class PlatformSettingUpdate(BaseModel):
    value: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None

class PlatformSettingSchema(PlatformSettingBase):
    id: int
    updated_at: datetime
    updated_by_id: Optional[int] = None

    class Config:
        from_attributes = True

class PublicPlatformSettings(BaseModel):
    support_email: Optional[str] = "info@fikircreative.com"
    support_whatsapp: Optional[str] = ""
    support_company_name: Optional[str] = "Fikir Creative"
    support_working_hours: Optional[str] = "Hafta içi 10:00 - 18:00"
    support_emergency_note: Optional[str] = ""
    platform_name: Optional[str] = "Operio"
    platform_footer_text: Optional[str] = "© 2026 Operio."

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class SupportRequestSchema(BaseModel):
    id: int
    email: str
    type: str
    status: str
    created_at: datetime
    note: Optional[str] = None

    class Config:
        from_attributes = True

class SupportRequestUpdate(BaseModel):
    status: Optional[str] = None
    note: Optional[str] = None
