import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import {
  getMyInventory,
  addInventory,
  deleteInventory,
  searchAndRecommend,
  getMedicineSuggestions,
  createOrder,
  getMyOrders,
  getOrderTracking,
} from "../api";
import InventoryTable from "../components/InventoryTable";
import RecommendationCard from "../components/RecommendationCard";
import OrderTimeline from "../components/OrderTimeline";

export default function PharmacyDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("inventory");

  return (
    <Layout>
      <div style={styles.dashboardHeader} className="animate-fade-in">
        <div>
          <h2 style={styles.dashboardTitle}>Pharmacy Portal</h2>
          <p style={styles.dashboardSubtitle}>Manage your medicine stock, procurements, and check status timeline.</p>
        </div>
      </div>

      <div style={styles.tabBar}>
        <TabButton active={activeTab === "inventory"} onClick={() => setActiveTab("inventory")}>
          📦 My Inventory
        </TabButton>
        <TabButton active={activeTab === "search"} onClick={() => setActiveTab("search")}>
          🔍 Search & Recommend
        </TabButton>
        <TabButton active={activeTab === "orders"} onClick={() => setActiveTab("orders")}>
          📋 My Orders
        </TabButton>
      </div>

      <div className="animate-fade-in" style={{ marginTop: "24px" }}>
        {activeTab === "inventory" && <InventoryTab />}
        {activeTab === "search" && <SearchTab />}
        {activeTab === "orders" && <OrdersTab />}
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

function InventoryTab() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    medicine_name: "",
    category: "",
    price: "",
    stock: "",
    expiry_date: "",
  });

  const loadInventory = async () => {
    try {
      const res = await getMyInventory();
      setInventory(res.data);
    } catch (err) {
      setError("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddInventory = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await addInventory({
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        expiry_date: form.expiry_date || null,
      });
      setForm({ medicine_name: "", category: "", price: "", stock: "", expiry_date: "" });
      loadInventory();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add inventory");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteInventory(id);
      loadInventory();
    } catch (err) {
      setError("Failed to delete item");
    }
  };

  const totalValue = inventory.reduce((acc, item) => acc + (item.price * item.stock), 0);
  const totalItems = inventory.reduce((acc, item) => acc + item.stock, 0);

  return (
    <>
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIconWrapper, background: "#e0e7ff", color: "#4f46e5" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <div>
            <h4 style={styles.statValue}>{inventory.length}</h4>
            <p style={styles.statLabel}>Unique Medicines</p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconWrapper, background: "#ecfdf5", color: "#10b981" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <div>
            <h4 style={styles.statValue}>{totalItems}</h4>
            <p style={styles.statLabel}>Total Stock Qty</p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconWrapper, background: "#fef3c7", color: "#d97706" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div>
            <h4 style={styles.statValue}>₹{totalValue.toLocaleString("en-IN")}</h4>
            <p style={styles.statLabel}>Total Stock Value</p>
          </div>
        </div>
      </div>

      <div style={styles.cardSection}>
        <h3 style={styles.sectionTitle}>Add Inventory Item</h3>
        <form onSubmit={handleAddInventory} style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Medicine Name</label>
            <input name="medicine_name" placeholder="e.g. Paracetamol" value={form.medicine_name} onChange={handleChange} required style={styles.input} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Category</label>
            <input name="category" placeholder="e.g. Analgesics" value={form.category} onChange={handleChange} style={styles.input} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Price (₹)</label>
            <input name="price" type="number" step="0.01" placeholder="e.g. 10.00" value={form.price} onChange={handleChange} required style={styles.input} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Stock</label>
            <input name="stock" type="number" placeholder="e.g. 100" value={form.stock} onChange={handleChange} required style={styles.input} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Expiry Date</label>
            <input name="expiry_date" type="date" value={form.expiry_date} onChange={handleChange} style={styles.input} />
          </div>
          <div style={{ ...styles.formGroup, flex: "1 1 100%", justifyContent: "flex-end", marginTop: "12px" }}>
            <button type="submit" style={styles.submitBtn}>
              Add Medicine
            </button>
          </div>
        </form>
      </div>

      <div style={styles.cardSection}>
        <h3 style={styles.sectionTitle}>Current Inventory</h3>
        {loading ? (
          <div style={styles.loadingContainer}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" style={{ animation: "spin 0.8s linear infinite" }}>
              <circle cx="12" cy="12" r="10" stroke="#4f46e5" strokeWidth="3" style={{ opacity: 0.25 }} />
              <path fill="#4f46e5" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span style={{ marginLeft: "10px", color: "#64748b" }}>Loading inventory...</span>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <InventoryTable items={inventory} onDelete={handleDelete} />
          </div>
        )}
      </div>
    </>
  );
}

