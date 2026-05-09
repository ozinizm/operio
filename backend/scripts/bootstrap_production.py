import os
import sys
import logging

# Add the parent directory to sys.path to allow importing from app
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from app.core.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def bootstrap():
    """
    Idempotent script to bootstrap a production database.
    Creates or updates the initial Super Admin user.
    """
    logger.info("Starting production bootstrap...")
    
    db = SessionLocal()
    try:
        # 1. Configuration Check
        email = settings.OPERIO_SUPERADMIN_EMAIL
        password = settings.OPERIO_SUPERADMIN_PASSWORD
        name = settings.OPERIO_SUPERADMIN_NAME
        force_reset = settings.OPERIO_FORCE_SUPERADMIN_PASSWORD_RESET
        is_production = settings.APP_ENV == "production"
        
        # 2. Production Safety Guard
        if is_production and password == "Operio123!":
            logger.error("DANGER: Default password 'Operio123!' is NOT allowed in production environment.")
            sys.exit(1)

        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            logger.info(f"Creating initial Super Admin user: {email}")
            if is_production and not password:
                logger.error("DANGER: OPERIO_SUPERADMIN_PASSWORD must be set in production.")
                sys.exit(1)
                
            user = User(
                email=email,
                full_name=name,
                password_hash=get_password_hash(password),
                is_super_admin=True,
                is_active=True
            )
            db.add(user)
            logger.info("Super Admin user created successfully.")
        else:
            logger.info(f"Super Admin user exists: {email}. Verifying status...")
            user.full_name = name
            user.is_super_admin = True
            user.is_active = True
            
            # 3. Password Overwrite Protection
            if force_reset:
                logger.warning("Super Admin password reset applied via OPERIO_FORCE_SUPERADMIN_PASSWORD_RESET flag.")
                user.password_hash = get_password_hash(password)
            else:
                logger.info("Super Admin password exists. Skipping overwrite for safety. (Use OPERIO_FORCE_SUPERADMIN_PASSWORD_RESET=true to force reset)")
        
        db.commit()
        logger.info("Production bootstrap completed successfully.")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error during bootstrap: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    bootstrap()
