import json
import logging
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from ..models.activity import Activity

logger = logging.getLogger(__name__)

def log_audit_event(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    workspace_id: Optional[int] = None,
    actor_user: Any = None,
    actor_id: Optional[int] = None,
    actor_email: Optional[str] = None,
    description: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
) -> Optional[Activity]:
    """
    Centralized audit logging helper.
    Ensures that logging failures do not break the main transaction flow.
    """
    try:
        # Resolve actor details
        if actor_user:
            if not actor_id:
                actor_id = getattr(actor_user, 'id', None)
            if not actor_email:
                actor_email = getattr(actor_user, 'email', None)

        metadata_str = None
        if metadata:
            try:
                metadata_str = json.dumps(metadata)
            except Exception as e:
                logger.warning(f"Could not serialize audit metadata: {e}")
                metadata_str = str(metadata)

        # Use a subtransaction (savepoint) to ensure logging failure doesn't break main transaction
        with db.begin_nested():
            activity = Activity(
                workspace_id=workspace_id,
                actor_user_id=actor_id,
                actor_email=actor_email,
                entity_type=entity_type,
                entity_id=entity_id,
                action=action,
                description=description,
                metadata_json=metadata_str,
                ip_address=ip_address
            )
            db.add(activity)
        
        # Flush to get ID if needed, but don't commit
        db.flush()
        return activity
    except Exception as e:
        logger.error(f"Audit log failed for action {action}: {e}")
        return None

def create_activity(
    db: Session, 
    workspace_id: int, 
    actor_id: int, 
    entity_type: str, 
    entity_id: int, 
    action: str, 
    description: str = None
):
    """
    Legacy wrapper for compatibility.
    """
    return log_audit_event(
        db=db,
        workspace_id=workspace_id,
        actor_id=actor_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        description=description
    )
