const STATUS_STEPS = ["created", "accepted", "packed", "dispatched", "out_for_delivery", "delivered"];

const STATUS_LABELS = {
  created: "Created",
  accepted: "Accepted",
  packed: "Packed",
  dispatched: "Dispatched",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

export default function OrderTimeline({ events }) {
  const completedStatuses = events.map((e) => e.status);

  return (
    <div style={styles.container}>
      {STATUS_STEPS.map((step, i) => {
        const isDone = completedStatuses.includes(step);
        const event = events.find((e) => e.status === step);

        return (
          <div key={step} style={styles.stepWrapper}>
            <div style={styles.stepRow}>
              <div style={{ ...styles.dot, background: isDone ? "#22c55e" : "#e5e7eb" }} />
              <div>
                <p style={{ ...styles.stepLabel, color: isDone ? "#111" : "#9ca3af" }}>
                  {STATUS_LABELS[step]}
                </p>
                {event && (
                  <p style={styles.timestamp}>
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div style={{ ...styles.line, background: isDone ? "#22c55e" : "#e5e7eb" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  container: { display: "flex", flexDirection: "column", paddingLeft: "4px" },
  stepWrapper: { display: "flex", flexDirection: "column" },
  stepRow: { display: "flex", alignItems: "flex-start", gap: "12px" },
  dot: { width: "14px", height: "14px", borderRadius: "50%", marginTop: "4px", flexShrink: 0 },
  line: { width: "2px", height: "24px", marginLeft: "6px" },
  stepLabel: { margin: 0, fontSize: "14px", fontWeight: "600" },
  timestamp: { margin: 0, fontSize: "12px", color: "#888" },
};