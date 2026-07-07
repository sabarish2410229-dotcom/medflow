const STEP_CONFIG = [
  { key: "requested_at", label: "Request Sent" },
  { key: "viewed_at", label: "Viewed" },
  { key: "accepted_at", label: "Accepted" },
  { key: "rejected_at", label: "Rejected" },
  { key: "cancelled_at", label: "Cancelled" },
  { key: "completed_at", label: "Completed" },
];

export default function RequestTimeline({ request }) {
  // Only show steps that actually happened, in chronological order —
  // a request follows one branch (accepted OR rejected OR cancelled), not all steps.
  const steps = STEP_CONFIG
    .filter((s) => request[s.key])
    .map((s) => ({ label: s.label, timestamp: request[s.key] }))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const latestIndex = steps.length - 1;

  return (
    <div style={styles.container}>
      {steps.map((step, i) => {
        const isCurrentActive = i === latestIndex;

        return (
          <div key={step.label} style={styles.stepWrapper}>
            <div style={styles.stepRow}>
              <div style={styles.dotContainer}>
                <div
                  style={{
                    ...styles.dot,
                    background: "#10b981",
                    borderColor: "#10b981",
                    boxShadow: isCurrentActive ? "0 0 0 4px rgba(16, 185, 129, 0.2)" : "none",
                  }}
                >
                  {!isCurrentActive && <span style={styles.checkIcon}>✓</span>}
                  {isCurrentActive && <span style={styles.activeDotInner} />}
                </div>
                {i < steps.length - 1 && <div style={{ ...styles.line, background: "#10b981" }} />}
              </div>
              <div style={styles.textContainer}>
                <p style={{ ...styles.stepLabel, color: "#0f172a", fontWeight: "700" }}>
                  {step.label}
                </p>
                <p style={styles.timestamp}>
                  {new Date(step.timestamp).toLocaleString("en-IN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  container: { display: "flex", flexDirection: "column", paddingLeft: "8px", paddingTop: "4px" },
  stepWrapper: { display: "flex", flexDirection: "column" },
  stepRow: { display: "flex", alignItems: "stretch", gap: "16px" },
  dotContainer: { display: "flex", flexDirection: "column", alignItems: "center", position: "relative" },
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
  checkIcon: { color: "#fff", fontSize: "9px", fontWeight: "bold", lineHeight: 1 },
  activeDotInner: { width: "6px", height: "6px", borderRadius: "50%", background: "#fff" },
  line: { width: "2px", flexGrow: 1, minHeight: "36px", marginTop: "4px", marginBottom: "4px", zIndex: 1, transition: "background 0.3s ease" },
  textContainer: { paddingBottom: "24px", display: "flex", flexDirection: "column", justifyContent: "flex-start" },
  stepLabel: { margin: 0, fontSize: "14px", lineHeight: "18px" },
  timestamp: { margin: "2px 0 0 0", fontSize: "12px", color: "#64748b", fontWeight: "500" },
};