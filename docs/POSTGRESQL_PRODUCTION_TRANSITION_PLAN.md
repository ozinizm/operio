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
2. Trigger a **Manual Deploy** in Render.

### Phase 4: Database Schema Migration
Once the backend is live (but likely showing errors because tables don't exist):
1. Connect to the Render Shell or use a one-off job.
2. Run: `alembic upgrade head`
   *This will create the production schema based on the migration history.*

### Phase 5: Production Bootstrap
1. Connect to the Render Shell.
2. Run: `python backend/scripts/bootstrap_production.py`
   *This will create the initial Super Admin user defined in the environment variables.*

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
- `APP_ENV=production` disables automatic table creation (`Base.metadata.create_all`) and demo seeding.
- Always use `psycopg2-binary` as the driver.
- Ensure `JWT_SECRET_KEY` is regenerated and unique for production.
