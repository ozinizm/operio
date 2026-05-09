import os
from sqlalchemy import create_engine, text, inspect

database_url = os.getenv("DATABASE_URL")

if not database_url:
    print("DATABASE_URL not found in this environment.")
    raise SystemExit(0)

engine = create_engine(database_url)

critical_tables = [
    "alembic_version",
    "users",
    "workspaces",
    "workspace_users",
    "platform_settings",
    "support_requests",
    "modules",
    "workspace_modules",
    "activity_logs",
    "customers",
    "jobs",
    "offers",
    "tasks",
    "finance_entries",
    "inventory_items",
    "file_assets"
]

soft_delete_tables = [
    "customers",
    "jobs",
    "offers",
    "tasks",
    "finance_entries",
    "inventory_items",
    "delivery_services",
    "request_tickets",
    "file_assets"
]

with engine.connect() as conn:
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    print("\n=== DB CONNECTION ===")
    print(f"Connection to {database_url} OK")

    print("\n=== ALEMBIC VERSION ===")
    if "alembic_version" in tables:
        try:
            rows = conn.execute(text("SELECT version_num FROM alembic_version")).fetchall()
            print(rows)
        except Exception as e:
            print(f"Error reading alembic_version: {e}")
    else:
        print("alembic_version table missing")

    print("\n=== TABLE EXISTENCE ===")
    for table in critical_tables:
        print(f"{table}: {'OK' if table in tables else 'MISSING'}")

    print("\n=== ROW COUNTS ===")
    for table in critical_tables:
        if table in tables and table != "alembic_version":
            try:
                count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
                print(f"{table}: {count}")
            except Exception as e:
                print(f"{table}: {e}")

    print("\n=== SCHEMA INSPECTION (PLATFORM SETTINGS) ===")
    if "platform_settings" in tables:
        cols = [c["name"] for c in inspector.get_columns("platform_settings")]
        print(f"Columns in platform_settings: {cols}")
        try:
            rows = conn.execute(text("SELECT * FROM platform_settings LIMIT 5")).mappings().all()
            for r in rows:
                print(dict(r))
        except Exception as e:
            print(f"Error reading platform_settings: {e}")

    print("\n=== SCHEMA INSPECTION (USERS) ===")
    if "users" in tables:
        cols = [c["name"] for c in inspector.get_columns("users")]
        print(f"Columns in users: {cols}")
        try:
            rows = conn.execute(text("SELECT id, email FROM users LIMIT 5")).mappings().all()
            for r in rows:
                print(dict(r))
        except Exception as e:
            print(f"Error reading users: {e}")

    print("\n=== SOFT DELETE COLUMN CHECK ===")
    for table in soft_delete_tables:
        if table in tables:
            cols = {c["name"] for c in inspector.get_columns(table)}
            expected = {"is_deleted", "deleted_at", "deleted_by_user_id"}
            missing = expected - cols
            print(f"{table}: {'OK' if not missing else 'MISSING ' + str(missing)}")
        else:
            print(f"{table}: TABLE MISSING")

print("\nREAD-ONLY DB CHECK COMPLETED")
