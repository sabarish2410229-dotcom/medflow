const STATUS_STEPS = ["created", "accepted", "packed", "dispatched", "out_for_delivery", "delivered"];

const STATUS_LABELS = {
  created: "Order Placed",
  accepted: "Order Confirmed",
  packed: "Packed & Ready",
  dispatched: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered Successfully",
};

export default function OrderTimeline({ events }) {
  const completedStatuses = events.map((e) => e.status);
  
  // Find the index of the most recently completed status step
  const completedIndices = STATUS_STEPS.map((step) => completedStatuses.includes(step));
  const latestCompletedIndex = completedIndices.lastIndexOf(true);

  return (
    <div style={styles.container}>
      {STATUS_STEPS.map((step, i) => {
        const isDone = completedStatuses.includes(step);
        const isCurrentActive = i === latestCompletedIndex;
        const event = events.find((e) => e.status === step);

        return (
          <div key={step} style={styles.stepWrapper}>
            <div style={styles.stepRow}>
              <div style={styles.dotContainer}>
                <div
                  className={isCurrentActive ? "pulse-dot-green" : ""}
                  style={{
                    ...styles.dot,
                    background: isDone ? "#10b981" : "#fff",
                    borderColor: isDone ? "#10b981" : "#cbd5e1",
                    boxShadow: isCurrentActive ? "0 0 0 4px rgba(16, 185, 129, 0.2)" : "none",
                  }}
                >
                  {isDone && !isCurrentActive && (
                    <span style={styles.checkIcon}>✓</span>
                  )}
                  {isCurrentActive && (
                    <span style={styles.activeDotInner} />
                  )}
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div
                    style={{
                      ...styles.line,
                      background: completedStatuses.includes(STATUS_STEPS[i + 1]) ? "#10b981" : "#e2e8f0",
                    }}
                  />
                )}
              </div>
              <div style={styles.textContainer}>
                <p style={{
                  ...styles.stepLabel,
                  color: isDone ? "#0f172a" : "#94a3b8",
                  fontWeight: isCurrentActive || isDone ? "700" : "500",
                }}>
                  {STATUS_LABELS[step]}
                </p>
                {event && (
                  <p style={styles.timestamp}>
                    {new Date(event.timestamp).toLocaleString("en-IN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    paddingLeft: "8px",
    paddingTop: "4px",
  },
  stepWrapper: {
    display: "flex",
    flexDirection: "column",
  },
  stepRow: {
    display: "flex",
    alignItems: "stretch",
    gap: "16px",
  },
  dotContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
  },
  dot: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    transition: "all 0.3s ease",
  },
  checkIcon: {
    color: "#fff",
    fontSize: "9px",
    fontWeight: "bold",
    lineHeight: 1,
  },
  activeDotInner: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#fff",
  },
  line: {
    width: "2px",
    flexGrow: 1,
    minHeight: "36px",
    marginTop: "4px",
    marginBottom: "4px",
    zIndex: 1,
    transition: "background 0.3s ease",
  },
  textContainer: {
    paddingBottom: "24px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  stepLabel: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "18px",
  },
  timestamp: {
    margin: "2px 0 0 0",
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "500",
  },
};