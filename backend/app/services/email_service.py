import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from ..core.config import settings
from ..models.email_log import EmailLog
from ..core.database import SessionLocal

def send_email(
    db: Session,
    to: str,
    subject: str,
    html_body: str,
    text_body: Optional[str] = None,
    template_key: Optional[str] = None,
    workspace_id: Optional[int] = None,
    user_id: Optional[int] = None,
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[int] = None
):
    """
    Sends an email and logs the attempt.
    If SMTP is disabled, it logs as 'skipped'.
    """
    # 1. Create Log Entry
    email_log = EmailLog(
        workspace_id=workspace_id,
        user_id=user_id,
        recipient_email=to,
        subject=subject,
        template_key=template_key,
        status="pending",
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
        provider="SMTP"
    )
    db.add(email_log)
    db.flush() # Get ID

    # 2. Check if SMTP is enabled
    if not settings.SMTP_ENABLED:
        email_log.status = "skipped"
        email_log.error_message = "SMTP is disabled in settings."
        db.commit()
        return False

    # 3. Attempt Sending
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to

        if text_body:
            msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        # Connect and send with 10s timeout
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            
            server.send_message(msg)
        
        # 4. Update Log on Success
        email_log.status = "sent"
        email_log.sent_at = datetime.now()
        db.commit()
        return True

    except Exception as e:
        # 5. Update Log on Failure
        email_log.status = "failed"
        email_log.error_message = str(e)
        db.commit()
        # We don't raise the error to prevent breaking the main flow
        return False

def send_email_background(
    to: str,
    subject: str,
    html_body: str,
    text_body: Optional[str] = None,
    template_key: Optional[str] = None,
    workspace_id: Optional[int] = None,
    user_id: Optional[int] = None,
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[int] = None
):
    """
    Wrapper for send_email to be used with FastAPI BackgroundTasks.
    It manages its own database session.
    """
    db = SessionLocal()
    try:
        send_email(
            db=db,
            to=to,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
            template_key=template_key,
            workspace_id=workspace_id,
            user_id=user_id,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id
        )
    finally:
        db.close()

