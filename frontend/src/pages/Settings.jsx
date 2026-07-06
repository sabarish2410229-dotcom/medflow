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
      <h2 style={{ marginBottom: "24px" }}>Settings</h2>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Profile Information</h3>
        <p style={styles.roleTag}>{user?.role === "pharmacy" ? "Pharmacy Account" : "Dealer Account"}</p>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <form onSubmit={handleSaveProfile}>
            {saveMsg && <div style={styles.success}>{saveMsg}</div>}
            {saveErr && <div style={styles.error}>{saveErr}</div>}

            <label style={styles.label}>Name</label>
            <input name="name" value={profile.name} onChange={handleProfileChange} style={styles.input} />

            <label style={styles.label}>Email</label>
            <input value={user?.email || ""} disabled style={{ ...styles.input, background: "#f8fafc", color: "#94a3b8" }} />

            <label style={styles.label}>Phone</label>
            <input name="phone" value={profile.phone} onChange={handleProfileChange} style={styles.input} />

            <label style={styles.label}>Address</label>
            <input name="address" value={profile.address} onChange={handleProfileChange} style={styles.input} />

            <button type="submit" style={styles.saveBtn}>Save Changes</button>
          </form>
        )}
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Change Password</h3>
        <form onSubmit={handleChangePassword}>
          {pwMsg && <div style={styles.success}>{pwMsg}</div>}
          {pwErr && <div style={styles.error}>{pwErr}</div>}

          <label style={styles.label}>Current Password</label>
          <input
            type="password"
            name="current_password"
            value={pwForm.current_password}
            onChange={handlePwChange}
            required
            style={styles.input}
          />

          <label style={styles.label}>New Password</label>
          <input
            type="password"
            name="new_password"
            value={pwForm.new_password}
            onChange={handlePwChange}
            required
            style={styles.input}
          />

          <button type="submit" style={styles.saveBtn}>Update Password</button>
        </form>
      </div>
    </Layout>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: "12px",
    padding: "28px",
    marginBottom: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    maxWidth: "480px",
  },
  cardTitle: { marginBottom: "4px", fontSize: "17px" },
  roleTag: { color: "#94a3b8", fontSize: "13px", marginBottom: "20px" },
  label: { display: "block", marginTop: "14px", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#334155" },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
  },
  saveBtn: {
    marginTop: "20px",
    padding: "10px 20px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },
  success: { background: "#dcfce7", color: "#166534", padding: "10px", borderRadius: "6px", marginBottom: "12px", fontSize: "13px" },
  error: { background: "#fee2e2", color: "#b91c1c", padding: "10px", borderRadius: "6px", marginBottom: "12px", fontSize: "13px" },
};