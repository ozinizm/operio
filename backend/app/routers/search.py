from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.deps import get_current_workspace_member
from ..models.customer import Customer
from ..models.job import Job
from ..models.user import User
from ..models.workspace import WorkspaceMember

router = APIRouter()


@router.get("")
def global_search(
    q: str = Query(..., min_length=2, max_length=80),
    db: Session = Depends(get_db),
    member=Depends(get_current_workspace_member),
):
    term = f"%{q.strip()}%"
    customers = db.query(Customer).filter(
        Customer.workspace_id == member.workspace_id,
        Customer.is_deleted == False,
        Customer.name.ilike(term),
    ).limit(5).all()
    jobs = db.query(Job).filter(
        Job.workspace_id == member.workspace_id,
        Job.is_deleted == False,
        Job.title.ilike(term),
    ).limit(5).all()
    people = []
    if member.role in {"owner", "admin"}:
        people = db.query(User).join(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == member.workspace_id,
            WorkspaceMember.is_active == True,
            (User.full_name.ilike(term) | User.email.ilike(term)),
        ).limit(5).all()
    return {
        "customers": [{"id": x.id, "label": x.name, "path": f"/customers/{x.id}"} for x in customers],
        "jobs": [{"id": x.id, "label": x.title, "path": f"/jobs/{x.id}"} for x in jobs],
        "people": [{"id": x.id, "label": x.full_name, "subtitle": x.email, "path": "/team"} for x in people],
    }
