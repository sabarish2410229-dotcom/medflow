import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getExchangeListings,
  getMyExchangeListings,
  createExchangeRequest,
  getIncomingRequests,
  getMyRequests,
  acceptExchangeRequest,
  rejectExchangeRequest,
  cancelExchangeRequest,
} from "../api";
import { useNavigate } from "react-router-dom";
import RequestTimeline from "../components/RequestTimeline";

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

      <div style={{ marginTop: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <TabButton active={activeTab === "browse"} onClick={() => setActiveTab("browse")}>
          Browse Listings
        </TabButton>
        <TabButton active={activeTab === "mine"} onClick={() => setActiveTab("mine")}>
          My Near-Expiry Stock
        </TabButton>
        <TabButton active={activeTab === "incoming"} onClick={() => setActiveTab("incoming")}>
          Incoming Orders
        </TabButton>
        <TabButton active={activeTab === "myorders"} onClick={() => setActiveTab("myorders")}>
          My Orders
        </TabButton>
      </div>

      <div style={{ marginTop: "20px" }}>
        {activeTab === "browse" && <BrowseTab />}
        {activeTab === "mine" && <MyListingsTab />}
        {activeTab === "incoming" && <IncomingOrdersTab />}
        {activeTab === "myorders" && <MyOrdersTab />}
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

function statusStyle(status) {
  const map = {
    pending: { bg: "#fef9c3", color: "#854d0e" },
    accepted: { bg: "#dcfce7", color: "#166534" },
    rejected: { bg: "#fee2e2", color: "#b91c1c" },
    cancelled: { bg: "#f1f5f9", color: "#64748b" },
    completed: { bg: "#dbeafe", color: "#1e40af" },
  };
  return map[status] || map.pending;
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

  const handleSendRequest = async (listing) => {
    setError("");
    setSuccessMsg("");
    const qty = parseInt(quantities[listing.id]) || 1;

    if (qty > listing.stock) {
      setError(`Only ${listing.stock} units available`);
      return;
    }

    try {
      await createExchangeRequest(listing.id, qty);
      setSuccessMsg(`Request sent to ${listing.owner_name} for ${qty} units of ${listing.medicine.name}!`);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send request");
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
                  {listing.medicine.category || "-"} · ₹{listing.price}/unit · {listing.available_quantity} units available
                  {listing.reserved_quantity > 0 && (
                    <span style={{ color: "#d97706" }}> ({listing.reserved_quantity} reserved)</span>
                  )}
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

            <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <label style={{ fontSize: "13px" }}>Qty:</label>
              <input
                type="number"
                min="1"
                max={listing.available_quantity}
                value={quantities[listing.id] || 1}
                onChange={(e) => handleQtyChange(listing.id, e.target.value)}
                style={styles.qtyInput}
              />
              <button onClick={() => handleSendRequest(listing)} style={styles.requestBtn}>
                Send Request
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

  const load = () => {
    getMyExchangeListings()
      .then((res) => setListings(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
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
                  ₹{listing.price}/unit · Total stock: {listing.stock}
                </p>
              </div>
              <span style={styles.expiryBadge(days)}>
                Expires in {days} day{days !== 1 ? "s" : ""}
              </span>
            </div>

            <div style={{ marginTop: "10px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <StatPill label="Available" value={listing.available_quantity} color="#166534" bg="#dcfce7" />
              <StatPill label="Reserved" value={listing.reserved_quantity} color="#854d0e" bg="#fef9c3" />
              <StatPill label="Pending" value={listing.pending_count} color="#854d0e" bg="#fef9c3" />
              <StatPill label="Accepted" value={listing.accepted_count} color="#166534" bg="#dcfce7" />
              <StatPill label="Rejected" value={listing.rejected_count} color="#b91c1c" bg="#fee2e2" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatPill({ label, value, color, bg }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "10px", background: bg, color }}>
        {value}
      </span>
      <span style={{ fontSize: "12px", color: "#888" }}>{label}</span>
    </div>
  );
}

function IncomingOrdersTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    try {
      const res = await getIncomingRequests();
      setRequests(res.data);
    } catch (err) {
      setError("Failed to load incoming orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAccept = async (req) => {
    setUpdating(true);
    setError("");
    try {
      await acceptExchangeRequest(req.id);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to accept request");
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async (req) => {
    if (!window.confirm(`Reject request from ${req.buyer_name}?`)) return;
    setUpdating(true);
    setError("");
    try {
      await rejectExchangeRequest(req.id);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to reject request");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div style={styles.section}><p>Loading...</p></div>;

  return (
    <div style={{ display: "flex", gap: "20px" }}>
      <div style={{ ...styles.section, flex: 1, marginTop: 0 }}>
        <h3>Incoming Orders</h3>
        {error && <div style={styles.error}>{error}</div>}
        {requests.length === 0 && <p style={{ color: "#666" }}>No incoming orders yet.</p>}

        {requests.map((req) => {
          const sStyle = statusStyle(req.status);
          return (
            <div
              key={req.id}
              style={{
                ...styles.card,
                background: selected?.id === req.id ? "#eff6ff" : "#fff",
                cursor: "pointer",
              }}
              onClick={() => setSelected(req)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h4 style={{ margin: 0 }}>{req.medicine.name}</h4>
                  <p style={{ margin: "4px 0", color: "#666", fontSize: "13px" }}>
                    Expiry not tracked per-batch in this version
                  </p>
                  <p style={{ margin: "4px 0", fontSize: "14px" }}>
                    Qty: {req.quantity} · Offered Value: ₹{(req.quantity * req.price).toFixed(2)}
                  </p>
                  <p style={{ margin: "4px 0", fontWeight: "600", fontSize: "13px" }}>
                    From: {req.buyer_name}
                  </p>
                </div>
                <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "10px", background: sStyle.bg, color: sStyle.color }}>
                  {req.status}
                </span>
              </div>

              {req.status === "pending" && (
                <div style={{ marginTop: "12px", display: "flex", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleAccept(req)} disabled={updating} style={styles.acceptBtn}>
                    Accept
                  </button>
                  <button onClick={() => handleReject(req)} disabled={updating} style={styles.rejectBtn}>
                    Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ ...styles.section, flex: 1, marginTop: 0 }}>
        <h3>Timeline</h3>
        {!selected && <p style={{ color: "#666" }}>Select a request to see its timeline.</p>}
        {selected && <RequestTimeline request={selected} />}
      </div>
    </div>
  );
}

function MyOrdersTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    try {
      const res = await getMyRequests();
      setRequests(res.data);
    } catch (err) {
      setError("Failed to load your orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (req) => {
    if (!window.confirm(`Cancel your request for ${req.medicine.name}?`)) return;
    setUpdating(true);
    setError("");
    try {
      await cancelExchangeRequest(req.id);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to cancel request");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div style={styles.section}><p>Loading...</p></div>;

  return (
    <div style={{ display: "flex", gap: "20px" }}>
      <div style={{ ...styles.section, flex: 1, marginTop: 0 }}>
        <h3>My Orders</h3>
        {error && <div style={styles.error}>{error}</div>}
        {requests.length === 0 && <p style={{ color: "#666" }}>You haven't sent any requests yet.</p>}

        {requests.map((req) => {
          const sStyle = statusStyle(req.status);
          return (
            <div
              key={req.id}
              style={{
                ...styles.card,
                background: selected?.id === req.id ? "#eff6ff" : "#fff",
                cursor: "pointer",
              }}
              onClick={() => setSelected(req)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h4 style={{ margin: 0 }}>{req.medicine.name}</h4>
                  <p style={{ margin: "4px 0", fontSize: "14px" }}>
                    Qty: {req.quantity} · Requested Value: ₹{(req.quantity * req.price).toFixed(2)}
                  </p>
                  <p style={{ margin: "4px 0", fontWeight: "600", fontSize: "13px" }}>
                    Owner: {req.seller_name}
                  </p>
                </div>
                <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "10px", background: sStyle.bg, color: sStyle.color }}>
                  {req.status}
                </span>
              </div>

              {req.status === "pending" && (
                <div style={{ marginTop: "12px" }} onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleCancel(req)} disabled={updating} style={styles.rejectBtn}>
                    Cancel Request
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ ...styles.section, flex: 1, marginTop: 0 }}>
        <h3>Timeline</h3>
        {!selected && <p style={{ color: "#666" }}>Select an order to see its timeline.</p>}
        {selected && <RequestTimeline request={selected} />}
      </div>
    </div>
  );
}

const styles = {
  section: { marginTop: "0", background: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  card: { border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px", marginTop: "12px" },
  qtyInput: { width: "60px", padding: "6px", border: "1px solid #ccc", borderRadius: "4px" },
  buyBtn: { padding: "8px 16px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" },
  requestBtn: { padding: "8px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" },
  acceptBtn: { padding: "6px 14px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px" },
  rejectBtn: { padding: "6px 14px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px" },
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