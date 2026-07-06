import random
import csv
import os

random.seed(42)

NUM_DEALERS = 15
RECORDS_PER_DEALER = 50

def generate_dealer_profile(dealer_id):
    """Each dealer has an underlying 'quality tier' that influences their historical performance."""
    tier = random.choice(["excellent", "average", "poor"])
    if tier == "excellent":
        base_delivery = random.uniform(1, 2)
        base_rating = random.uniform(4.3, 5.0)
        fulfillment_rate = random.uniform(0.90, 0.99)
    elif tier == "average":
        base_delivery = random.uniform(2, 4)
        base_rating = random.uniform(3.5, 4.3)
        fulfillment_rate = random.uniform(0.75, 0.90)
    else:
        base_delivery = random.uniform(4, 7)
        base_rating = random.uniform(2.5, 3.5)
        fulfillment_rate = random.uniform(0.50, 0.75)
    return base_delivery, base_rating, fulfillment_rate


def generate_dataset():
    rows = []
    for dealer_id in range(1, NUM_DEALERS + 1):
        base_delivery, base_rating, fulfillment_rate = generate_dealer_profile(dealer_id)

        for _ in range(RECORDS_PER_DEALER):
            price = round(random.uniform(15, 60), 2)
            stock = random.randint(10, 1000)
            delivery_days = max(1, round(random.gauss(base_delivery, 0.7)))
            rating = round(min(5.0, max(1.0, random.gauss(base_rating, 0.3))), 1)

            # Outcome: fulfilled on time (1) or not (0) — driven by dealer's true fulfillment rate,
            # plus some noise from stock availability (low stock increases failure chance)
            stock_penalty = 0.15 if stock < 50 else 0
            success_prob = max(0.05, fulfillment_rate - stock_penalty)
            fulfilled = 1 if random.random() < success_prob else 0

            rows.append({
                "dealer_id": dealer_id,
                "price": price,
                "stock": stock,
                "delivery_days": delivery_days,
                "rating": rating,
                "fulfilled_on_time": fulfilled,
            })
    return rows


if __name__ == "__main__":
    rows = generate_dataset()
    output_path = os.path.join(os.path.dirname(__file__), "synthetic_orders.csv")
    with open(output_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    print(f"Generated {len(rows)} synthetic order records -> {output_path}")