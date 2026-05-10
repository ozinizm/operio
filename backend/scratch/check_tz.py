from app.core.database import SessionLocal
from app.models.email_log import EmailLog
from app.models.task import Task

db = SessionLocal()
log = db.query(EmailLog).order_by(EmailLog.id.desc()).first()
task = db.query(Task).order_by(Task.id.desc()).first()

print(f"Log ID: {log.id}, created_at: {repr(log.created_at)} (tzinfo: {log.created_at.tzinfo})")
print(f"Task ID: {task.id}, created_at: {repr(task.created_at)} (tzinfo: {task.created_at.tzinfo})")
db.close()
