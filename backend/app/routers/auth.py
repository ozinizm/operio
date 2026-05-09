from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..core import security
from ..core.database import get_db
from ..core.deps import get_current_user, get_current_workspace, get_current_workspace_member
from ..models.user import User
from ..models.workspace import Workspace, WorkspaceMember
from ..models.platform import SupportRequest
from ..schemas.auth import Token, Register, AuthMeResponse, UserResponse, WorkspaceResponse, ChangePassword
from ..schemas.platform import ForgotPasswordRequest
from ..schemas.user import User as UserSchema
from ..schemas.workspace import Workspace as WorkspaceSchema
from ..services.activity_service import log_audit_event
from ..services.email_service import send_email, send_email_background
from ..services import email_templates
from ..core.config import settings
from datetime import datetime
import re

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
    # Update last login
    user.last_login_at = datetime.now()
    db.commit()

    access_token_expires = timedelta(minutes=security.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/change-password")
def change_password(
    data: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not security.verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Mevcut şifre hatalı.")
    
    if data.new_password != data.new_password_confirm:
        raise HTTPException(status_code=400, detail="Yeni şifreler eşleşmiyor.")
    
    # Check if new password is same as current password
    if security.verify_password(data.new_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Yeni şifre mevcut şifre ile aynı olamaz.")
    
    # Password policy validation
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Şifre en az 8 karakter olmalıdır.")
    if not re.search("[a-z]", data.new_password):
        raise HTTPException(status_code=400, detail="Şifre en az bir küçük harf içermelidir.")
    if not re.search("[A-Z]", data.new_password):
        raise HTTPException(status_code=400, detail="Şifre en az bir büyük harf içermelidir.")
    if not re.search("[0-9]", data.new_password):
        raise HTTPException(status_code=400, detail="Şifre en az bir rakam içermelidir.")
    if not re.search("[!@#$%^&*(),.?\":{}|<>]", data.new_password):
        raise HTTPException(status_code=400, detail="Şifre en az bir özel karakter içermelidir.")
        
    current_user.password_hash = security.get_password_hash(data.new_password)
    current_user.must_change_password = False
    current_user.password_changed_at = datetime.now()
    db.commit()
    
    # Log Audit
    log_audit_event(
        db=db,
        action="user.password_changed",
        entity_type="user",
        entity_id=current_user.id,
        actor_user=current_user,
        description="Kullanıcı şifresini güncelledi."
    )
    
    return {"message": "Şifreniz başarıyla güncellendi. Lütfen tekrar giriş yapın."}

@router.post("/register", response_model=UserSchema)
def register(
    *,
    db: Session = Depends(get_db),
    reg_in: Register
) -> Any:
    """
    Create new user and workspace.
    """
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
        actor_user=new_user, 
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

@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # Save request
    new_request = SupportRequest(
        email=data.email,
        type="forgot_password",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent"),
        status="new"
    )
    db.add(new_request)
    db.commit()
    
    # Send Notification Emails in Background
    # 1. To User
    user_tpl = email_templates.support_request_received_user_notice()
    background_tasks.add_task(
        send_email_background,
        to=data.email,
        subject=user_tpl["subject"],
        html_body=user_tpl["html"],
        text_body=user_tpl["text"],
        template_key="forgot_password_user_notice"
    )
    
    # 2. To Admin
    admin_email = settings.ADMIN_NOTIFICATION_EMAIL or settings.OPERIO_SUPERADMIN_EMAIL
    if admin_email:
        admin_tpl = email_templates.forgot_password_request_admin_notice(
            email=data.email,
            date_str=datetime.now().strftime("%Y-%m-%d %H:%M")
        )
        background_tasks.add_task(
            send_email_background,
            to=admin_email,
            subject=admin_tpl["subject"],
            html_body=admin_tpl["html"],
            text_body=admin_tpl["text"],
            template_key="forgot_password_admin_notice"
        )

    # Always return success message to prevent enumeration
    return {
        "message": "Şifre sıfırlama talebiniz alındı. Hesabınız doğrulandıktan sonra işletme yöneticiniz veya Operio destek ekibi sizinle iletişime geçecektir."
    }

@router.get("/me", response_model=AuthMeResponse)
def read_user_me(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    # 1. Start with defaults
    workspace = None
    role = None
    
    # 2. Check for Platform Manager Header (X-Active-Workspace-Id)
    active_workspace_id = request.headers.get("X-Active-Workspace-Id")
    
    if current_user.is_super_admin:
        role = "admin" # Default role for super admin
        
        if active_workspace_id:
            try:
                ws_id = int(active_workspace_id)
                workspace = db.query(Workspace).filter(Workspace.id == ws_id).first()
            except (ValueError, TypeError):
                pass # Ignore invalid header for /me
    
    # 3. If no workspace yet (either normal user or super admin without header)
    if not workspace:
        member = db.query(WorkspaceMember).filter(
            WorkspaceMember.user_id == current_user.id,
            WorkspaceMember.is_active == True
        ).first()
        
        if member:
            workspace = db.query(Workspace).filter(Workspace.id == member.workspace_id).first()
            role = member.role
        elif not current_user.is_super_admin:
            # ONLY raise error for non-super admins
            raise HTTPException(status_code=404, detail="No active workspace found for user")

    return AuthMeResponse(
        user=UserResponse.model_validate(current_user),
        workspace=WorkspaceResponse.model_validate(workspace) if workspace else None,
        role=role,
    )
