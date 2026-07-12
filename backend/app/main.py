from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .routers import auth, customers, jobs, tasks, dashboard, offers, finance, files, reports, comments, notifications, watchers, delivery_services, request_tickets, modules, inventory, imports, platform, public, users, appointments, public_appointments, search
from .core.database import engine, Base
from . import models
from .core.deps import require_module

import os

# Create UPLOAD_DIR if it doesn't exist
if not os.path.exists(settings.UPLOAD_DIR):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Create tables
# In production, use Alembic migrations exclusively
if settings.APP_ENV != "production":
    Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"/api/openapi.json",
    docs_url="/docs"
)

from app.core.limiter import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(customers.router, prefix="/api/customers", tags=["customers"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"], dependencies=[Depends(require_module("tasks"))])
app.include_router(offers.router, prefix="/api/offers", tags=["offers"], dependencies=[Depends(require_module("offers"))])
app.include_router(finance.router, prefix="/api/finance", tags=["finance"], dependencies=[Depends(require_module("finance"))])
app.include_router(files.router, prefix="/api", tags=["files"], dependencies=[Depends(require_module("files"))])
app.include_router(reports.router, prefix="/api", tags=["reports"], dependencies=[Depends(require_module("reports"))])
app.include_router(comments.router, prefix="/api", tags=["comments"])
app.include_router(notifications.router, prefix="/api", tags=["notifications"], dependencies=[Depends(require_module("notifications"))])
app.include_router(watchers.router, prefix="/api", tags=["watchers"])
app.include_router(delivery_services.router, prefix="/api/delivery-services", tags=["delivery_services"], dependencies=[Depends(require_module("delivery_service"))])
app.include_router(request_tickets.router, prefix="/api/requests", tags=["request_tickets"], dependencies=[Depends(require_module("complaints"))])
app.include_router(modules.router, prefix="/api/modules", tags=["modules"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["inventory"], dependencies=[Depends(require_module("inventory"))])
app.include_router(imports.router, prefix="/api/imports", tags=["imports"], dependencies=[Depends(require_module("data_import"))])
app.include_router(platform.router, prefix="/api/platform", tags=["platform"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["appointments"], dependencies=[Depends(require_module("appointments"))])
app.include_router(public_appointments.router, prefix="/api/public/appointments", tags=["public_appointments"])
app.include_router(public.router, prefix="/api/public", tags=["public"])
app.include_router(search.router, prefix="/api/search", tags=["search"])

@app.get("/api/docs", include_in_schema=False)
def api_docs_redirect():
    return RedirectResponse(url="/docs")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "version": "1.0.0",
        "database": "connected"
    }

@app.get("/")
def root():
    # In development, return API welcome message
    if settings.APP_ENV != "production":
        return {"message": f"Welcome to {settings.APP_NAME} API", "health": "/api/health", "docs": "/docs"}
    
    # In production, this will be handled by serve_frontend if it exists
    # But as a fallback:
    dist_index = os.path.join(settings.FRONTEND_DIST_DIR, "index.html")
    if os.path.exists(dist_index):
        return FileResponse(dist_index)
    return {"message": f"Welcome to {settings.APP_NAME} API", "health": "/api/health", "docs": "/docs"}

# Serve Frontend Static Files in Production
if settings.APP_ENV == "production":
    if os.path.exists(settings.FRONTEND_DIST_DIR):
        # Mount the assets directory
        assets_dir = os.path.join(settings.FRONTEND_DIST_DIR, "assets")
        if os.path.exists(assets_dir):
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
        
        # Exception handler for SPA fallback
        @app.exception_handler(404)
        async def spa_fallback(request, exc):
            # If the path starts with /api, return 404 with detail
            if request.url.path.startswith("/api"):
                detail = getattr(exc, "detail", "API route not found")
                # If it's the generic FastAPI "Not Found", use our custom message
                if detail == "Not Found":
                    detail = "API route not found"
                return JSONResponse(status_code=404, content={"detail": detail})
            
            # For all other routes, serve index.html
            index_path = os.path.join(settings.FRONTEND_DIST_DIR, "index.html")
            if os.path.exists(index_path):
                return FileResponse(index_path)
            
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
    else:
        print(f"Warning: FRONTEND_DIST_DIR not found at {settings.FRONTEND_DIST_DIR}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_excludes=[".venv/*", "**/.venv/*"],
    )
