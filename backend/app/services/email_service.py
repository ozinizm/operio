import smtplib
import requests
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
    Supports Resend API and SMTP fallback.
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
        provider="Resend" if settings.RESEND_ENABLED else "SMTP"
    )
    db.add(email_log)
    db.flush() # Get ID

    # 2. Try Resend API if enabled
    if settings.RESEND_ENABLED:
        if not settings.RESEND_API_KEY:
            email_log.status = "failed"
            email_log.error_message = "Resend API Key is missing."
            db.commit()
            return False

        try:
            url = "https://api.resend.com/emails"
            headers = {
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "from": f"{settings.RESEND_FROM_NAME} <{settings.RESEND_FROM_EMAIL}>",
                "to": [to],
                "subject": subject,
                "html": html_body,
                "text": text_body or ""
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code in [200, 201, 202, 204]:
                email_log.status = "sent"
                email_log.sent_at = datetime.now()
                db.commit()
                return True
            else:
                email_log.status = "failed"
                email_log.error_message = f"Resend API Error: {response.status_code} - {response.text}"
                db.commit()
                return False
        except Exception as e:
            email_log.status = "failed"
            email_log.error_message = f"Resend Exception: {str(e)}"
            db.commit()
            return False

    # 3. Try SMTP Fallback if Resend is disabled
    if settings.SMTP_ENABLED:
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
            
            # Update Log on Success
            email_log.status = "sent"
            email_log.sent_at = datetime.now()
            db.commit()
            return True

        except Exception as e:
            # Update Log on Failure
            email_log.status = "failed"
            email_log.error_message = f"SMTP Error: {str(e)}"
            db.commit()
            return False

    # 4. If neither is enabled
    email_log.status = "skipped"
    email_log.error_message = "No email provider (Resend or SMTP) is enabled."
    db.commit()
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

