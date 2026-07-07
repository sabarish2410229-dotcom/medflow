from datetime import date, timedelta, datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.orm import joinedload

from database import get_db
from models import (
    User, Inventory, Order, OrderItem, TrackingEvent, OrderStatusEnum, OrderTypeEnum,
    ExchangeRequest, ExchangeRequestStatusEnum,
)
from schemas import ExchangeListingOut, OrderOut, ExchangeRequestCreate, ExchangeRequestOut
from auth import get_current_user, require_role

router = APIRouter(prefix="/exchange", tags=["Exchange"])

EXPIRY_WINDOW_DAYS = 90


def get_stats_map(db: Session, listing_ids: list) -> dict:
    if not listing_ids:
        return {}
    rows = (
        db.query(
            ExchangeRequest.listing_id,
            ExchangeRequest.status,
            func.count(ExchangeRequest.id),
            func.coalesce(func.sum(ExchangeRequest.quantity), 0),
        )
        .filter(ExchangeRequest.listing_id.in_(listing_ids))
        .group_by(ExchangeRequest.listing_id, ExchangeRequest.status)
        .all()
    )
    stats = {lid: {"reserved": 0, "pending_count": 0, "accepted_count": 0, "rejected_count": 0} for lid in listing_ids}
    for listing_id, status, count, qty in rows:
        if status == ExchangeRequestStatusEnum.pending:
            stats[listing_id]["reserved"] = qty
            stats[listing_id]["pending_count"] = count
        elif status == ExchangeRequestStatusEnum.accepted:
            stats[listing_id]["accepted_count"] = count
        elif status == ExchangeRequestStatusEnum.rejected:
            stats[listing_id]["rejected_count"] = count
    return stats

def build_listings_response(db: Session, items: list) -> list:
    stats_map = get_stats_map(db, [item.id for item in items])
    results = []
    for item in items:
        s = stats_map.get(item.id, {"reserved": 0, "pending_count": 0, "accepted_count": 0, "rejected_count": 0})
        results.append({
            "id": item.id,
            "owner_id": item.owner_id,
            "owner_name": item.owner.name,
            "owner_phone": item.owner.phone,
            "owner_address": item.owner.address,
            "medicine": item.medicine,
            "price": item.price,
            "stock": item.stock,
            "reserved_quantity": s["reserved"],
            "available_quantity": max(0, item.stock - s["reserved"]),
            "pending_count": s["pending_count"],
            "accepted_count": s["accepted_count"],
            "rejected_count": s["rejected_count"],
            "expiry_date": item.expiry_date,
        })
    return results
@router.get("/listings", response_model=List[ExchangeListingOut])
@router.get("/listings", response_model=List[ExchangeListingOut])
def browse_near_expiry_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("pharmacy")),
):
    """Shows near-expiry medicines listed by OTHER pharmacies, with live availability."""
    cutoff_date = date.today() + timedelta(days=EXPIRY_WINDOW_DAYS)

    listings = (
        db.query(Inventory)
        .options(
            joinedload(Inventory.owner),
            joinedload(Inventory.medicine),
        )
        .filter(
            Inventory.is_dealer_stock == False,
            Inventory.owner_id != current_user.id,
            Inventory.expiry_date != None,
            Inventory.expiry_date <= cutoff_date,
            Inventory.expiry_date >= date.today(),
            Inventory.stock > 0,
        )
        .all()
    )

    return build_listings_response(db, listings)

@router.get("/mine", response_model=List[ExchangeListingOut])
def my_near_expiry_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("pharmacy")),
):
    """Shows YOUR OWN near-expiry stock, with reserved/available breakdown and request counts."""
    cutoff_date = date.today() + timedelta(days=EXPIRY_WINDOW_DAYS)

    listings = (
        db.query(Inventory)
        .options(
            joinedload(Inventory.owner),
            joinedload(Inventory.medicine)
        )
        .filter(
            Inventory.is_dealer_stock == False,
            Inventory.owner_id == current_user.id,
            Inventory.expiry_date != None,
            Inventory.expiry_date <= cutoff_date,
            Inventory.expiry_date >= date.today(),
            Inventory.stock > 0,
        )
        .all() 
    )
    return build_listings_response(db, listings)


