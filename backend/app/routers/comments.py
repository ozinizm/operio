from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.deps import get_current_user, get_current_workspace_member
from ..models.comment import Comment
from ..schemas.comment import CommentCreate, CommentResponse, CommentUpdate
from ..services.notification_service import notify_watchers, notify_mentions, add_watcher
from ..services.activity_service import create_activity

router = APIRouter(prefix="/comments", tags=["Comments"])

@router.post("/", response_model=CommentResponse)
def create_comment(
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    member = Depends(get_current_workspace_member)
):
    db_comment = Comment(
        workspace_id=member.workspace_id,
        author_user_id=current_user.id,
        **comment.model_dump()
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    # Auto-watch the entity for the author
    add_watcher(db, member.workspace_id, current_user.id, comment.entity_type, comment.entity_id)
    
    # Notify watchers
    entity_names = {
        "customer": "müşteri",
        "job": "iş",
        "task": "görev",
        "offer": "teklif",
        "file": "dosya",
        "finance_entry": "finans kaydı",
        "delivery_service": "teslimat/servis",
        "request_ticket": "talep"
    }
    entity_name = entity_names.get(comment.entity_type, comment.entity_type)
    
    notify_watchers(
        db, 
        workspace_id=member.workspace_id,
        entity_type=comment.entity_type,
        entity_id=comment.entity_id,
        type="comment_added",
        title="Yeni Yorum",
        message=f"{current_user.full_name} bir {entity_name} kaydına yorum ekledi.",
        actor_user_id=current_user.id
    )
    
    # Handle mentions
    notify_mentions(
        db,
        workspace_id=member.workspace_id,
        text=comment.body,
        title="Sizden Bahsedildi",
        message=f"{current_user.full_name} bir yorumda sizden bahsetti.",
        actor_user_id=current_user.id,
        entity_type=comment.entity_type,
        entity_id=comment.entity_id
    )
    
    # Log activity
    create_activity(
        db,
        workspace_id=member.workspace_id,
        actor_id=current_user.id,
        action="comment_added",
        entity_type=comment.entity_type,
        entity_id=comment.entity_id,
        description=f"'{entity_name}' kaydına yorum eklendi."
    )
    
    # Add author_name for response
    response_comment = CommentResponse.model_validate(db_comment)
    response_comment.author_name = current_user.full_name
    return response_comment

@router.get("/", response_model=List[CommentResponse])
def list_comments(
    entity_type: str,
    entity_id: int,
    db: Session = Depends(get_db),
    member = Depends(get_current_workspace_member)
):
    comments = db.query(Comment).filter(
        Comment.workspace_id == member.workspace_id,
        Comment.entity_type == entity_type,
        Comment.entity_id == entity_id,
        Comment.deleted_at == None
    ).order_by(Comment.created_at.asc()).all()
    
    # Enrich with author names
    result = []
    for c in comments:
        cr = CommentResponse.model_validate(c)
        cr.author_name = c.author.full_name
        result.append(cr)
    return result

@router.delete("/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    member = Depends(get_current_workspace_member)
):
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.workspace_id == member.workspace_id
    ).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
        
    # Permission check: author or admin
    if comment.author_user_id != current_user.id and member.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
        
    from datetime import datetime
    comment.deleted_at = datetime.utcnow()
    db.commit()
    return {"message": "Comment deleted"}
