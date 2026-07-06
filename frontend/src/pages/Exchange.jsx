import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getExchangeListings, getMyExchangeListings, purchaseExchangeStock } from "../api";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

export default function Exchange() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("browse");

  return (
    <Layout>
      <div style={styles.dashboardHeader} className="animate-fade-in">
        <div>
          <button onClick={() => navigate("/pharmacy")} style={styles.backLink}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: "4px" }}>
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to Dashboard
          </button>
          <h2 style={styles.dashboardTitle}>Near-Expiry Medicine Exchange</h2>
          <p style={styles.dashboardSubtitle}>Browse discounted stocks from other pharmacies or trade your own inventory before expiry.</p>
        </div>
      </div>

      <div style={styles.tabBar}>
        <TabButton active={activeTab === "browse"} onClick={() => setActiveTab("browse")}>
          🌐 Browse Listings
        </TabButton>
        <TabButton active={activeTab === "mine"} onClick={() => setActiveTab("mine")}>
          📦 My Near-Expiry Stock
        </TabButton>
      </div>

      <div className="animate-fade-in" style={{ marginTop: "24px" }}>
        {activeTab === "browse" && <BrowseTab />}
        {activeTab === "mine" && <MyListingsTab />}
      </div>
    </Layout>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.tabButton,
        background: active ? "#4f46e5" : "transparent",
        color: active ? "#fff" : "#64748b",
        fontWeight: active ? "600" : "500",
        boxShadow: active ? "0 4px 12px rgba(79, 70, 229, 0.15)" : "none",
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
      setSuccessMsg(`Successfully purchased ${qty} units of ${listing.medicine.name}!`);
      loadListings();
    } catch (err) {
      setError(err.response?.data?.detail || "Purchase failed");
    }
  };

  if (loading) return (
    <div style={styles.cardSection}>
      <div style={styles.loadingContainer}>
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" style={{ animation: "spin 0.8s linear infinite" }}>
          <circle cx="12" cy="12" r="10" stroke="#4f46e5" strokeWidth="3" style={{ opacity: 0.25 }} />
          <path fill="#4f46e5" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span style={{ marginLeft: "10px", color: "#64748b" }}>Loading listings...</span>
      </div>
    </div>
  );

  return (
    <div style={styles.cardSection}>
      <h3 style={styles.sectionTitle}>Available Exchange Medicine Stocks</h3>
      {error && <div style={styles.error}>{error}</div>}
      {successMsg && <div style={styles.success}>{successMsg}</div>}

      {listings.length === 0 && (
        <p style={{ color: "#64748b", marginTop: "16px", textAlign: "center", padding: "40px 0" }}>
          No near-expiry listings available right now.
        </p>
      )}

      <div style={styles.listingsGrid}>
        {listings.map((listing) => {
          const days = daysUntil(listing.expiry_date);
          return (
            <div key={listing.id} style={styles.listingCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <h4 style={styles.medicineTitle}>{listing.medicine.name}</h4>
                  <span style={styles.categoryBadge}>{listing.medicine.category || "General"}</span>
                </div>
                <span style={styles.expiryBadge(days)}>
                  ⏳ {days} day{days !== 1 ? "s" : ""} left
                </span>
              </div>

              <div style={styles.listingDetails}>
                <div style={styles.detailRow}>
                  <span>Price:</span>
                  <strong>₹{listing.price} / unit</strong>
                </div>
                <div style={styles.detailRow}>
                  <span>Stock:</span>
                  <strong>{listing.stock} units</strong>
                </div>
                <div style={{ ...styles.detailRow, borderTop: "1px dashed #f1f5f9", paddingTop: "8px", marginTop: "8px" }}>
                  <span>Seller:</span>
                  <span>{listing.owner_name}</span>
                </div>
                {listing.owner_phone && (
                  <div style={styles.metaRow}>📞 {listing.owner_phone}</div>
                )}
                {listing.owner_address && (
                  <div style={styles.metaRow}>📍 {listing.owner_address}</div>
                )}
              </div>

              <div style={styles.listingAction}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
                  <input
                    type="number"
                    min="1"
                    max={listing.stock}
                    value={quantities[listing.id] || 1}
                    onChange={(e) => handleQtyChange(listing.id, e.target.value)}
                    style={styles.qtyInput}
                  />
                  <button onClick={() => handlePurchase(listing)} style={styles.buyBtn}>
                    Buy Discounted
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MyListingsTab() {
  const [listings, setLoadingListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyExchangeListings()
      .then((res) => setLoadingListings(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={styles.cardSection}>
      <div style={styles.loadingContainer}>
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" style={{ animation: "spin 0.8s linear infinite" }}>
          <circle cx="12" cy="12" r="10" stroke="#4f46e5" strokeWidth="3" style={{ opacity: 0.25 }} />
          <path fill="#4f46e5" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span style={{ marginLeft: "10px", color: "#64748b" }}>Loading your listings...</span>
      </div>
    </div>
  );

  return (
    <div style={styles.cardSection}>
      <h3 style={styles.sectionTitle}>Your Stock Nearing Expiry</h3>
      <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "16px" }}>
        ⚠️ Any inventory item within 90 days of expiry is automatically listed on the Exchange database for other pharmacies to acquire.
      </p>

      {listings.length === 0 && (
        <p style={{ color: "#64748b", marginTop: "16px", textAlign: "center", padding: "40px 0" }}>
          None of your inventory items are currently near expiry.
        </p>
      )}

      <div style={styles.listingsGrid}>
        {listings.map((listing) => {
          const days = daysUntil(listing.expiry_date);
          return (
            <div key={listing.id} style={{ ...styles.listingCard, borderColor: "#cbd5e1", background: "#f8fafc" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h4 style={styles.medicineTitle}>{listing.medicine.name}</h4>
                <span style={styles.expiryBadge(days)}>
                  ⏳ {days} day{days !== 1 ? "s" : ""} left
                </span>
              </div>
              <div style={styles.listingDetails}>
                <div style={styles.detailRow}>
                  <span>Price:</span>
                  <strong>₹{listing.price} / unit</strong>
                </div>
                <div style={styles.detailRow}>
                  <span>Stock Remaining:</span>
                  <strong>{listing.stock} units</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  dashboardHeader: {
    marginBottom: "24px",
  },
  backLink: {
    background: "none",
    border: "none",
    color: "#4f46e5",
    cursor: "pointer",
    padding: 0,
    fontSize: "13px",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    marginBottom: "12px",
  },
  dashboardTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: "-0.03em",
  },
  dashboardSubtitle: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "4px",
  },
  tabBar: {
    display: "flex",
    gap: "4px",
    background: "#f1f5f9",
    padding: "4px",
    borderRadius: "6px",
    maxWidth: "fit-content",
    marginBottom: "24px",
  },
  tabButton: {
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    transition: "all 0.15s ease",
  },
  cardSection: {
    background: "#fff",
    padding: "20px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
    marginBottom: "24px",
  },
  sectionTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "12px",
    letterSpacing: "-0.01em",
  },
  listingsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "16px",
    marginTop: "16px",
  },
  listingCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
    transition: "all 0.15s ease",
  },
  medicineTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  categoryBadge: {
    fontSize: "11px",
    fontWeight: "500",
    background: "#f1f5f9",
    color: "#475569",
    padding: "2px 6px",
    borderRadius: "4px",
    marginTop: "4px",
    display: "inline-block",
    border: "1px solid #e2e8f0",
  },
  listingDetails: {
    fontSize: "13px",
    color: "#475569",
    margin: "12px 0",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
  },
  metaRow: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px",
  },
  listingAction: {
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid #f1f5f9",
  },
  qtyInput: {
    width: "60px",
    padding: "6px 8px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "13px",
    textAlign: "center",
    outline: "none",
    transition: "border-color 0.15s ease",
  },
  buyBtn: {
    flex: 1,
    padding: "8px 14px",
    background: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    boxShadow: "0 1px 2px rgba(16, 185, 129, 0.05)",
    transition: "all 0.15s ease",
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "30px 0",
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
  },
  expiryBadge: (days) => {
    let background = "#f0fdf4";
    let color = "#166534";
    let border = "1px solid #dcfce7";
    if (days <= 30) {
      background = "#fff1f2";
      color = "#b91c1c";
      border = "1px solid #fecaca";
    } else if (days <= 60) {
      background = "#fffbeb";
      color = "#b45309";
      border = "1px solid #fde68a";
    }
    return {
      fontSize: "11px",
      fontWeight: "600",
      padding: "2px 6px",
      borderRadius: "4px",
      background,
      color,
      border,
      whiteSpace: "nowrap",
    };
  },
};