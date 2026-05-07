from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .routers import auth, customers, jobs, tasks, dashboard, offers, finance, files, reports, comments, notifications, watchers, delivery_services, request_tickets, modules, inventory, imports
from .core.database import engine, Base
from . import models

import os

# Create UPLOAD_DIR if it doesn't exist
if not os.path.exists(settings.UPLOAD_DIR):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Create tables
# In production, use Alembic migrations
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"/api/openapi.json",
    docs_url="/docs"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(customers.router, prefix="/api/customers", tags=["customers"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(offers.router, prefix="/api/offers", tags=["offers"])
app.include_router(finance.router, prefix="/api/finance", tags=["finance"])
app.include_router(files.router, prefix="/api", tags=["files"])
app.include_router(reports.router, prefix="/api", tags=["reports"])
app.include_router(comments.router, prefix="/api", tags=["comments"])
app.include_router(notifications.router, prefix="/api", tags=["notifications"])
app.include_router(watchers.router, prefix="/api", tags=["watchers"])
app.include_router(delivery_services.router, prefix="/api/delivery-services", tags=["delivery_services"])
app.include_router(request_tickets.router, prefix="/api/requests", tags=["request_tickets"])
app.include_router(modules.router, prefix="/api/modules", tags=["modules"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["inventory"])
app.include_router(imports.router, prefix="/api/imports", tags=["imports"])

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
            # If the path starts with /api, return 404
            if request.url.path.startswith("/api"):
                return JSONResponse(status_code=404, content={"detail": "API route not found"})
            
            # For all other routes, serve index.html
            index_path = os.path.join(settings.FRONTEND_DIST_DIR, "index.html")
            if os.path.exists(index_path):
                return FileResponse(index_path)
            
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
    else:
        print(f"Warning: FRONTEND_DIST_DIR not found at {settings.FRONTEND_DIST_DIR}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
