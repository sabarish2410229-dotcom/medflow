import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isPharmacy = user?.role === "pharmacy";
  const homePath = isPharmacy ? "/pharmacy" : "/dealer";

  const navItems = isPharmacy
    ? [
        { label: "Dashboard", path: "/pharmacy" },
        { label: "Exchange", path: "/exchange" },
      ]
    : [{ label: "Dashboard", path: "/dealer" }];

  return (
    <div style={styles.page}>
      <nav style={styles.navbar}>
        <div style={styles.navInner}>
          <div style={styles.logo} onClick={() => navigate(homePath)}>
            Med<span style={{ color: "#4f46e5" }}>Flow</span>
          </div>

          <div style={styles.navLinks}>
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  ...styles.navLink,
                  color: location.pathname === item.path ? "#4f46e5" : "#64748b",
                  fontWeight: location.pathname === item.path ? "600" : "500",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div style={styles.navRight}>
            <button onClick={() => navigate("/settings")} style={styles.iconBtn} title="Settings">
              ⚙️ Settings
            </button>
            <div style={styles.userBadge}>
              <div style={styles.avatar}>{user?.name?.[0]?.toUpperCase() || "?"}</div>
              <span style={{ fontSize: "14px", color: "#334155" }}>{user?.name}</span>
            </div>
            <button onClick={logout} style={styles.logoutBtn}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc" },
  navbar: {
    background: "#fff",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  navInner: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "14px 24px",
    display: "flex",
    alignItems: "center",
    gap: "32px",
  },
  logo: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#0f172a",
    cursor: "pointer",
    letterSpacing: "-0.02em",
  },
  navLinks: { display: "flex", gap: "8px", flex: 1 },
  navLink: {
    background: "none",
    border: "none",
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: "14px",
    borderRadius: "6px",
  },
  navRight: { display: "flex", alignItems: "center", gap: "14px" },
  iconBtn: {
    background: "none",
    border: "1px solid #e2e8f0",
    padding: "7px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#475569",
  },
  userBadge: { display: "flex", alignItems: "center", gap: "8px" },
  avatar: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "#4f46e5",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "700",
  },
  logoutBtn: {
    background: "#f1f5f9",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#475569",
    fontWeight: "600",
  },
  main: { maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" },
};