function SearchTab() {
  const [medicineName, setMedicineName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderMsg, setOrderMsg] = useState("");

  const handleInputChange = async (e) => {
    const value = e.target.value;
    setMedicineName(value);

    if (value.length >= 2) {
      try {
        const res = await getMedicineSuggestions(value);
        setSuggestions(res.data);
        setShowSuggestions(true);
      } catch (err) {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const runSearch = async (name) => {
    setError("");
    setOrderMsg("");
    setShowSuggestions(false);
    setLoading(true);
    try {
      const res = await searchAndRecommend(name);
      setResults(res.data);
    } catch (err) {
      setResults([]);
      setError(err.response?.data?.detail || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    runSearch(medicineName);
  };

  const handleSuggestionClick = (name) => {
    setMedicineName(name);
    runSearch(name);
  };

  const handleOrder = async (result, quantity) => {
    setOrderMsg("");
    try {
      await createOrder({
        seller_id: result.dealer_id,
        order_type: "procurement",
        items: [
          {
            medicine_id: result.medicine_id,
            quantity: quantity,
            price: result.price,
          },
        ],
      });
      setOrderMsg(`Order placed successfully with ${result.dealer_name} for ${quantity} units!`);
    } catch (err) {
      setOrderMsg(err.response?.data?.detail || "Order failed");
    }
  };

  return (
    <div style={styles.cardSection}>
      <h3 style={styles.sectionTitle}>Procure Medicine</h3>
      <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "16px" }}>
        Enter a medicine name to search across dealers. Our AI will rank recommendations by price, stock levels, and reliability.
      </p>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px", position: "relative", marginBottom: "20px" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input
            placeholder="e.g. Paracetamol"
            value={medicineName}
            onChange={handleInputChange}
            onFocus={() => medicineName.length >= 2 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
            required
            style={{ ...styles.input, width: "100%", paddingLeft: "38px" }}
            autoComplete="off"
          />
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
            🔍
          </span>
          {showSuggestions && suggestions.length > 0 && (
            <div style={styles.suggestionsBox}>
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSuggestionClick(s.name);
                  }}
                  style={styles.suggestionItem}
                >
                  <strong>{s.name}</strong>
                  {s.category && <span style={{ color: "#64748b", marginLeft: "8px", fontSize: "12px", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>{s.category}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="submit" style={styles.searchSubmitBtn}>Search Dealers</button>
      </form>

      {error && <div style={styles.error}>{error}</div>}
      {orderMsg && <div style={styles.success}>{orderMsg}</div>}

      <div style={{ marginTop: "24px" }}>
        {loading && (
          <div style={styles.loadingContainer}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" style={{ animation: "spin 0.8s linear infinite" }}>
              <circle cx="12" cy="12" r="10" stroke="#4f46e5" strokeWidth="3" style={{ opacity: 0.25 }} />
              <path fill="#4f46e5" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span style={{ marginLeft: "10px", color: "#64748b" }}>Searching and ranking offers...</span>
          </div>
        )}
        {!loading && results.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h4 style={{ fontSize: "15px", color: "#334155", fontWeight: "600" }}>AI Ranked Dealer Options:</h4>
            {results.map((r, i) => (
              <RecommendationCard key={r.inventory_id} result={r} rank={i + 1} onOrder={handleOrder} />
            ))}
          </div>
        )}
        {!loading && results.length === 0 && medicineName && (
          <p style={{ textAlign: "center", color: "#94a3b8", padding: "20px 0" }}>No recommendations found. Try another query.</p>
        )}
      </div>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [loadingTracking, setLoadingTracking] = useState(false);

  const loadOrders = async () => {
    try {
      const res = await getMyOrders();
      // Only show procurement (dealer) orders here — exchange orders live in
      // the Near-Expiry Exchange page's own My Orders / Incoming Orders tabs.
      const dealerOrders = res.data.filter((o) => o.order_type === "procurement");
      setOrders(dealerOrders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const viewTracking = async (order) => {
    setSelectedOrder(order);
    setLoadingTracking(true);
    try {
      const res = await getOrderTracking(order.id);
      setTracking(res.data);
    } catch (err) {
      setTracking([]);
    } finally {
      setLoadingTracking(false);
    }
  };

  if (loading) return (
    <div style={styles.cardSection}>
      <div style={styles.loadingContainer}>
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" style={{ animation: "spin 0.8s linear infinite" }}>
          <circle cx="12" cy="12" r="10" stroke="#4f46e5" strokeWidth="3" style={{ opacity: 0.25 }} />
          <path fill="#4f46e5" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span style={{ marginLeft: "10px", color: "#64748b" }}>Loading orders...</span>
      </div>
    </div>
  );

  return (
    <div style={styles.ordersContainer}>
      <div style={{ ...styles.cardSection, flex: 1.2, marginTop: 0 }}>
        <h3 style={styles.sectionTitle}>My Orders</h3>
        {orders.length === 0 && <p style={{ color: "#64748b", margin: "16px 0" }}>No orders placed yet.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {orders.map((order) => (
            <div
              key={order.id}
              onClick={() => viewTracking(order)}
              style={{
                ...styles.orderCard,
                borderColor: selectedOrder?.id === order.id ? "#4f46e5" : "#e2e8f0",
                background: selectedOrder?.id === order.id ? "#f5f7ff" : "#fff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "14px", color: "#0f172a" }}>Order #{order.id}</strong>
                <span style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  padding: "4px 10px",
                  borderRadius: "12px",
                  background: order.status === "delivered" ? "#d1fae5" : "#fef3c7",
                  color: order.status === "delivered" ? "#065f46" : "#b45309",
                }}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace(/_/g, " ")}
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "#334155", margin: "8px 0 4px", fontWeight: "500" }}>
                🛒 Procurement ·{" "}
                {order.items.map((i) => `${i.medicine.name} (${i.quantity})`).join(", ")}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Seller: <strong style={{ color: "#475569" }}>{order.seller_name || "Unknown"}</strong>
                </span>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>Click to track</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...styles.cardSection, flex: 0.8, marginTop: 0, minWidth: "300px" }}>
        <h3 style={styles.sectionTitle}>Order Tracking</h3>
        {!selectedOrder && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
            <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}>📍</span>
            Select an order to see its tracking history.
          </div>
        )}
        {selectedOrder && loadingTracking && (
          <div style={styles.loadingContainer}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" style={{ animation: "spin 0.8s linear infinite" }}>
              <circle cx="12" cy="12" r="10" stroke="#4f46e5" strokeWidth="3" style={{ opacity: 0.25 }} />
              <path fill="#4f46e5" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span style={{ marginLeft: "10px", color: "#64748b" }}>Loading track data...</span>
          </div>
        )}
        {selectedOrder && !loadingTracking && (
          <div className="animate-fade-in" style={{ padding: "8px 0" }}>
            <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "16px" }}>
              <strong style={{ fontSize: "14px", color: "#0f172a" }}>Track ID: #{selectedOrder.id}</strong>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0" }}>Transit timeline for {selectedOrder.items.length} medicines</p>
            </div>
            <OrderTimeline events={tracking} />
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  dashboardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "16px",
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
  statsGrid: {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
    flexWrap: "wrap",
    width: "100%",
  },
  statCard: {
    flex: "1 1 200px",
    background: "#fff",
    padding: "16px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 1px 2px 0 rgba(0,0,0,0.02)",
  },
  statIconWrapper: {
    width: "36px",
    height: "36px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0,
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: "12px",
    color: "#64748b",
    margin: 0,
    fontWeight: "500",
  },
  cardSection: {
    background: "#fff",
    padding: "20px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 2px 0 rgba(0,0,0,0.02)",
    marginBottom: "24px",
  },
  sectionTitle: {
    fontSize: "15px",
    fontWeight: "750",
    color: "#0f172a",
    marginBottom: "16px",
    letterSpacing: "-0.01em",
  },
  formGrid: {
    display: "flex",
    gap: "14px",
    flexWrap: "wrap",
  },
  formGroup: {
    flex: "1 1 180px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
  },
  input: {
    padding: "8px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "14px",
    color: "#0f172a",
    background: "#fff",
    outline: "none",
    transition: "all 0.15s ease",
  },
  submitBtn: {
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13px",
    boxShadow: "0 1px 2px rgba(79, 70, 229, 0.05)",
    transition: "all 0.15s ease",
  },
  searchSubmitBtn: {
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    padding: "8px 20px",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13px",
    boxShadow: "0 1px 2px rgba(79, 70, 229, 0.05)",
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
  suggestionsBox: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    marginTop: "6px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
    zIndex: 10,
    maxHeight: "220px",
    overflowY: "auto",
  },
  suggestionItem: {
    padding: "10px 14px",
    cursor: "pointer",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "14px",
    transition: "background 0.15s",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ordersContainer: {
    display: "flex",
    gap: "24px",
    flexWrap: "wrap",
  },
  orderCard: {
    padding: "12px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.15s ease",
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
  },
};