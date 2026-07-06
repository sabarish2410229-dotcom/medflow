export default function InventoryTable({ items, onDelete }) {
  if (!items || items.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyStateIcon}>📦</div>
        <h4 style={styles.emptyStateTitle}>No stock items added</h4>
        <p style={styles.emptyStateText}>Your inventory database is currently empty. Use the form above to add medicine stock.</p>
      </div>
    );
  }

  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Medicine Name</th>
            <th style={styles.th}>Category</th>
            <th style={styles.th}>Price</th>
            <th style={styles.th}>Stock Level</th>
            <th style={styles.th}>Expiry Date</th>
            {onDelete && <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isLowStock = item.stock <= 10;
            return (
              <tr key={item.id} style={styles.tr} className="table-row-hover">
                <td style={styles.td}>
                  <strong style={styles.medicineName}>{item.medicine.name}</strong>
                </td>
                <td style={styles.td}>
                  <span style={styles.categoryTag}>
                    {item.medicine.category || "General"}
                  </span>
                </td>
                <td style={{ ...styles.td, fontWeight: "600" }}>₹{item.price.toFixed(2)}</td>
                <td style={styles.td}>
                  <span style={styles.stockBadge(isLowStock)}>
                    {item.stock} unit{item.stock !== 1 ? "s" : ""}
                    {isLowStock && " (Low)"}
                  </span>
                </td>
                <td style={{ ...styles.td, color: "#475569" }}>
                  {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "-"}
                </td>
                {onDelete && (
                  <td style={{ ...styles.td, textAlign: "right" }}>
                    <button onClick={() => onDelete(item.id)} style={styles.deleteBtn}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: "4px" }}>
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  tableContainer: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 1px 2px 0 rgba(0,0,0,0.02)",
    background: "#fff",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  th: {
    padding: "10px 16px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "11px",
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  td: {
    padding: "12px 16px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "14px",
    color: "#0f172a",
    verticalAlign: "middle",
  },
  tr: {
    transition: "background 0.15s ease",
  },
  medicineName: {
    color: "#0f172a",
    fontWeight: "600",
  },
  categoryTag: {
    fontSize: "12px",
    padding: "2px 8px",
    borderRadius: "4px",
    background: "#f1f5f9",
    color: "#475569",
    fontWeight: "500",
    border: "1px solid #e2e8f0",
  },
  deleteBtn: {
    background: "#ffffff",
    color: "#ef4444",
    border: "1px solid #fecaca",
    padding: "5px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    boxShadow: "0 1px 2px rgba(239, 68, 68, 0.02)",
    transition: "all 0.15s ease",
  },
  stockBadge: (isLow) => ({
    fontSize: "12px",
    fontWeight: "600",
    padding: "2px 8px",
    borderRadius: "4px",
    background: isLow ? "#fff1f2" : "#f0fdf4",
    color: isLow ? "#e11d48" : "#16a34a",
    border: isLow ? "1px solid #ffe4e6" : "1px solid #dcfce7",
    display: "inline-block",
  }),
  emptyState: {
    textAlign: "center",
    padding: "48px 24px",
    border: "1px dashed #cbd5e1",
    borderRadius: "8px",
    background: "#ffffff",
  },
  emptyStateIcon: {
    fontSize: "32px",
    marginBottom: "8px",
    color: "#64748b",
  },
  emptyStateTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "4px",
  },
  emptyStateText: {
    fontSize: "13px",
    color: "#64748b",
    maxWidth: "340px",
    margin: "0 auto",
  },
};