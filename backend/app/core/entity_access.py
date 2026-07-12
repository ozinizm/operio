from typing import Any, Dict, Type

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models.customer import Customer
from ..models.delivery_service import DeliveryService
from ..models.file_asset import FileAsset
from ..models.finance import FinanceEntry
from ..models.job import Job
from ..models.offer import Offer
from ..models.request_ticket import RequestTicket
from ..models.task import Task


ENTITY_MODELS: Dict[str, Type[Any]] = {
    "customer": Customer,
    "job": Job,
    "task": Task,
    "offer": Offer,
    "file": FileAsset,
    "finance_entry": FinanceEntry,
    "delivery_service": DeliveryService,
    "request_ticket": RequestTicket,
}

ENTITY_TYPE_ALLOWLIST = frozenset(ENTITY_MODELS)


def get_workspace_entity_or_404(
    db: Session,
    *,
    workspace_id: int,
    entity_type: str,
    entity_id: int,
) -> Any:
    model = ENTITY_MODELS.get(entity_type)
    if model is None:
        raise HTTPException(status_code=404, detail="Entity not found")

    filters = [model.id == entity_id, model.workspace_id == workspace_id]
    if hasattr(model, "is_deleted"):
        filters.append(model.is_deleted == False)

    entity = db.query(model).filter(*filters).first()
    if entity is None:
        # Do not reveal whether an entity exists in another workspace.
        raise HTTPException(status_code=404, detail="Entity not found")
    return entity


def get_entity_display_name(entity: Any) -> str:
    for attribute in ("name", "title", "original_filename"):
        value = getattr(entity, attribute, None)
        if value:
            return str(value)
    return f"#{getattr(entity, 'id', '')}".strip()
