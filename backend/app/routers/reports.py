import csv
import io
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, case
from app.core.database import get_db
from app.core.deps import get_current_user, get_current_workspace_member, check_role
from app.models.customer import Customer
from app.models.job import Job
from app.models.offer import Offer
from app.models.finance import FinanceEntry
from app.models.task import Task
from app.models.job_stage import JobStage
from app.models.activity import Activity
from app.models.delivery_service import DeliveryService
from app.models.request_ticket import RequestTicket

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/overview")
def get_overview_report(
    db: Session = Depends(get_db),
    member = Depends(get_current_workspace_member)
):
    # Check role
    if member.role not in ["owner", "admin", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    workspace_id = member.workspace_id
    
    total_customers = db.query(Customer).filter(Customer.workspace_id == workspace_id).count()
    active_customers = db.query(Customer).filter(Customer.workspace_id == workspace_id, Customer.status == "active").count()
    
    total_jobs = db.query(Job).filter(Job.workspace_id == workspace_id).count()
    open_jobs = db.query(Job).filter(Job.workspace_id == workspace_id, Job.status.in_(["new", "planned", "in_progress"])).count()
    completed_jobs = db.query(Job).filter(Job.workspace_id == workspace_id, Job.status == "completed").count()
    
    total_offers = db.query(Offer).filter(Offer.workspace_id == workspace_id).count()
    approved_offers = db.query(Offer).filter(Offer.workspace_id == workspace_id, Offer.status == "approved").count()
    
    finance_summary = db.query(
        func.sum(case((FinanceEntry.type == "income", FinanceEntry.amount), else_=0)).label("income"),
        func.sum(case((FinanceEntry.type == "expense", FinanceEntry.amount), else_=0)).label("expense"),
        func.sum(case((and_(FinanceEntry.type == "income", FinanceEntry.status != "paid"), FinanceEntry.amount), else_=0)).label("pending")
    ).filter(FinanceEntry.workspace_id == workspace_id).first()

    total_income = float(finance_summary.income or 0)
    total_expense = float(finance_summary.expense or 0)
    pending_collection = float(finance_summary.pending or 0)
    
    overdue_tasks = db.query(Task).filter(
        Task.workspace_id == workspace_id,
        Task.status != "completed",
        Task.due_date < datetime.utcnow()
    ).count()
    
    completion_rate = (completed_jobs / total_jobs * 100) if total_jobs > 0 else 0
    
    recent_activity_count = db.query(Activity).filter(
        Activity.workspace_id == workspace_id,
        Activity.created_at >= datetime.utcnow() - timedelta(days=7)
    ).count()

    # Delivery & Requests for overview
    pending_deliveries = db.query(DeliveryService).filter(
        DeliveryService.workspace_id == workspace_id,
        DeliveryService.status.in_(["planned", "on_the_way", "in_progress"])
    ).count()
    
    open_requests = db.query(RequestTicket).filter(
        RequestTicket.workspace_id == workspace_id,
        RequestTicket.status.in_(["new", "reviewing", "in_progress", "waiting_customer"])
    ).count()

    return {
        "total_customers": total_customers,
        "active_customers": active_customers,
        "total_jobs": total_jobs,
        "open_jobs": open_jobs,
        "completed_jobs": completed_jobs,
        "total_offers": total_offers,
        "approved_offers": approved_offers,
        "total_income": total_income,
        "total_expense": total_expense,
        "net_profit": total_income - total_expense,
        "pending_collection": pending_collection,
        "overdue_tasks": overdue_tasks,
        "completion_rate": round(completion_rate, 1),
        "recent_activity_count": recent_activity_count,
        "pending_deliveries": pending_deliveries,
        "open_requests": open_requests
    }

@router.get("/customers")
def get_customer_report(
    db: Session = Depends(get_db),
    member = Depends(get_current_workspace_member)
):
    if member.role not in ["owner", "admin", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    workspace_id = member.workspace_id
    
    by_status = db.query(Customer.status, func.count(Customer.id)).filter(Customer.workspace_id == workspace_id).group_by(Customer.status).all()
    by_sector = db.query(Customer.sector, func.count(Customer.id)).filter(Customer.workspace_id == workspace_id).group_by(Customer.sector).all()
    
    # Top customers by revenue (from finance entries)
    top_revenue = db.query(
        Customer.name, 
        func.sum(FinanceEntry.amount).label("revenue")
    ).join(FinanceEntry, FinanceEntry.customer_id == Customer.id)\
     .filter(Customer.workspace_id == workspace_id, FinanceEntry.type == "income")\
     .group_by(Customer.id)\
     .order_by(func.sum(FinanceEntry.amount).desc())\
     .limit(5).all()

    return {
        "by_status": dict(by_status),
        "by_sector": dict(by_sector),
        "top_revenue": [{"name": r[0], "revenue": float(r[1])} for r in top_revenue],
        "most_complaints": [] # Placeholder for now
    }

@router.get("/jobs")
def get_job_report(
    db: Session = Depends(get_db),
    member = Depends(get_current_workspace_member)
):
    if member.role not in ["owner", "admin", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    workspace_id = member.workspace_id
    
    by_status = db.query(Job.status, func.count(Job.id)).filter(Job.workspace_id == workspace_id).group_by(Job.status).all()
    by_priority = db.query(Job.priority, func.count(Job.id)).filter(Job.workspace_id == workspace_id).group_by(Job.priority).all()
    
    avg_progress = db.query(func.avg(Job.progress)).filter(Job.workspace_id == workspace_id).scalar() or 0
    
    overdue_jobs = db.query(Job).filter(
        Job.workspace_id == workspace_id,
        Job.status != "completed",
        Job.due_date < datetime.utcnow()
    ).count()

    return {
        "by_status": dict(by_status),
        "by_priority": dict(by_priority),
        "average_progress": round(float(avg_progress), 1),
        "overdue_jobs": overdue_jobs
    }

@router.get("/finance")
def get_finance_report(
    db: Session = Depends(get_db),
    member = Depends(get_current_workspace_member)
):
    if member.role not in ["owner", "admin", "finance"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    workspace_id = member.workspace_id
    
    finance_summary = db.query(
        func.sum(case((FinanceEntry.type == "income", FinanceEntry.amount), else_=0)).label("income"),
        func.sum(case((FinanceEntry.type == "expense", FinanceEntry.amount), else_=0)).label("expense"),
        func.sum(case((and_(FinanceEntry.type == "income", FinanceEntry.status != "paid"), FinanceEntry.amount), else_=0)).label("pending_income"),
        func.sum(case((and_(FinanceEntry.type == "income", FinanceEntry.status == "overdue"), FinanceEntry.amount), else_=0)).label("overdue_income")
    ).filter(FinanceEntry.workspace_id == workspace_id).first()
    
    # Income by category
    by_category = db.query(
        FinanceEntry.category, 
        func.sum(FinanceEntry.amount)
    ).filter(FinanceEntry.workspace_id == workspace_id, FinanceEntry.type == "expense")\
     .group_by(FinanceEntry.category).all()

    return {
        "total_income": float(finance_summary.income or 0),
        "total_expense": float(finance_summary.expense or 0),
        "pending_collection": float(finance_summary.pending_income or 0),
        "overdue_collection": float(finance_summary.overdue_income or 0),
        "expense_by_category": {cat: float(amt or 0) for cat, amt in by_category}
    }

@router.get("/operations")
def get_operations_report(
    db: Session = Depends(get_db),
    member = Depends(get_current_workspace_member)
):
    if member.role not in ["owner", "admin", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    workspace_id = member.workspace_id
    
    stages_by_status = db.query(JobStage.status, func.count(JobStage.id)).join(Job).filter(Job.workspace_id == workspace_id).group_by(JobStage.status).all()
    
    # Delivery stats
    delivery_stats = db.query(DeliveryService.status, func.count(DeliveryService.id)).filter(DeliveryService.workspace_id == workspace_id).group_by(DeliveryService.status).all()
    
    # Request stats
    request_stats = db.query(RequestTicket.status, func.count(RequestTicket.id)).filter(RequestTicket.workspace_id == workspace_id).group_by(RequestTicket.status).all()
    
    return {
        "stages_by_status": dict(stages_by_status),
        "delivery_stats": dict(delivery_stats),
        "request_stats": dict(request_stats)
    }

@router.get("/export/summary")
def export_summary(
    db: Session = Depends(get_db),
    member = Depends(get_current_workspace_member)
):
    if member.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    workspace_id = member.workspace_id
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Rapor Tipi", "Değer", "Detay"])
    
    # Gather data (simplified for MVP)
    customers = db.query(Customer).filter(Customer.workspace_id == workspace_id).count()
    jobs = db.query(Job).filter(Job.workspace_id == workspace_id).count()
    
    finance = db.query(
        func.sum(case((FinanceEntry.type == "income", FinanceEntry.amount), else_=0)).label("income"),
        func.sum(case((FinanceEntry.type == "expense", FinanceEntry.amount), else_=0)).label("expense")
    ).filter(FinanceEntry.workspace_id == workspace_id).first()

    writer.writerow(["Toplam Müşteri", customers, "Sistemdeki tüm müşteriler"])
    writer.writerow(["Toplam İş", jobs, "Sistemdeki tüm işler"])
    writer.writerow(["Toplam Gelir", float(finance.income or 0), "TRY"])
    writer.writerow(["Toplam Gider", float(finance.expense or 0), "TRY"])
    writer.writerow(["Net Kâr", float((finance.income or 0) - (finance.expense or 0)), "TRY"])
    
    filename = f"operio_summary_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
