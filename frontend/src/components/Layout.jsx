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
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={styles.logoSvg}>
              <rect width="24" height="24" rx="6" fill="url(#navBrandGradient)"/>
              <path d="M12 7V17M7 12H17" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <defs>
                <linearGradient id="navBrandGradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1"/>
                  <stop offset="1" stopColor="#4f46e5"/>
                </linearGradient>
              </defs>
            </svg>
            <span>Med<span style={{ color: "#4f46e5" }}>Flow</span></span>
          </div>

          <div style={styles.navLinks}>
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  ...styles.navLink,
                  color: location.pathname === item.path ? "#0f172a" : "#475569",
                  fontWeight: "600",
                  backgroundColor: location.pathname === item.path ? "#f1f5f9" : "transparent",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div style={styles.navRight}>
            <button onClick={() => navigate("/settings")} style={styles.iconBtn} title="Settings">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}>
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span>Settings</span>
            </button>
            <div style={styles.userBadge}>
              <div style={styles.avatar}>{user?.name?.[0]?.toUpperCase() || "?"}</div>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>{user?.name}</span>
            </div>
            <button onClick={logout} style={styles.logoutBtn}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              <span>Logout</span>
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
    background: "#ffffff",
    borderBottom: "1px solid #f1f5f9",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.02)",
  },
  navInner: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "12px 24px",
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },
  logo: {
    fontSize: "18px",
    fontWeight: "750",
    color: "#090d1f",
    cursor: "pointer",
    letterSpacing: "-0.03em",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  logoSvg: {
    borderRadius: "6px",
  },
  navLinks: { display: "flex", gap: "4px", flex: 1 },
  navLink: {
    background: "none",
    border: "none",
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: "14px",
    borderRadius: "6px",
    transition: "all 0.15s ease",
  },
  navRight: { display: "flex", alignItems: "center", gap: "12px" },
  iconBtn: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#334155",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    transition: "all 0.15s ease",
  },
  userBadge: { display: "flex", alignItems: "center", gap: "8px" },
  avatar: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "#4f46e5",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "700",
  },
  logoutBtn: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#475569",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    transition: "all 0.15s ease",
  },
  main: { maxWidth: "1200px", margin: "0 auto", padding: "28px 24px" },
};