from sqlalchemy.orm import Session
from ..models.activity import Activity
from ..schemas.activity import ActivityCreate

def create_activity(
    db: Session, 
    workspace_id: int, 
    actor_id: int, 
    entity_type: str, 
    entity_id: int, 
    action: str, 
    description: str = None
):
    activity = Activity(
        workspace_id=workspace_id,
        actor_user_id=actor_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        description=description
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity
