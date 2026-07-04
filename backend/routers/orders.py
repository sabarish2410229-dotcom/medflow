from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User, Order, OrderItem, TrackingEvent, Inventory, OrderStatusEnum, OrderTypeEnum
from schemas import OrderCreate, OrderOut, OrderStatusUpdate
from auth import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])


# Defines which status can move to which next status — this is the "state machine"
VALID_TRANSITIONS = {
    OrderStatusEnum.created: [OrderStatusEnum.accepted],
    OrderStatusEnum.accepted: [OrderStatusEnum.packed],
    OrderStatusEnum.packed: [OrderStatusEnum.dispatched],
    OrderStatusEnum.dispatched: [OrderStatusEnum.out_for_delivery],
    OrderStatusEnum.out_for_delivery: [OrderStatusEnum.delivered],
    OrderStatusEnum.delivered: [],  # final state, no further transitions
}


@router.post("/", response_model=OrderOut)
def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if order_in.seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot order from yourself")

    new_order = Order(
        buyer_id=current_user.id,
        seller_id=order_in.seller_id,
        order_type=order_in.order_type,
        status=OrderStatusEnum.created,
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    for item in order_in.items:
        order_item = OrderItem(
            order_id=new_order.id,
            medicine_id=item.medicine_id,
            quantity=item.quantity,
            price=item.price,
        )
        db.add(order_item)

    # Log the initial tracking event
    tracking = TrackingEvent(order_id=new_order.id, status=OrderStatusEnum.created)
    db.add(tracking)

    db.commit()
    db.refresh(new_order)
    return new_order


@router.get("/mine", response_model=List[OrderOut])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Order)
        .filter(
            (Order.buyer_id == current_user.id) | (Order.seller_id == current_user.id)
        )
        .all()
    )


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.id not in (order.buyer_id, order.seller_id):
        raise HTTPException(status_code=403, detail="Not your order")
    return order


@router.put("/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Only the seller can update order status (they're the one fulfilling it)
    if current_user.id != order.seller_id:
        raise HTTPException(status_code=403, detail="Only the seller can update order status")

    new_status = status_update.status
    allowed_next_statuses = VALID_TRANSITIONS.get(order.status, [])

    if new_status not in allowed_next_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot move from '{order.status.value}' to '{new_status.value}'. "
                   f"Allowed next steps: {[s.value for s in allowed_next_statuses]}",
        )

    order.status = new_status
    db.add(TrackingEvent(order_id=order.id, status=new_status))
    db.commit()
    db.refresh(order)
    return order


@router.get("/{order_id}/tracking")
def get_order_tracking(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.id not in (order.buyer_id, order.seller_id):
        raise HTTPException(status_code=403, detail="Not your order")

    events = (
        db.query(TrackingEvent)
        .filter(TrackingEvent.order_id == order_id)
        .order_by(TrackingEvent.timestamp.asc())
        .all()
    )
    return [{"status": e.status, "timestamp": e.timestamp} for e in events]