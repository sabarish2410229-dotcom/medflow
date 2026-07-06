import csv
import os
import pickle
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score

DATA_PATH = os.path.join(os.path.dirname(__file__), "synthetic_orders.csv")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "fulfillment_model.pkl")


def load_data():
    X, y = [], []
    with open(DATA_PATH, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            X.append([
                float(row["price"]),
                float(row["stock"]),
                float(row["delivery_days"]),
                float(row["rating"]),
            ])
            y.append(int(row["fulfilled_on_time"]))
    return np.array(X), np.array(y)


def train():
    X, y = load_data()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = LogisticRegression()
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    print(f"Accuracy:  {accuracy_score(y_test, preds):.3f}")
    print(f"Precision: {precision_score(y_test, preds):.3f}")
    print(f"Recall:    {recall_score(y_test, preds):.3f}")
    print(f"Feature weights (price, stock, delivery_days, rating): {model.coef_[0]}")

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    print(f"Model saved -> {MODEL_PATH}")


if __name__ == "__main__":
    train()