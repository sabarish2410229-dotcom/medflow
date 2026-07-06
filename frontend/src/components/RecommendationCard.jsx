import { useState } from "react";

function scoreToStars(score) {
  const stars = Math.round(score * 5);
  return Math.max(1, Math.min(5, stars));
}

function StarRating({ count }) {
  return (
    <span style={{ fontSize: "16px", letterSpacing: "2px", color: "#f59e0b" }} title={`${count}/5 Stars`}>
      {"★".repeat(count)}
      <span style={{ color: "#e2e8f0" }}>{"★".repeat(5 - count)}</span>
    </span>
  );
}

export default function RecommendationCard({ result, rank, onOrder }) {
  const stars = scoreToStars(result.score);
  const [quantity, setQuantity] = useState(1);
  const isBest = rank === 1;

  return (
    <div style={{ ...styles.card, ...(isBest ? styles.bestCard : {}) }}>
      {isBest && (
        <div style={styles.bestBadge}>
          🏆 BEST CHOICE
        </div>
      )}

      <div style={styles.header}>
        <span style={{ ...styles.rank, color: isBest ? "#d97706" : "#94a3b8" }}>#{rank}</span>
        <div style={{ flex: 1 }}>
          <h4 style={styles.dealerName}>{result.dealer_name}</h4>
          <div style={styles.priceContainer}>
            <span style={styles.price}>₹{result.price}</span>
            <span style={styles.priceUnit}> / unit</span>
          </div>
          <div style={styles.metaContainer}>
            {result.dealer_phone && <span style={styles.metaItem}>📞 {result.dealer_phone}</span>}
            {result.dealer_address && <span style={styles.metaItem}>📍 {result.dealer_address}</span>}
          </div>
        </div>
        <div style={styles.scoreBox}>
          <StarRating count={stars} />
          <div style={styles.confidenceText}>Confidence: {(result.score * 100).toFixed(0)}%</div>
        </div>
      </div>

      <div style={styles.reasons}>
        {result.reasons.map((reason, i) => (
          <span key={i} style={styles.tag}>
            <span style={{ marginRight: "4px", fontSize: "10px" }}>✓</span>
            {reason}
          </span>
        ))}
      </div>

      {onOrder && (
        <div style={styles.actionRow}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={styles.qtyLabel}>Quantity:</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              style={styles.qtyInput}
            />
          </div>
          <button onClick={() => onOrder(result, quantity)} style={styles.orderBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: "6px" }}>
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            Order from {result.dealer_name}
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "20px",
    background: "#fff",
    boxShadow: "0 1px 2px 0 rgba(0,0,0,0.02)",
    position: "relative",
    transition: "all 0.15s ease",
  },
  bestCard: {
    borderColor: "#f59e0b",
    borderWidth: "1px",
    background: "#fffdf9",
  },
  bestBadge: {
    position: "absolute",
    top: "16px",
    right: "20px",
    background: "#fffbeb",
    color: "#b45309",
    border: "1px solid #fde68a",
    fontSize: "10px",
    fontWeight: "700",
    padding: "2px 8px",
    borderRadius: "4px",
    letterSpacing: "0.05em",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
  },
  rank: {
    fontSize: "18px",
    fontWeight: "800",
    width: "24px",
    lineHeight: "1.2",
  },
  dealerName: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
  },
  priceContainer: {
    margin: "4px 0",
    display: "inline-flex",
    alignItems: "baseline",
  },
  price: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
  },
  priceUnit: {
    fontSize: "12px",
    color: "#64748b",
  },
  metaContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "4px",
  },
  metaItem: {
    color: "#64748b",
    fontSize: "12px",
    display: "inline-flex",
    alignItems: "center",
  },
  scoreBox: {
    marginLeft: "auto",
    marginRight: "100px", /* push away from badge */
    textAlign: "right",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  confidenceText: {
    fontSize: "11px",
    color: "#64748b",
    marginTop: "4px",
    fontWeight: "500",
  },
  reasons: {
    marginTop: "14px",
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  tag: {
    background: "#f0fdf4",
    color: "#166534",
    border: "1px solid #dcfce7",
    fontSize: "12px",
    padding: "3px 8px",
    borderRadius: "4px",
    fontWeight: "500",
    display: "inline-flex",
    alignItems: "center",
  },
  actionRow: {
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },
  qtyLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
  },
  qtyInput: {
    width: "60px",
    padding: "7px 8px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "13px",
    textAlign: "center",
    outline: "none",
    transition: "border-color 0.15s ease",
  },
  orderBtn: {
    padding: "8px 16px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    boxShadow: "0 1px 2px rgba(79, 70, 229, 0.05)",
    display: "inline-flex",
    alignItems: "center",
    transition: "all 0.15s ease",
  },
};