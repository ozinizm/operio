from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..core.database import get_db
from ..core.deps import get_current_user, get_current_workspace
from ..models.user import User
from ..models.workspace import Workspace
from ..models.customer import Customer
from ..models.job import Job
from ..models.task import Task
from ..models.activity import Activity
from ..models.finance import FinanceEntry
from ..models.offer import Offer
from ..models.file_asset import FileAsset
from ..models.delivery_service import DeliveryService
from ..models.request_ticket import RequestTicket
from ..models.inventory import InventoryItem

router = APIRouter()

@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace),
) -> Any:
    # Counts
    active_customers = db.query(Customer).filter(
        Customer.workspace_id == workspace.id,
        Customer.status == "active",
        Customer.is_deleted == False
    ).count()

    open_jobs = db.query(Job).filter(
        Job.workspace_id == workspace.id,
        Job.status.in_(["new", "planned", "in_progress", "waiting"]),
        Job.is_deleted == False
    ).count()

    today_tasks = db.query(Task).filter(
        Task.workspace_id == workspace.id,
        Task.status.in_(["todo", "in_progress"]),
        Task.is_deleted == False
    ).count()

    # Recent Activities — serialize to plain dicts (ORM objects are not JSON-serializable)
    activity_rows = db.query(Activity).filter(
        Activity.workspace_id == workspace.id
    ).order_by(Activity.created_at.desc()).limit(10).all()

    recent_activities = [
        {
            "id": a.id,
            "entity_type": a.entity_type,
            "entity_id": a.entity_id,
            "action": a.action,
            "description": a.description,
            "actor_user_id": a.actor_user_id,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in activity_rows
    ]

    # Upcoming Tasks — serialize to plain dicts
    task_rows = db.query(Task).filter(
        Task.workspace_id == workspace.id,
        Task.status.in_(["todo", "in_progress"]),
        Task.is_deleted == False
    ).order_by(Task.due_date.asc()).limit(5).all()

    upcoming_tasks = [
        {
            "id": t.id,
            "title": t.title,
            "status": t.status,
            "priority": t.priority,
            "assignee_user_id": t.assignee_user_id,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "job_id": t.job_id,
            "customer_id": t.customer_id,
        }
        for t in task_rows
    ]

    # Finance Metrics — cast to float (func.sum returns Decimal which is not JSON-serializable)
    pending_collection = float(
        db.query(func.sum(FinanceEntry.amount)).filter(
            FinanceEntry.workspace_id == workspace.id,
            FinanceEntry.type == "income",
            FinanceEntry.status == "pending",
            FinanceEntry.is_deleted == False
        ).scalar() or 0
    )

    # Offer Summary — cast aggregate to float
    sent_offers = db.query(Offer).filter(
        Offer.workspace_id == workspace.id, 
        Offer.status == "sent",
        Offer.is_deleted == False
    ).count()
    approved_offers = db.query(Offer).filter(
        Offer.workspace_id == workspace.id, 
        Offer.status == "approved",
        Offer.is_deleted == False
    ).count()
    total_offer_amount = float(
        db.query(func.sum(Offer.amount)).filter(
            Offer.workspace_id == workspace.id,
            Offer.is_deleted == False
        ).scalar() or 0
    )

    # Operation Summary (by status) — plain dict of str -> int
    job_stats = db.query(Job.status, func.count(Job.id)).filter(
        Job.workspace_id == workspace.id,
        Job.is_deleted == False
    ).group_by(Job.status).all()

    operation_summary = {s: c for s, c in job_stats}

    # File count
    total_files = db.query(FileAsset).filter(
        FileAsset.workspace_id == workspace.id,
        FileAsset.is_deleted == False
    ).count()

    # Delivery & Requests
    pending_deliveries = db.query(DeliveryService).filter(
        DeliveryService.workspace_id == workspace.id,
        DeliveryService.status.in_(["planned", "on_the_way", "in_progress"]),
        DeliveryService.is_deleted == False
    ).count()

    open_complaints = db.query(RequestTicket).filter(
        RequestTicket.workspace_id == workspace.id,
        RequestTicket.status.in_(["new", "reviewing", "in_progress", "waiting_customer"]),
        RequestTicket.is_deleted == False
    ).count()

    critical_requests = db.query(RequestTicket).filter(
        RequestTicket.workspace_id == workspace.id,
        RequestTicket.priority == "critical",
        RequestTicket.status != "closed",
        RequestTicket.is_deleted == False
    ).count()

    low_stock_count = db.query(InventoryItem).filter(
        InventoryItem.workspace_id == workspace.id,
        InventoryItem.status.in_(["low_stock", "out_of_stock"]),
        InventoryItem.is_deleted == False
    ).count()

    return {
        "active_customers": active_customers,
        "open_jobs": open_jobs,
        "today_tasks": today_tasks,
        "pending_deliveries": pending_deliveries,
        "open_complaints": open_complaints,
        "critical_requests": critical_requests,
        "pending_collection": pending_collection,
        "total_files": total_files,
        "recent_activities": recent_activities,
        "upcoming_tasks": upcoming_tasks,
        "operation_summary": operation_summary,
        "low_stock_count": low_stock_count,
        "offer_summary": {
            "sent_offers": sent_offers,
            "approved_offers": approved_offers,
            "total_offer_amount": total_offer_amount,
        },
    }
