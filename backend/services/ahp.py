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


def score_suppliers(suppliers: list[dict]):
    """
    suppliers: list of dicts, each with keys:
        dealer_id, dealer_name, inventory_id, price, stock, rating, delivery_days

    Returns a ranked list of suppliers with scores and explanation reasons.
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
        final_score = (
            weights[0] * price_scores[i]
            + weights[1] * delivery_scores[i]
            + weights[2] * rating_scores[i]
            + weights[3] * stock_scores[i]
        )

        reasons = []
        if prices[i] == min(prices):
            reasons.append("Lowest Price")
        if delivery_days[i] == min(delivery_days):
            reasons.append("Fastest Delivery")
        if ratings[i] == max(ratings):
            reasons.append("Highest Rating")
        if stocks[i] == max(stocks):
            reasons.append("Most Stock Available")
        if not reasons:
            reasons.append("Balanced option across criteria")

        results.append({
            "dealer_id": supplier["dealer_id"],
            "dealer_name": supplier["dealer_name"],
            "inventory_id": supplier["inventory_id"],
            "price": supplier["price"],
            "score": round(float(final_score), 4),
            "reasons": reasons,
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results, consistency_ratio