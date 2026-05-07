# PostgreSQL Production Smoke Test Checklist

After transitioning to PostgreSQL, perform the following tests to ensure stability:

## 1. Authentication & Access
- [ ] Login screen loads without errors.
- [ ] Super Admin can login with bootstrap credentials.
- [ ] Token is correctly stored in localStorage.
- [ ] Refreshing the page keeps the session active.
- [ ] Logout works correctly.

## 2. Platform Administration
- [ ] `/platform` dashboard loads.
- [ ] `/platform/workspaces` list is empty (initial state) or shows bootstrapped records.
- [ ] New workspace creation works (Verify DB persistence).
- [ ] Workspace status change works.
- [ ] Module toggle works (Verify `workspace_modules` table).

## 3. Data Integrity
- [ ] Activity logs are being recorded for all platform actions.
- [ ] Dates and times are correctly stored and displayed in TR timezone.
- [ ] Special characters (TR) are correctly handled in names and descriptions.

## 4. Security & Isolation
- [ ] Normal users (if any created) cannot access `/platform`.
- [ ] Unauthorized API requests return 401/403.
- [ ] `APP_ENV=production` is confirmed in `/api/health`.

## 5. Performance
- [ ] Page load times are consistent.
- [ ] No "Database Locked" errors (common in SQLite, should be gone in PG).
- [ ] Large lists (if any) load without timing out.

## 6. Cleanup & Validation
- [ ] No demo data (from `seed_demo.py`) exists in the database.
- [ ] `alembic_version` table exists and matches `head`.
- [ ] Render logs show no 500 errors during the smoke test.
