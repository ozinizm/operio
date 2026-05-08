from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.platform import PlatformSetting
from ..schemas.platform import PublicPlatformSettings

router = APIRouter()

@router.get("/platform-settings", response_model=PublicPlatformSettings)
def get_public_platform_settings(db: Session = Depends(get_db)):
    settings = db.query(PlatformSetting).filter(PlatformSetting.is_public == True).all()
    
    # Default values
    result = {
        "support_email": "info@fikircreative.com",
        "support_whatsapp": "",
        "support_company_name": "Fikir Creative",
        "support_working_hours": "Hafta içi 10:00 - 18:00",
        "support_emergency_note": "",
        "platform_name": "Operio",
        "platform_footer_text": "© 2026 Operio."
    }
    
    for s in settings:
        if s.key in result:
            result[s.key] = s.value
            
    return result
