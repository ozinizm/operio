import os
import sys
import logging
from sqlalchemy import inspect
from alembic.config import Config
from alembic import command

# Add the parent directory to sys.path to allow importing from app
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import engine, Base
from app.core.config import settings
import app.models  # Import all models to register them with Base.metadata

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(levelname)-5.5s [%(name)s] %(message)s')
logger = logging.getLogger("init_production_db")

def init_db():
    logger.info("Production DB init started")
    
    # 1. Environment check
    if settings.APP_ENV != "production":
        logger.info(f"Skipping init: APP_ENV is {settings.APP_ENV}, not production")
        return

    # 2. Database type check
    db_url = settings.DATABASE_URL
    if not db_url.startswith("postgresql"):
        logger.info(f"Database type: {db_url.split(':')[0]} (Not PostgreSQL, skipping production init logic)")
        # We only apply this logic to PostgreSQL as requested.
        return
    else:
        logger.info("Database type: PostgreSQL")

    try:
        # 3. Check if database is empty
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        # Filter out alembic_version if it somehow exists
        tables_to_check = [t for t in existing_tables if t != 'alembic_version']
        
        if existing_tables:
            logger.info(f"Existing tables found: {existing_tables}")
        else:
            logger.info("No tables found in database.")

        if not tables_to_check:
            logger.info("Fresh database detected, creating schema...")
            
            # Create all tables defined in SQLAlchemy models
            Base.metadata.create_all(bind=engine)
            logger.info("Schema created successfully")
            
            # 4. Alembic stamp to head
            # This marks the current schema as being at the latest migration version
            # so that future 'alembic upgrade head' commands don't try to re-create existing columns.
            logger.info("Stamping Alembic to head...")
            
            # Load alembic config
            # Ensure we are in the backend directory or point to the correct ini file
            ini_path = os.path.join(os.path.dirname(__file__), '..', 'alembic.ini')
            alembic_cfg = Config(ini_path)
            
            # Use the actual DATABASE_URL from settings
            alembic_cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
            
            # Run the stamp command
            command.stamp(alembic_cfg, "head")
            logger.info("Alembic stamped to head")
        else:
            logger.info("Database is not empty, skipping create_all")

    except Exception as e:
        logger.error(f"Error during DB initialization: {e}")
        # We don't necessarily want to fail the whole startup if DB is already initialized
        # but if it failed halfway, it might be better to exit.
        sys.exit(1)

if __name__ == "__main__":
    init_db()