@router.post("/{inventory_id}/purchase", response_model=OrderOut)
def purchase_near_expiry_stock(
    inventory_id: int,
    quantity: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("pharmacy")),
):
    """Instant-buy path (unchanged) — still deducts stock immediately, separate from the request/negotiation flow."""
    listing = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot buy your own listing")
    if listing.stock < quantity:
        raise HTTPException(status_code=400, detail=f"Only {listing.stock} units available")

    new_order = Order(
        buyer_id=current_user.id,
        seller_id=listing.owner_id,
        order_type=OrderTypeEnum.exchange,
        status=OrderStatusEnum.created,
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    order_item = OrderItem(
        order_id=new_order.id,
        medicine_id=listing.medicine_id,
        quantity=quantity,
        price=listing.price,
    )
    db.add(order_item)
    listing.stock -= quantity
    db.add(TrackingEvent(order_id=new_order.id, status=OrderStatusEnum.created))

    db.commit()
    db.refresh(new_order)
    return new_order


def enrich_request(req: ExchangeRequest) -> dict:
    return {
        "id": req.id,
        "listing_id": req.listing_id,
        "buyer_id": req.buyer_id,
        "buyer_name": req.buyer.name if req.buyer else None,
        "seller_id": req.seller_id,
        "seller_name": req.seller.name if req.seller else None,
        "medicine": req.medicine,
        "quantity": req.quantity,
        "price": req.price,
        "status": req.status,
        "linked_order_id": req.linked_order_id,
        "requested_at": req.requested_at,
        "viewed_at": req.viewed_at,
        "accepted_at": req.accepted_at,
        "rejected_at": req.rejected_at,
        "cancelled_at": req.cancelled_at,
        "completed_at": req.completed_at,
    }

@router.post("/requests", response_model=ExchangeRequestOut)
def create_exchange_request(
    request_in: ExchangeRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("pharmacy")),
):
    listing = db.query(Inventory).filter(Inventory.id == request_in.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot request your own listing")

    # Check against AVAILABLE quantity (stock minus what's already reserved by pending requests),
    # not raw stock — prevents multiple buyers over-requesting the same limited stock.
    stats = get_stats_map(db, [listing.id]).get(listing.id, {"reserved": 0})
    reserved = stats["reserved"]
    available = listing.stock - reserved
    if available < request_in.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Only {available} units available ({reserved} already reserved by pending requests)",
        )

    # Prevent duplicate pending requests from the same buyer on the same listing
    existing = (
        db.query(ExchangeRequest)
        .filter(
            ExchangeRequest.listing_id == listing.id,
            ExchangeRequest.buyer_id == current_user.id,
            ExchangeRequest.status == ExchangeRequestStatusEnum.pending,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending request for this listing")

    new_request = ExchangeRequest(
        listing_id=listing.id,
        buyer_id=current_user.id,
        seller_id=listing.owner_id,
        medicine_id=listing.medicine_id,
        quantity=request_in.quantity,
        price=listing.price,
        status=ExchangeRequestStatusEnum.pending,
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return enrich_request(new_request)


@router.get("/requests/incoming", response_model=List[ExchangeRequestOut])
def get_incoming_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("pharmacy")),
):
    requests = (
        db.query(ExchangeRequest)
        .filter(ExchangeRequest.seller_id == current_user.id)
        .order_by(ExchangeRequest.requested_at.desc())
        .all()
    )

    now = datetime.utcnow()
    changed = False
    for r in requests:
        if r.status == ExchangeRequestStatusEnum.pending and r.viewed_at is None:
            r.viewed_at = now
            changed = True
    if changed:
        db.commit()
        for r in requests:
            db.refresh(r)

    return [enrich_request(r) for r in requests]


@router.get("/requests/mine", response_model=List[ExchangeRequestOut])
def get_my_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("pharmacy")),
):
    requests = (
        db.query(ExchangeRequest)
        .filter(ExchangeRequest.buyer_id == current_user.id)
        .order_by(ExchangeRequest.requested_at.desc())
        .all()
    )
    return [enrich_request(r) for r in requests]


@router.put("/requests/{request_id}/accept", response_model=ExchangeRequestOut)
def accept_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("pharmacy")),
):
    req = db.query(ExchangeRequest).filter(ExchangeRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the seller can accept this request")
    if req.status != ExchangeRequestStatusEnum.pending:
        raise HTTPException(status_code=400, detail=f"Cannot accept a request that is '{req.status.value}'")

    listing = db.query(Inventory).filter(Inventory.id == req.listing_id).first()
    if not listing or listing.stock < req.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock to accept this request")

    # Seller's stock decreases immediately — this is what makes Browse/My Listings
    # shrink or disappear for everyone automatically.
    listing.stock -= req.quantity

    # Create a real Order that flows through the SAME state machine as procurement
    # orders (created -> accepted -> packed -> dispatched -> out_for_delivery -> delivered),
    # reusing the existing OrderTimeline UI and tracking system.
    new_order = Order(
        buyer_id=req.buyer_id,
        seller_id=req.seller_id,
        order_type=OrderTypeEnum.exchange,
        status=OrderStatusEnum.accepted,  # starts at "accepted" since the request negotiation already happened
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    order_item = OrderItem(
        order_id=new_order.id,
        medicine_id=req.medicine_id,
        quantity=req.quantity,
        price=req.price,
    )
    db.add(order_item)

    # Log both steps so the timeline shows the full history
    db.add(TrackingEvent(order_id=new_order.id, status=OrderStatusEnum.created))
    db.add(TrackingEvent(order_id=new_order.id, status=OrderStatusEnum.accepted))

    req.status = ExchangeRequestStatusEnum.accepted
    req.accepted_at = datetime.utcnow()
    req.linked_order_id = new_order.id  # so the frontend can find and show this order's timeline

    db.commit()
    db.refresh(req)
    return enrich_request(req)

@router.put("/requests/{request_id}/reject", response_model=ExchangeRequestOut)
def reject_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("pharmacy")),
):
    req = db.query(ExchangeRequest).filter(ExchangeRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the seller can reject this request")
    if req.status != ExchangeRequestStatusEnum.pending:
        raise HTTPException(status_code=400, detail=f"Cannot reject a request that is '{req.status.value}'")

    req.status = ExchangeRequestStatusEnum.rejected
    req.rejected_at = datetime.utcnow()
    db.commit()
    db.refresh(req)
    return enrich_request(req)


@router.put("/requests/{request_id}/cancel", response_model=ExchangeRequestOut)
def cancel_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("pharmacy")),
):
    req = db.query(ExchangeRequest).filter(ExchangeRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the buyer can cancel this request")
    if req.status not in (ExchangeRequestStatusEnum.pending, ExchangeRequestStatusEnum.accepted):
        raise HTTPException(status_code=400, detail=f"Cannot cancel a request that is '{req.status.value}'")

    if req.status == ExchangeRequestStatusEnum.accepted:
        listing = db.query(Inventory).filter(Inventory.id == req.listing_id).first()
        if listing:
            listing.stock += req.quantity

    req.status = ExchangeRequestStatusEnum.cancelled
    req.cancelled_at = datetime.utcnow()
    db.commit()
    db.refresh(req)
    return enrich_request(req)

