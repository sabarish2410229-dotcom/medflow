import hashlib
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User, Medicine, Inventory, RecommendationLog
from schemas import RecommendationResult
from auth import get_current_user, require_role
from services.ahp import score_suppliers
import json

router = APIRouter(prefix="/procurement", tags=["Procurement"])


def deterministic_metric(seed_str: str, low: float, high: float, decimals: int = 1) -> float:
    """
    Generates a stable pseudo-random number from a fixed seed (e.g. dealer_id + medicine_id),
    so the same dealer always gets the same rating/delivery time for the same medicine,
    instead of a new random value on every search.
    """
    hash_val = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
    fraction = (hash_val % 10000) / 10000  # 0.0 - 1.0
    value = low + fraction * (high - low)
    return round(value, decimals)

@router.get("/suggestions")
def medicine_suggestions(
    q: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("pharmacy")),
):
    if len(q) < 2:
        return []
    matches = (
        db.query(Medicine)
        .filter(Medicine.name.ilike(f"%{q}%"))
        .limit(8)
        .all()
    )
    return [{"id": m.id, "name": m.name, "category": m.category} for m in matches]

@router.get("/search", response_model=List[RecommendationResult])
def search_and_recommend(
    medicine_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("pharmacy")),
):
    medicine = (
        db.query(Medicine)
        .filter(Medicine.name.ilike(f"%{medicine_name}%"))
        .first()
    )
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    dealer_stocks = (
        db.query(Inventory)
        .filter(Inventory.medicine_id == medicine.id, Inventory.is_dealer_stock == True)
        .all()
    )

    if not dealer_stocks:
        raise HTTPException(status_code=404, detail="No dealers currently stock this medicine")

    suppliers = []
    for item in dealer_stocks:
        seed = f"{item.owner_id}-{medicine.id}"
        suppliers.append({
            "dealer_id": item.owner.id,
            "dealer_name": item.owner.name,
            "inventory_id": item.id,
            "price": item.price,
            "stock": item.stock,
            "rating": deterministic_metric(seed + "-rating", 3.5, 5.0),
            "delivery_days": int(deterministic_metric(seed + "-delivery", 1, 5, decimals=0)),
        })

    ranked_results, consistency_ratio = score_suppliers(suppliers)

    dealer_lookup = {item.owner.id: item.owner for item in dealer_stocks}
    for r in ranked_results:
        r["medicine_id"] = medicine.id
        dealer = dealer_lookup.get(r["dealer_id"])
        r["dealer_phone"] = dealer.phone if dealer else None
        r["dealer_address"] = dealer.address if dealer else None

    if ranked_results:
        top = ranked_results[0]
        log_entry = RecommendationLog(
            pharmacy_id=current_user.id,
            medicine_id=medicine.id,
            chosen_dealer_id=top["dealer_id"],
            score=top["score"],
            criteria_breakdown=json.dumps({
                "consistency_ratio": round(float(consistency_ratio), 4),
                "all_results": ranked_results,
            }),
        )
        db.add(log_entry)
        db.commit()

    return ranked_results