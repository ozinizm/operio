from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..core import security
from ..core.database import get_db
from ..core.deps import get_current_user, get_current_workspace, get_current_workspace_member
from ..models.user import User
from ..models.workspace import Workspace, WorkspaceMember
from ..schemas.auth import Token, Register, AuthMeResponse, UserResponse, WorkspaceResponse
from ..schemas.user import User as UserSchema
from ..schemas.workspace import Workspace as WorkspaceSchema
from ..services.activity_service import log_audit_event
from datetime import datetime

router = APIRouter()

@router.post("/login", response_model=Token)
def login(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user",
        )
    
    access_token_expires = timedelta(minutes=security.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/register", response_model=UserSchema)
def register(
    *,
    db: Session = Depends(get_db),
    reg_in: Register
) -> Any:
    user = db.query(User).filter(User.email == reg_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    
    # Create Workspace
    new_workspace = Workspace(
        name=reg_in.workspace_name,
        sector=reg_in.sector
    )
    db.add(new_workspace)
    db.flush() # Get ID
    
    # Create User
    new_user = User(
        email=reg_in.email,
        password_hash=security.get_password_hash(reg_in.password),
        full_name=reg_in.full_name
    )
    db.add(new_user)
    db.flush() # Get ID
    
    # Link User to Workspace as Owner
    member = WorkspaceMember(
        workspace_id=new_workspace.id,
        user_id=new_user.id,
        role="owner"
    )
    db.add(member)
    db.commit()
    db.refresh(new_user)
    
    # Audit Logs
    log_audit_event(
        db=db,
        action="workspace.created",
        entity_type="workspace",
        entity_id=new_workspace.id,
        workspace_id=new_workspace.id,
        actor_user=new_user, # The new user is the actor here
        description=f"Yeni işletme oluşturuldu (Kayıt): {new_workspace.name}"
    )
    
    log_audit_event(
        db=db,
        action="user.created",
        entity_type="user",
        entity_id=new_user.id,
        workspace_id=new_workspace.id,
        actor_user=new_user,
        description=f"Yeni kullanıcı hesabı oluşturuldu (Kayıt): {new_user.email}"
    )
    
    return new_user

@router.get("/me", response_model=AuthMeResponse)
def read_user_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
    member: WorkspaceMember = Depends(get_current_workspace_member)
) -> Any:
    return AuthMeResponse(
        user=UserResponse.model_validate(current_user),
        workspace=WorkspaceResponse.model_validate(workspace),
        role=member.role,
    )
