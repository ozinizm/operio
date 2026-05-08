# PostgreSQL Production Transition Plan

## 1. Overview
Operio is transitioning from a SQLite-based demo environment to a PostgreSQL-based production infrastructure. SQLite, while excellent for development and demos, lacks the concurrency, robustness, and scalability required for production modular operations.

## 2. Pre-requisites
- Render PostgreSQL instance created and connection string available.
- Environment variables ready for production.
- Auto-Deploy turned OFF on Render.

## 3. Transition Steps

### Phase 1: Database Setup
1. Create a PostgreSQL instance on Render.
2. Ensure the instance is accessible by the Operio backend (same region recommended).

### Phase 2: Environment Configuration
Update the Render environment variables:
- `DATABASE_URL`: Set to the PostgreSQL connection string (use `postgresql+psycopg2://...`).
- `APP_ENV`: Set to `production`.
- `OPERIO_SUPERADMIN_EMAIL`: `superadmin@operio.dev` (or preferred).
- `OPERIO_SUPERADMIN_PASSWORD`: A strong, unique password.
- `OPERIO_SUPERADMIN_NAME`: `Operio Super Admin`.

### Phase 3: Manual Deployment
1. Push the production-ready code to `main`.
2. Ensure the **Start Command** on Render is updated (see below).
3. Trigger a **Manual Deploy** in Render.

### Phase 4: Automated Database Initialization
The backend now includes a script `scripts/init_production_db.py` that automatically:
1. Detects if the PostgreSQL database is empty.
2. Creates the full schema if no tables exist.
3. Stamps the Alembic version to `head` to avoid migration conflicts.

This script runs before the application starts, ensuring the database is always in a valid state without manual intervention.

### Phase 5: Start Command (Render)
Use the following combined Start Command in Render to ensure proper initialization on every deploy:

```bash
cd backend && python scripts/init_production_db.py && python scripts/bootstrap_production.py && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

*Note: `alembic upgrade head` is no longer needed in the start command for fresh DBs, as `init_production_db.py` handles the initial schema and stamping. Future migrations should be handled carefully via Alembic.*

### Phase 6: Verification
1. Access the production URL.
2. Login with Super Admin credentials.
3. Verify that `/platform` area is accessible.

## 4. Rollback Plan
If critical errors occur:
1. Revert `DATABASE_URL` to the SQLite path if necessary (though PostgreSQL is preferred once started).
2. Check Render logs for 500 errors.
3. Revert code commit if the issue is logic-related.

## 5. Security Notes
- `APP_ENV=production` is required for the init script to run.
- Always use `psycopg2-binary` as the driver.
- Ensure `JWT_SECRET_KEY` is regenerated and unique for production.
- `init_production_db.py` is safe to run on existing databases (it skips if tables are found).
