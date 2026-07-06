import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("inventory");

  return (
    <div style={{ padding: "30px", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Pharmacy Dashboard</h2>
        <div>
          <span style={{ marginRight: "12px" }}>Hi, {user?.name}</span>
          <button onClick={logout} style={{ padding: "6px 14px", cursor: "pointer" }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <TabButton active={activeTab === "inventory"} onClick={() => setActiveTab("inventory")}>
          My Inventory
        </TabButton>
        <TabButton active={activeTab === "search"} onClick={() => setActiveTab("search")}>
          Search & Recommend
        </TabButton>
        <TabButton active={activeTab === "orders"} onClick={() => setActiveTab("orders")}>
          My Orders
        </TabButton>
        <button
          onClick={() => navigate("/exchange")}
          style={{
            padding: "8px 16px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            background: "#f59e0b",
            color: "#fff",
            fontWeight: "600",
          }}
        >
          Near-Expiry Exchange →
        </button>
      </div>

      <div style={{ marginTop: "20px" }}>
        {activeTab === "inventory" && <InventoryTab />}
        {activeTab === "search" && <SearchTab />}
        {activeTab === "orders" && <OrdersTab />}
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

  return (
    <>
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.section}>
        <h3>Add Inventory</h3>
        <form onSubmit={handleAddInventory} style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
          <input name="medicine_name" placeholder="Medicine name" value={form.medicine_name} onChange={handleChange} required style={styles.input} />
          <input name="category" placeholder="Category" value={form.category} onChange={handleChange} style={styles.input} />
          <input name="price" type="number" placeholder="Price" value={form.price} onChange={handleChange} required style={styles.input} />
          <input name="stock" type="number" placeholder="Stock" value={form.stock} onChange={handleChange} required style={styles.input} />
          <input name="expiry_date" type="date" value={form.expiry_date} onChange={handleChange} style={styles.input} />
          <button type="submit" style={styles.addBtn}>Add</button>
        </form>
      </div>

      <div style={styles.section}>
        <h3>My Inventory</h3>
        {loading ? <p>Loading...</p> : <InventoryTable items={inventory} onDelete={handleDelete} />}
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
      setOrderMsg(`Order placed with ${result.dealer_name} for ${quantity} units!`);
    } catch (err) {
      setOrderMsg(err.response?.data?.detail || "Order failed");
    }
  };

  return (
    <div style={styles.section}>
      <h3>Search Medicine & Get Recommendations</h3>
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", marginTop: "12px", position: "relative" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input
            placeholder="Medicine name (e.g. Paracetamol)"
            value={medicineName}
            onChange={handleInputChange}
            onFocus={() => medicineName.length >= 2 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            required
            style={{ ...styles.input, width: "100%" }}
            autoComplete="off"
          />
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
                  {s.category && <span style={{ color: "#888", marginLeft: "8px", fontSize: "12px" }}>{s.category}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="submit" style={styles.addBtn}>Search</button>
      </form>

      {error && <div style={styles.error}>{error}</div>}
      {orderMsg && <div style={styles.success}>{orderMsg}</div>}

      <div style={{ marginTop: "16px" }}>
        {loading && <p>Searching...</p>}
        {!loading && results.map((r, i) => (
          <RecommendationCard key={r.inventory_id} result={r} rank={i + 1} onOrder={handleOrder} />
        ))}
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
      setOrders(res.data);
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

  if (loading) return <div style={styles.section}><p>Loading orders...</p></div>;

  return (
    <div style={{ display: "flex", gap: "20px" }}>
      <div style={{ ...styles.section, flex: 1, marginTop: 0 }}>
        <h3>My Orders</h3>
        {orders.length === 0 && <p style={{ color: "#666" }}>No orders yet.</p>}
        {orders.map((order) => (
          <div
            key={order.id}
            onClick={() => viewTracking(order)}
            style={{
              padding: "12px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              marginTop: "10px",
              cursor: "pointer",
              background: selectedOrder?.id === order.id ? "#eff6ff" : "#fff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>Order #{order.id}</strong>
              <span style={{
                fontSize: "12px",
                padding: "2px 8px",
                borderRadius: "10px",
                background: order.status === "delivered" ? "#dcfce7" : "#fef9c3",
                color: order.status === "delivered" ? "#166534" : "#854d0e",
              }}>
                {order.status}
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "#666", margin: "6px 0 0" }}>
              {order.order_type === "exchange" ? "Near-Expiry Exchange" : "Procurement"} ·{" "}
              {order.items.map((i) => `${i.medicine.name} x${i.quantity}`).join(", ")}
            </p>
          </div>
        ))}
      </div>

      <div style={{ ...styles.section, flex: 1, marginTop: 0 }}>
        <h3>Tracking</h3>
        {!selectedOrder && <p style={{ color: "#666" }}>Select an order to see its tracking history.</p>}
        {selectedOrder && loadingTracking && <p>Loading tracking...</p>}
        {selectedOrder && !loadingTracking && <OrderTimeline events={tracking} />}
      </div>
    </div>
  );
}

const styles = {
  input: { padding: "8px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "14px" },
  addBtn: { padding: "8px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" },
  section: { marginTop: "20px", background: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  error: { background: "#fee2e2", color: "#b91c1c", padding: "10px", borderRadius: "4px", marginTop: "10px" },
  success: { background: "#dcfce7", color: "#166534", padding: "10px", borderRadius: "4px", marginTop: "10px" },
  suggestionsBox: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    marginTop: "4px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    zIndex: 10,
    maxHeight: "200px",
    overflowY: "auto",
  },
  suggestionItem: {
    padding: "10px 14px",
    cursor: "pointer",
    borderBottom: "1px solid #f3f4f6",
  },
};