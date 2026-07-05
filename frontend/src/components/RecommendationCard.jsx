import { useState } from "react";

function scoreToStars(score) {
  const stars = Math.round(score * 5);
  return Math.max(1, Math.min(5, stars));
}

function StarRating({ count }) {
  return (
    <span style={{ fontSize: "18px", letterSpacing: "2px" }}>
      {"★".repeat(count)}
      <span style={{ color: "#e5e7eb" }}>{"★".repeat(5 - count)}</span>
    </span>
  );
}

export default function RecommendationCard({ result, rank, onOrder }) {
  const stars = scoreToStars(result.score);
  const [quantity, setQuantity] = useState(1);

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.rank}>#{rank}</span>
        <div>
          <h4 style={styles.dealerName}>{result.dealer_name}</h4>
          <p style={styles.price}>₹{result.price} per unit</p>
          {result.dealer_phone && <p style={styles.meta}>📞 {result.dealer_phone}</p>}
          {result.dealer_address && <p style={styles.meta}>📍 {result.dealer_address}</p>}
        </div>
        <div style={styles.scoreBox}>
          <StarRating count={stars} />
        </div>
      </div>

      <div style={styles.reasons}>
        {result.reasons.map((reason, i) => (
          <span key={i} style={styles.tag}>✓ {reason}</span>
        ))}
      </div>

      {onOrder && (
        <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ fontSize: "13px" }}>Qty:</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            style={styles.qtyInput}
          />
          <button onClick={() => onOrder(result, quantity)} style={styles.orderBtn}>
            Order from {result.dealer_name}
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: { border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px", marginBottom: "12px", background: "#fff" },
  header: { display: "flex", alignItems: "flex-start", gap: "14px" },
  rank: { fontSize: "20px", fontWeight: "bold", color: "#9ca3af", width: "30px" },
  dealerName: { margin: 0, fontSize: "16px" },
  price: { margin: "2px 0", color: "#555", fontSize: "14px" },
  meta: { margin: "2px 0", color: "#777", fontSize: "12px" },
  scoreBox: { marginLeft: "auto", color: "#f59e0b" },
  reasons: { marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" },
  tag: { background: "#ecfdf5", color: "#047857", fontSize: "12px", padding: "4px 10px", borderRadius: "12px" },
  qtyInput: { width: "60px", padding: "6px", border: "1px solid #ccc", borderRadius: "4px" },
  orderBtn: { padding: "8px 14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px" },
};