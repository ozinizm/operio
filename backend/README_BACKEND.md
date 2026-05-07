# Operio Backend

Multi-tenant FastAPI backend for Operio Modular Operations Suite.

## Tech Stack
- Python 3.10+
- FastAPI
- SQLAlchemy (SQLite for dev)
- Pydantic
- JWT Auth

## Setup

1. **Install Dependencies**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # or .venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```

2. **Environment Variables**
   - Copy `.env.example` to `.env`
   - Set `SECRET_KEY`

3. **Database & Seed**
   ```bash
   python -m app.seed.seed_demo
   ```

4. **Run Server**
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```

## API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Multi-tenancy
All business data is scoped by `workspace_id`. The active workspace is determined by the logged-in user's `WorkspaceMember` relationship.
