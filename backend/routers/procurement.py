import random
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User, Medicine, Inventory, RecommendationLog
from schemas import RecommendationResult
from auth import get_current_user
from services.ahp import score_suppliers
import json

router = APIRouter(prefix="/procurement", tags=["Procurement"])


@router.get("/search", response_model=List[RecommendationResult])
def search_and_recommend(
    medicine_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    medicine = db.query(Medicine).filter(Medicine.name.ilike(medicine_name)).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    # Get all dealer stock for this medicine
    dealer_stocks = (
        db.query(Inventory)
        .filter(Inventory.medicine_id == medicine.id, Inventory.is_dealer_stock == True)
        .all()
    )

    if not dealer_stocks:
        raise HTTPException(status_code=404, detail="No dealers currently stock this medicine")

    # Build supplier list for the AHP engine
    # NOTE: rating and delivery_days are placeholders for this MVP —
    # Phase 2 would derive these from real order history (RecommendationLog, TrackingEvent)
    suppliers = []
    for item in dealer_stocks:
        suppliers.append({
            "dealer_id": item.owner.id,
            "dealer_name": item.owner.name,
            "inventory_id": item.id,
            "price": item.price,
            "stock": item.stock,
            "rating": round(random.uniform(3.5, 5.0), 1),      # placeholder
            "delivery_days": random.randint(1, 5),              # placeholder
        })

    ranked_results, consistency_ratio = score_suppliers(suppliers)

    # Log the top recommendation for future analysis (decision logging)
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