import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getMyProfile, updateMyProfile, changePassword } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState({ name: "", phone: "", address: "" });
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveErr, setSaveErr] = useState("");

  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");

  useEffect(() => {
    getMyProfile()
      .then((res) => {
        setProfile({
          name: res.data.name || "",
          phone: res.data.phone || "",
          address: res.data.address || "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveMsg("");
    setSaveErr("");
    try {
      const res = await updateMyProfile(profile);
      const token = localStorage.getItem("token");
      login(res.data, token); // refresh stored user info (e.g. name shown in navbar)
      setSaveMsg("Profile updated successfully!");
    } catch (err) {
      setSaveErr(err.response?.data?.detail || "Failed to update profile");
    }
  };

  const handlePwChange = (e) => setPwForm({ ...pwForm, [e.target.name]: e.target.value });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg("");
    setPwErr("");
    try {
      await changePassword(pwForm);
      setPwMsg("Password changed successfully!");
      setPwForm({ current_password: "", new_password: "" });
    } catch (err) {
      setPwErr(err.response?.data?.detail || "Failed to change password");
    }
  };

  return (
    <Layout>
      <div style={styles.header} className="animate-fade-in">
        <h2 style={styles.title}>Settings</h2>
        <p style={styles.subtitle}>Manage your account profiles, contact details, and password credentials.</p>
      </div>

      <div style={styles.settingsGrid} className="animate-fade-in">
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Profile Information</h3>
          <span style={styles.roleTag}>
            {user?.role === "pharmacy" ? "🏥 Pharmacy Account" : "🚚 Dealer Account"}
          </span>

          {loading ? (
            <div style={styles.loadingContainer}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" style={{ animation: "spin 0.8s linear infinite" }}>
                <circle cx="12" cy="12" r="10" stroke="#4f46e5" strokeWidth="3" style={{ opacity: 0.25 }} />
                <path fill="#4f46e5" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span style={{ marginLeft: "10px", color: "#64748b" }}>Loading profile...</span>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} style={styles.form}>
              {saveMsg && <div style={styles.success}>✓ {saveMsg}</div>}
              {saveErr && <div style={styles.error}>⚠️ {saveErr}</div>}

              <div>
                <label style={styles.label}>Name / Organization Name</label>
                <input name="name" value={profile.name} onChange={handleProfileChange} style={styles.input} required />
              </div>

              <div>
                <label style={styles.label}>Email Address (Read-only)</label>
                <input value={user?.email || ""} disabled style={{ ...styles.input, background: "#f8fafc", color: "#94a3b8", borderStyle: "dashed" }} />
              </div>

              <div>
                <label style={styles.label}>Phone Number</label>
                <input name="phone" value={profile.phone} onChange={handleProfileChange} style={styles.input} placeholder="e.g. +91 98765 43210" />
              </div>

              <div>
                <label style={styles.label}>Office / Facility Address</label>
                <input name="address" value={profile.address} onChange={handleProfileChange} style={styles.input} placeholder="e.g. MG Road, Bengaluru" />
              </div>

              <button type="submit" style={styles.saveBtn}>Save Profile Changes</button>
            </form>
          )}
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Change Password</h3>
          <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "20px" }}>Change your login credentials to protect your database access.</p>
          
          <form onSubmit={handleChangePassword} style={styles.form}>
            {pwMsg && <div style={styles.success}>✓ {pwMsg}</div>}
            {pwErr && <div style={styles.error}>⚠️ {pwErr}</div>}

            <div>
              <label style={styles.label}>Current Password</label>
              <input
                type="password"
                name="current_password"
                value={pwForm.current_password}
                onChange={handlePwChange}
                required
                style={styles.input}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label style={styles.label}>New Password</label>
              <input
                type="password"
                name="new_password"
                value={pwForm.new_password}
                onChange={handlePwChange}
                required
                style={styles.input}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" style={styles.saveBtn}>Update Password</button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

const styles = {
  header: {
    marginBottom: "24px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: "-0.03em",
  },
  subtitle: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "4px",
  },
  settingsGrid: {
    display: "flex",
    gap: "24px",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  card: {
    background: "#fff",
    borderRadius: "8px",
    padding: "28px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
    flex: "1 1 400px",
    maxWidth: "520px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "750",
    color: "#0f172a",
    marginBottom: "8px",
  },
  roleTag: {
    display: "inline-block",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    padding: "3px 8px",
    borderRadius: "4px",
    background: "#f1f5f9",
    color: "#4f46e5",
    border: "1px solid #e2e8f0",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "14px",
    color: "#0f172a",
    background: "#fff",
    outline: "none",
    transition: "all 0.15s ease",
  },
  saveBtn: {
    marginTop: "8px",
    padding: "9px 16px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    boxShadow: "0 1px 2px rgba(79, 70, 229, 0.05)",
    width: "fit-content",
    alignSelf: "flex-start",
    transition: "all 0.15s ease",
  },
  success: {
    background: "#f0fdf4",
    color: "#166534",
    padding: "10px 14px",
    borderRadius: "6px",
    fontSize: "13px",
    border: "1px solid #dcfce7",
    fontWeight: "500",
  },
  error: {
    background: "#fff1f2",
    color: "#b91c1c",
    padding: "10px 14px",
    borderRadius: "6px",
    fontSize: "13px",
    border: "1px solid #fecaca",
    fontWeight: "500",
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "30px 0",
  },
};