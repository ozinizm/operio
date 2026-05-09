from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, AnyHttpUrl

class Settings(BaseSettings):
    APP_NAME: str = "Operio"
    APP_ENV: str = "development"
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    DATABASE_URL: str
    
    UPLOAD_DIR: str = "storage/uploads"
    MAX_UPLOAD_MB: int = 10
    FRONTEND_DIST_DIR: str = "../dist"
    
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://localhost:5174"]
    
    # Production Bootstrap
    OPERIO_SUPERADMIN_EMAIL: str = "superadmin@operio.dev"
    OPERIO_SUPERADMIN_PASSWORD: str = "Operio123!"
    OPERIO_SUPERADMIN_NAME: str = "Fikir Super Admin"
    OPERIO_FORCE_SUPERADMIN_PASSWORD_RESET: bool = False
    
    # SMTP Settings
    SMTP_ENABLED: bool = False
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@operio.dev"
    SMTP_FROM_NAME: str = "Operio"
    SMTP_USE_TLS: bool = True

    # Resend API Settings
    RESEND_ENABLED: bool = False
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "noreply@operio.dev"
    RESEND_FROM_NAME: str = "Operio"
    
    # Provider Selection (resend or smtp)
    EMAIL_PROVIDER: str = "resend"

    ADMIN_NOTIFICATION_EMAIL: str = ""


    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", env_file_encoding='utf-8', extra='ignore')

settings = Settings()
