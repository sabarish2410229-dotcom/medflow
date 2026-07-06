import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "pharmacy",
    phone: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await registerUser(form);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
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
          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.subtitle}>Join MedFlow Supply & Exchange Network</p>
        </div>

        {error && (
          <div style={styles.error}>
            <span style={{ fontSize: "16px", marginRight: "6px" }}>⚠️</span>
            {error}
          </div>
        )}
        {success && (
          <div style={styles.success}>
            <span style={{ fontSize: "16px", marginRight: "6px" }}>✓</span>
            Registered! Redirecting to login...
          </div>
        )}

        <div>
          <label style={styles.label}>Account Role</label>
          <select name="role" value={form.role} onChange={handleChange} style={styles.input}>
            <option value="pharmacy">Pharmacy</option>
            <option value="dealer">Dealer</option>
          </select>
        </div>

        <div>
          <label style={styles.label}>Organization / Full Name</label>
          <input name="name" value={form.name} onChange={handleChange} required style={styles.input} placeholder="e.g. Care Pharmacy" />
        </div>

        <div>
          <label style={styles.label}>Email Address</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} required style={styles.input} placeholder="name@example.com" />
        </div>

        <div>
          <label style={styles.label}>Password</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} required style={styles.input} placeholder="••••••••" />
        </div>

        <div>
          <label style={styles.label}>Phone Number</label>
          <input name="phone" value={form.phone} onChange={handleChange} style={styles.input} placeholder="e.g. +91 98765 43210" />
        </div>

        <div>
          <label style={styles.label}>Address</label>
          <input name="address" value={form.address} onChange={handleChange} style={styles.input} placeholder="e.g. MG Road, Bengaluru" />
        </div>

        <button type="submit" style={styles.button}>
          Register
        </button>

        <p style={styles.footerText}>
          Already have an account? <Link to="/login" style={{ color: "#4f46e5", fontWeight: "600", textDecoration: "none" }}>Login here</Link>
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
    padding: "30px 20px",
  },
  form: {
    background: "#ffffff",
    padding: "36px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
    width: "100%",
    maxWidth: "420px",
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
  success: {
    background: "#f0fdf4",
    color: "#166534",
    padding: "10px 14px",
    borderRadius: "6px",
    marginBottom: "16px",
    fontSize: "13px",
    border: "1px solid #dcfce7",
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