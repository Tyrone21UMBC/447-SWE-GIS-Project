from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import User, WorkOrder
from schema import StatusUpdate, WorkOrderResponse
from security import require_admin

router = APIRouter(
    prefix="/work-orders",
    tags=["Work orders"]
)


def to_response(order: WorkOrder) -> WorkOrderResponse:
    return WorkOrderResponse(
        id=order.id,
        bmp_id=order.bmp_id,
        bmp_name=order.bmp_name,
        filename=order.filename,
        drive_url=order.drive_url,
        status=order.status,
        submitted_by=order.submitter.username if order.submitter else None,
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


# Newest first
@router.get("", response_model=list[WorkOrderResponse])
def list_work_orders(
    limit: int = 500,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    orders = (db.query(WorkOrder)
              .options(joinedload(WorkOrder.submitter))
              .order_by(WorkOrder.created_at.desc(), WorkOrder.id.desc())
              .limit(min(max(limit, 1), 500))
              .all())
    return [to_response(o) for o in orders]


@router.patch("/{order_id}", response_model=WorkOrderResponse)
def set_status(
    order_id: int,
    update: StatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    order = db.get(WorkOrder, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Work order not found")
    order.status = update.status
    order.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(order)
    return to_response(order)
