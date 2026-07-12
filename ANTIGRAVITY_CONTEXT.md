# OPERIO CRM + APPOINTMENT MODULE CONTEXT

## Scope
This repository is the full Operio CRM application (React/Vite frontend + FastAPI/SQLAlchemy backend) with a first-pass Online Appointment module added.

## Existing core
Customers, jobs, offers, tasks, operations, delivery/service, complaints, inventory, finance, reports, files, users, workspaces, platform super-admin, module registry.

## Appointment additions
- Backend models: `backend/app/models/appointment.py`
- Schemas: `backend/app/schemas/appointment.py`
- Authenticated workspace API: `backend/app/routers/appointments.py`
- Public booking API: `backend/app/routers/public_appointments.py`
- Business UI: `src/pages/AppointmentsPage.tsx`
- Public booking UI: `src/pages/PublicBookingPage.tsx`
- Frontend API: `src/services/appointmentsApi.ts`
- Module key: `appointments`
- Business route: `/appointments`
- Public route: `/book/:slug`

## Intended product behavior
- Super admin enables/disables `appointments` per workspace using existing module management.
- Workspace owner/admin/manager configures public booking page, services, staff and approval behavior.
- Public users create appointment requests through workspace slug.
- Workspace manages statuses: pending, confirmed, completed, cancelled, no_show.

## Known incomplete areas for agent
1. Add Alembic migration for appointment tables. Do not use create_all in production.
2. Add service update/delete UI and staff update/delete UI.
3. Add working-hours, breaks, holidays, per-staff availability and slot API.
4. Harden timezone and overlap logic; current implementation is baseline only.
5. Link public appointment to existing Customer by phone/email or create customer safely.
6. Add audit logs, notifications and WhatsApp/email adapters.
7. Add platform UI indication and quota/plan logic for appointment premium module.
8. Add tests: workspace isolation, role authorization, collision prevention, slug uniqueness, public abuse/rate limiting.
9. Review current project-wide React hook/runtime issues independently.
10. Run full build, backend tests and fresh database migration test before deploy.

## Security requirements
- Every authenticated appointment query must filter by current workspace.
- Public endpoint must never expose private workspace data.
- Add rate limit and anti-spam protection before production.
- Validate phone/email and sanitize text fields.
- Do not expose internal IDs unnecessarily in future public APIs.
- Production DB backup before migrations.

## Deployment
User manually deploys Render. Do not deploy automatically. After code/tests/migrations are ready, explicitly tell user: `manuel deploy al`.
