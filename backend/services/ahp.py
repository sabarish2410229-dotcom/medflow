import os
import pickle
import numpy as np

# Saaty's fundamental scale pairwise comparison matrix
# Criteria order: [Price, Delivery Time, Rating, Stock Availability]
# This matrix encodes: Price is most important, then Stock, then Delivery, then Rating.
# You can adjust these numbers later, or let a pharmacy owner customize them.

DEFAULT_COMPARISON_MATRIX = np.array([
    [1,   3,   5,   2],   # Price vs [Price, Delivery, Rating, Stock]
    [1/3, 1,   3,   1/2], # Delivery vs [...]
    [1/5, 1/3, 1,   1/4], # Rating vs [...]
    [1/2, 2,   4,   1],   # Stock vs [...]
])

CRITERIA_NAMES = ["price", "delivery_time", "rating", "stock"]

# Random Index values for consistency ratio calculation (Saaty's table)
RANDOM_INDEX = {1: 0, 2: 0, 3: 0.58, 4: 0.9, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41}

# ---------- ML fulfillment prediction (Phase 2 layer) ----------

_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml", "fulfillment_model.pkl")
_ml_model = None


def _load_ml_model():
    global _ml_model
    if _ml_model is None:
        try:
            with open(_MODEL_PATH, "rb") as f:
                _ml_model = pickle.load(f)
        except FileNotFoundError:
            _ml_model = False  # mark as "tried and failed" so we don't retry every call
    return _ml_model if _ml_model is not False else None


def predict_fulfillment_probability(price: float, stock: int, delivery_days: int, rating: float):
    """
    Returns the ML model's predicted probability (0-1) that this dealer will
    fulfill an order on time, based on historical patterns. Returns None if
    the model file isn't available (e.g. cold start, or model not yet trained) —
    callers should fall back to pure AHP scoring in that case.
    """
    model = _load_ml_model()
    if model is None:
        return None
    try:
        proba = model.predict_proba([[price, stock, delivery_days, rating]])[0][1]
        return round(float(proba), 4)
    except Exception:
        return None


# ---------- AHP core ----------

def calculate_ahp_weights(matrix: np.ndarray = DEFAULT_COMPARISON_MATRIX):
    """
    Given a pairwise comparison matrix, returns:
    - normalized priority weights for each criterion
    - the consistency ratio (CR), to confirm the comparisons are logically sound
    """
    n = matrix.shape[0]

    # Step 1: normalize each column (divide each value by its column sum)
    column_sums = matrix.sum(axis=0)
    normalized_matrix = matrix / column_sums

    # Step 2: priority vector = average of each row in the normalized matrix
    weights = normalized_matrix.mean(axis=1)

    # Step 3: consistency check
    weighted_sum = matrix @ weights
    lambda_max = (weighted_sum / weights).mean()
    consistency_index = (lambda_max - n) / (n - 1)
    random_index = RANDOM_INDEX.get(n, 1.49)
    consistency_ratio = consistency_index / random_index if random_index != 0 else 0

    return weights, consistency_ratio


def normalize_scores(values, lower_is_better=False):
    """
    Normalize a list of raw values to a 0-1 scale so different units
    (price in rupees, delivery in days, etc.) can be fairly combined.
    """
    values = np.array(values, dtype=float)
    if values.max() == values.min():
        return np.ones_like(values)  # all equal, give everyone full marks

    if lower_is_better:
        # lower value -> higher score (used for price, delivery time)
        return (values.max() - values) / (values.max() - values.min())
    else:
        # higher value -> higher score (used for rating, stock)
        return (values - values.min()) / (values.max() - values.min())


# ---------- Combined AHP + ML scoring ----------

# How much the ML fulfillment prediction influences the final score.
# AHP remains dominant (70%) so the recommendation stays explainable;
# ML (30%) refines it using historical fulfillment patterns when available.
ML_BLEND_WEIGHT = 0.3
AHP_BLEND_WEIGHT = 1 - ML_BLEND_WEIGHT


def score_suppliers(suppliers: list[dict]):
    """
    suppliers: list of dicts, each with keys:
        dealer_id, dealer_name, inventory_id, price, stock, rating, delivery_days

    Returns a ranked list of suppliers with scores and explanation reasons.
    Uses AHP as the base, explainable score. If a trained ML model is available,
    blends in a fulfillment-probability prediction for a more data-driven ranking.
    Falls back to pure AHP if the ML model isn't available (cold start) —
    matching the Phase 1 -> Phase 2 evolution described in the project spec.
    """
    weights, consistency_ratio = calculate_ahp_weights()

    prices = [s["price"] for s in suppliers]
    delivery_days = [s["delivery_days"] for s in suppliers]
    ratings = [s["rating"] for s in suppliers]
    stocks = [s["stock"] for s in suppliers]

    price_scores = normalize_scores(prices, lower_is_better=True)
    delivery_scores = normalize_scores(delivery_days, lower_is_better=True)
    rating_scores = normalize_scores(ratings, lower_is_better=False)
    stock_scores = normalize_scores(stocks, lower_is_better=False)

    results = []

    for i, supplier in enumerate(suppliers):
        ahp_score = (
            weights[0] * price_scores[i]
            + weights[1] * delivery_scores[i]
            + weights[2] * rating_scores[i]
            + weights[3] * stock_scores[i]
        )

        ml_probability = predict_fulfillment_probability(
            price=supplier["price"],
            stock=supplier["stock"],
            delivery_days=supplier["delivery_days"],
            rating=supplier["rating"],
        )

        if ml_probability is not None:
            final_score = (AHP_BLEND_WEIGHT * ahp_score) + (ML_BLEND_WEIGHT * ml_probability)
        else:
            final_score = ahp_score  # cold start / no model: pure AHP

        reasons = []
        if prices[i] == min(prices):
            reasons.append("Lowest Price")
        if delivery_days[i] == min(delivery_days):
            reasons.append("Fastest Delivery")
        if ratings[i] == max(ratings):
            reasons.append("Highest Rating")
        if stocks[i] == max(stocks):
            reasons.append("Most Stock Available")
        if ml_probability is not None and ml_probability >= 0.75:
            reasons.append("High Predicted Fulfillment Reliability")
        if not reasons:
            reasons.append("Balanced option across criteria")

        results.append({
            "dealer_id": supplier["dealer_id"],
            "dealer_name": supplier["dealer_name"],
            "inventory_id": supplier["inventory_id"],
            "price": supplier["price"],
            "score": round(float(final_score), 4),
            "ahp_score": round(float(ahp_score), 4),
            "ml_probability": ml_probability,
            "reasons": reasons,
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results, consistency_ratio