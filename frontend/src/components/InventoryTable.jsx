export default function InventoryTable({ items, onDelete }) {
  if (!items || items.length === 0) {
    return <p style={{ color: "#666" }}>No inventory items yet.</p>;
  }

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Medicine</th>
          <th style={styles.th}>Category</th>
          <th style={styles.th}>Price (₹)</th>
          <th style={styles.th}>Stock</th>
          <th style={styles.th}>Expiry</th>
          {onDelete && <th style={styles.th}>Action</th>}
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td style={styles.td}>{item.medicine.name}</td>
            <td style={styles.td}>{item.medicine.category || "-"}</td>
            <td style={styles.td}>{item.price}</td>
            <td style={styles.td}>{item.stock}</td>
            <td style={styles.td}>{item.expiry_date || "-"}</td>
            {onDelete && (
              <td style={styles.td}>
                <button onClick={() => onDelete(item.id)} style={styles.deleteBtn}>
                  Delete
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const styles = {
  table: { width: "100%", borderCollapse: "collapse", marginTop: "12px" },
  th: {
    textAlign: "left",
    padding: "10px",
    borderBottom: "2px solid #e5e7eb",
    fontSize: "13px",
    color: "#374151",
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #f3f4f6",
    fontSize: "14px",
  },
  deleteBtn: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "none",
    padding: "4px 10px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  },
};