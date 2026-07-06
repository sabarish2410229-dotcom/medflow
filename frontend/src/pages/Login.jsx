import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginUser({ email, password });
      const { access_token, user } = response.data;

      login(user, access_token);

      if (user.role === "pharmacy") {
        navigate("/pharmacy");
      } else {
        navigate("/dealer");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form} className="animate-fade-in">
        <div style={styles.logoContainer}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={styles.logoSvg}>
            <rect width="24" height="24" rx="8" fill="url(#brandGradient)"/>
            <path d="M12 7V17M7 12H17" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            <defs>
              <linearGradient id="brandGradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1"/>
                <stop offset="1" stopColor="#4f46e5"/>
              </linearGradient>
            </defs>
          </svg>
          <h2 style={styles.title}>MedFlow</h2>
          <p style={styles.subtitle}>Smart Medicine Supply & Exchange</p>
        </div>

        {error && (
          <div style={styles.error}>
            <span style={{ fontSize: "16px", marginRight: "6px" }}>⚠️</span>
            {error}
          </div>
        )}

        <div>
          <label style={styles.label}>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
            placeholder="name@example.com"
          />
        </div>

        <div>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
            placeholder="••••••••"
          />
        </div>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? (
            <>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" style={{ animation: "spin 0.8s linear infinite" }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" style={{ opacity: 0.25 }} />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Verifying...</span>
            </>
          ) : (
            "Sign In"
          )}
        </button>

        <p style={styles.footerText}>
          Don't have an account? <Link to="/register" style={{ color: "#4f46e5", fontWeight: "600", textDecoration: "none" }}>Register here</Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "20px",
  },
  form: {
    background: "#ffffff",
    padding: "36px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
    width: "100%",
    maxWidth: "380px",
  },
  logoContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "24px",
    textAlign: "center",
  },
  logoSvg: {
    borderRadius: "8px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "750",
    color: "#0f172a",
    letterSpacing: "-0.03em",
    marginTop: "12px",
  },
  subtitle: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "2px",
  },
  label: {
    display: "block",
    marginTop: "14px",
    marginBottom: "4px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    color: "#0f172a",
    background: "#ffffff",
    transition: "all 0.15s ease",
  },
  button: {
    width: "100%",
    marginTop: "20px",
    padding: "10px 16px",
    background: "#4f46e5",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(79, 70, 229, 0.05)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.15s ease",
  },
  error: {
    background: "#fff1f2",
    color: "#b91c1c",
    padding: "10px 14px",
    borderRadius: "6px",
    marginBottom: "16px",
    fontSize: "13px",
    border: "1px solid #fecaca",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
  },
  footerText: {
    marginTop: "20px",
    fontSize: "13px",
    color: "#64748b",
    textAlign: "center",
  },
};