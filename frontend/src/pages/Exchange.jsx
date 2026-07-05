import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getExchangeListings, getMyExchangeListings, purchaseExchangeStock } from "../api";
import { useNavigate } from "react-router-dom";

export default function Exchange() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("browse");

  return (
    <div style={{ padding: "30px", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>Near-Expiry Exchange</h2>
          <button onClick={() => navigate("/pharmacy")} style={styles.backLink}>
            ← Back to Dashboard
          </button>
        </div>
        <div>
          <span style={{ marginRight: "12px" }}>Hi, {user?.name}</span>
          <button onClick={logout} style={{ padding: "6px 14px", cursor: "pointer" }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <TabButton active={activeTab === "browse"} onClick={() => setActiveTab("browse")}>
          Browse Listings
        </TabButton>
        <TabButton active={activeTab === "mine"} onClick={() => setActiveTab("mine")}>
          My Near-Expiry Stock
        </TabButton>
      </div>

      <div style={{ marginTop: "20px" }}>
        {activeTab === "browse" && <BrowseTab />}
        {activeTab === "mine" && <MyListingsTab />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        background: active ? "#2563eb" : "#e5e7eb",
        color: active ? "#fff" : "#374151",
        fontWeight: active ? "600" : "400",
      }}
    >
      {children}
    </button>
  );
}

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function BrowseTab() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [quantities, setQuantities] = useState({});

  const loadListings = async () => {
    try {
      const res = await getExchangeListings();
      setListings(res.data);
    } catch (err) {
      setError("Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const handleQtyChange = (id, value) => {
    setQuantities({ ...quantities, [id]: value });
  };

  const handlePurchase = async (listing) => {
    setError("");
    setSuccessMsg("");
    const qty = parseInt(quantities[listing.id]) || 1;

    if (qty > listing.stock) {
      setError(`Only ${listing.stock} units available`);
      return;
    }

    try {
      await purchaseExchangeStock(listing.id, qty);
      setSuccessMsg(`Purchased ${qty} units of ${listing.medicine.name}!`);
      loadListings();
    } catch (err) {
      setError(err.response?.data?.detail || "Purchase failed");
    }
  };

  if (loading) return <div style={styles.section}><p>Loading listings...</p></div>;

  return (
    <div style={styles.section}>
      <h3>Near-Expiry Medicine from Other Pharmacies</h3>
      {error && <div style={styles.error}>{error}</div>}
      {successMsg && <div style={styles.success}>{successMsg}</div>}

      {listings.length === 0 && (
        <p style={{ color: "#666", marginTop: "12px" }}>
          No near-expiry listings available right now.
        </p>
      )}

      {listings.map((listing) => {
        const days = daysUntil(listing.expiry_date);
        return (
          <div key={listing.id} style={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h4 style={{ margin: 0 }}>{listing.medicine.name}</h4>
                <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                  {listing.medicine.category || "-"} · ₹{listing.price}/unit · {listing.stock} units available
                </p>
                <p style={{ margin: "4px 0", color: "#333", fontSize: "13px", fontWeight: "600" }}>
                  Seller: {listing.owner_name}
                </p>
                {listing.owner_phone && (
                  <p style={{ margin: "2px 0", color: "#777", fontSize: "12px" }}>📞 {listing.owner_phone}</p>
                )}
                {listing.owner_address && (
                  <p style={{ margin: "2px 0", color: "#777", fontSize: "12px" }}>📍 {listing.owner_address}</p>
                )}
              </div>
              <span style={styles.expiryBadge(days)}>
                Expires in {days} day{days !== 1 ? "s" : ""}
              </span>
            </div>

            <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
              <label style={{ fontSize: "13px" }}>Qty:</label>
              <input
                type="number"
                min="1"
                max={listing.stock}
                value={quantities[listing.id] || 1}
                onChange={(e) => handleQtyChange(listing.id, e.target.value)}
                style={styles.qtyInput}
              />
              <button onClick={() => handlePurchase(listing)} style={styles.buyBtn}>
                Buy Now
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MyListingsTab() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyExchangeListings()
      .then((res) => setListings(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.section}><p>Loading...</p></div>;

  return (
    <div style={styles.section}>
      <h3>Your Stock Nearing Expiry</h3>
      <p style={{ color: "#666", fontSize: "13px" }}>
        Any inventory within 90 days of expiry is automatically visible to other pharmacies on the exchange.
      </p>

      {listings.length === 0 && (
        <p style={{ color: "#666", marginTop: "12px" }}>
          None of your inventory is currently near expiry.
        </p>
      )}

      {listings.map((listing) => {
        const days = daysUntil(listing.expiry_date);
        return (
          <div key={listing.id} style={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4 style={{ margin: 0 }}>{listing.medicine.name}</h4>
                <p style={{ margin: "4px 0", color: "#666", fontSize: "14px" }}>
                  ₹{listing.price}/unit · {listing.stock} units remaining
                </p>
              </div>
              <span style={styles.expiryBadge(days)}>
                Expires in {days} day{days !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  section: { marginTop: "0", background: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  card: { border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px", marginTop: "12px" },
  qtyInput: { width: "60px", padding: "6px", border: "1px solid #ccc", borderRadius: "4px" },
  buyBtn: { padding: "8px 16px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" },
  error: { background: "#fee2e2", color: "#b91c1c", padding: "10px", borderRadius: "4px", marginTop: "10px" },
  success: { background: "#dcfce7", color: "#166534", padding: "10px", borderRadius: "4px", marginTop: "10px" },
  backLink: { background: "none", border: "none", color: "#2563eb", cursor: "pointer", padding: 0, fontSize: "13px", marginTop: "4px" },
  expiryBadge: (days) => ({
    fontSize: "12px",
    padding: "4px 10px",
    borderRadius: "12px",
    background: days <= 30 ? "#fee2e2" : "#fef9c3",
    color: days <= 30 ? "#b91c1c" : "#854d0e",
    whiteSpace: "nowrap",
  }),
};