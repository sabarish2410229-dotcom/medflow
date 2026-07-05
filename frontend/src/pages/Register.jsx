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
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={{ textAlign: "center" }}>Create Account</h2>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>Registered! Redirecting to login...</div>}

        <label style={styles.label}>Role</label>
        <select name="role" value={form.role} onChange={handleChange} style={styles.input}>
          <option value="pharmacy">Pharmacy</option>
          <option value="dealer">Dealer</option>
        </select>

        <label style={styles.label}>Name</label>
        <input name="name" value={form.name} onChange={handleChange} required style={styles.input} />

        <label style={styles.label}>Email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} required style={styles.input} />

        <label style={styles.label}>Password</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} required style={styles.input} />

        <label style={styles.label}>Phone</label>
        <input name="phone" value={form.phone} onChange={handleChange} style={styles.input} />

        <label style={styles.label}>Address</label>
        <input name="address" value={form.address} onChange={handleChange} style={styles.input} />

        <button type="submit" style={styles.button}>Register</button>

        <p style={{ textAlign: "center", marginTop: "14px", fontSize: "13px" }}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f4f6f8" },
  form: { background: "#fff", padding: "40px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", width: "340px" },
  label: { display: "block", marginTop: "12px", marginBottom: "4px", fontSize: "14px", fontWeight: "600" },
  input: { width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "14px" },
  button: { width: "100%", marginTop: "20px", padding: "10px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" },
  error: { background: "#fee2e2", color: "#b91c1c", padding: "8px", borderRadius: "4px", marginBottom: "10px", fontSize: "13px" },
  success: { background: "#dcfce7", color: "#166534", padding: "8px", borderRadius: "4px", marginBottom: "10px", fontSize: "13px" },
};