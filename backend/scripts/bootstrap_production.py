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
        # 1. Ensure Super Admin exists
        email = settings.OPERIO_SUPERADMIN_EMAIL
        password = settings.OPERIO_SUPERADMIN_PASSWORD
        name = settings.OPERIO_SUPERADMIN_NAME
        
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            logger.info(f"Creating Super Admin user: {email}")
            user = User(
                email=email,
                full_name=name,
                password_hash=get_password_hash(password),
                is_super_admin=True,
                is_active=True
            )
            db.add(user)
        else:
            logger.info(f"Super Admin user already exists: {email}. Updating details...")
            user.full_name = name
            user.is_super_admin = True
            user.is_active = True
            # Optional: Only update password if needed, or leave as is if already hashed
            # For bootstrap, we might want to ensure the env password is set
            user.password_hash = get_password_hash(password)
        
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
