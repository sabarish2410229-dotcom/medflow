from datetime import date, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User, Inventory, Order, OrderItem, TrackingEvent, OrderStatusEnum, OrderTypeEnum
from schemas import ExchangeListingOut, OrderOut
from auth import get_current_user

router = APIRouter(prefix="/exchange", tags=["Exchange"])

# Medicines expiring within this many days become eligible for exchange
EXPIRY_WINDOW_DAYS = 90


@router.get("/listings", response_model=List[ExchangeListingOut])
def browse_near_expiry_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Shows near-expiry medicines listed by OTHER pharmacies (not your own),
    so you can buy stock that's about to be wasted elsewhere.
    """
    cutoff_date = date.today() + timedelta(days=EXPIRY_WINDOW_DAYS)

    listings = (
        db.query(Inventory)
        .filter(
            Inventory.is_dealer_stock == False,          # only pharmacy stock, not dealer stock
            Inventory.owner_id != current_user.id,         # not your own listings
            Inventory.expiry_date != None,
            Inventory.expiry_date <= cutoff_date,
            Inventory.expiry_date >= date.today(),          # not already expired
            Inventory.stock > 0,
        )
        .all()
    )
    return listings


@router.get("/mine", response_model=List[ExchangeListingOut])
def my_near_expiry_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Shows YOUR OWN pharmacy stock that has entered the near-expiry window —
    these are automatically eligible for listing, no separate 'list' action needed.
    """
    cutoff_date = date.today() + timedelta(days=EXPIRY_WINDOW_DAYS)

    listings = (
        db.query(Inventory)
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
    return listings


@router.post("/{inventory_id}/purchase", response_model=OrderOut)
def purchase_near_expiry_stock(
    inventory_id: int,
    quantity: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Buy near-expiry stock from another pharmacy. Reuses the same Order +
    TrackingEvent infrastructure as regular procurement orders.
    """
    listing = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot buy your own listing")
    if listing.stock < quantity:
        raise HTTPException(status_code=400, detail=f"Only {listing.stock} units available")

    # Create the exchange order (same mechanism as procurement orders)
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

    # Reduce the seller's listed stock
    listing.stock -= quantity

    db.add(TrackingEvent(order_id=new_order.id, status=OrderStatusEnum.created))

    db.commit()
    db.refresh(new_order)
    return new_order