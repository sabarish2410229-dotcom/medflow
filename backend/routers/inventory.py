from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import User, Medicine, Inventory
from schemas import InventoryCreate, InventoryOut
from auth import get_current_user

router = APIRouter(prefix="/inventory", tags=["Inventory"])


def get_or_create_medicine(db: Session, name: str, category: Optional[str]) -> Medicine:
    clean_name = name.strip()
    medicine = db.query(Medicine).filter(func.lower(Medicine.name) == func.lower(clean_name)).first()
    if medicine:
        return medicine
    medicine = Medicine(name=clean_name, category=category)
    db.add(medicine)
    db.commit()
    db.refresh(medicine)
    return medicine


@router.post("/", response_model=InventoryOut)
def add_inventory(
    item: InventoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    medicine = get_or_create_medicine(db, item.medicine_name, item.category)

    # Dealers add dealer stock, pharmacies add pharmacy stock — infer from role
    is_dealer_stock = current_user.role == "dealer"

    inventory_item = Inventory(
        owner_id=current_user.id,
        medicine_id=medicine.id,
        price=item.price,
        stock=item.stock,
        expiry_date=item.expiry_date,
        is_dealer_stock=is_dealer_stock,
    )
    db.add(inventory_item)
    db.commit()
    db.refresh(inventory_item)
    return inventory_item


@router.get("/mine", response_model=List[InventoryOut])
def get_my_inventory(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Inventory).filter(Inventory.owner_id == current_user.id).all()


@router.put("/{inventory_id}", response_model=InventoryOut)
def update_inventory(
    inventory_id: int,
    item: InventoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inventory_item = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not inventory_item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    if inventory_item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your inventory item")

    inventory_item.price = item.price
    inventory_item.stock = item.stock
    inventory_item.expiry_date = item.expiry_date

    db.commit()
    db.refresh(inventory_item)
    return inventory_item


@router.delete("/{inventory_id}")
def delete_inventory(
    inventory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inventory_item = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not inventory_item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    if inventory_item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your inventory item")

    db.delete(inventory_item)
    db.commit()
    return {"message": "Deleted successfully"}