import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import {
  getMyInventory,
  addInventory,
  deleteInventory,
  getMyOrders,
  updateOrderStatus,
  getOrderTracking,
} from "../api";
import InventoryTable from "../components/InventoryTable";
import OrderTimeline from "../components/OrderTimeline";

export default function DealerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("inventory");

  return (
    <Layout>
      <div style={styles.dashboardHeader} className="animate-fade-in">
        <div>
          <h2 style={styles.dashboardTitle}>Dealer Portal</h2>
          <p style={styles.dashboardSubtitle}>Manage supply inventory, review incoming procurement orders, and update shipping logs.</p>
        </div>
      </div>

      <div style={styles.tabBar}>
        <TabButton active={activeTab === "inventory"} onClick={() => setActiveTab("inventory")}>
          📦 My Inventory
        </TabButton>
        <TabButton active={activeTab === "orders"} onClick={() => setActiveTab("orders")}>
          📥 Incoming Orders
        </TabButton>
      </div>

      <div className="animate-fade-in" style={{ marginTop: "24px" }}>
        {activeTab === "inventory" && <InventoryTab />}
        {activeTab === "orders" && <IncomingOrdersTab currentUserId={user?.id} />}
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
            <p style={styles.statLabel}>Supplied Medicines</p>
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
            <p style={styles.statLabel}>Available Stock Units</p>
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
            <p style={styles.statLabel}>Stock Market Value</p>
          </div>
        </div>
      </div>

      <div style={styles.cardSection}>
        <h3 style={styles.sectionTitle}>Add Inventory (Stock You Supply)</h3>
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
              Add Product
            </button>
          </div>
        </form>
      </div>

      <div style={styles.cardSection}>
        <h3 style={styles.sectionTitle}>My Active Inventory</h3>
        {loading ? (
          <div style={styles.loadingContainer}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" style={{ animation: "spin 0.8s linear infinite" }}>
              <circle cx="12" cy="12" r="10" stroke="#4f46e5" strokeWidth="3" style={{ opacity: 0.25 }} />
              <path fill="#4f46e5" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span style={{ marginLeft: "10px", color: "#64748b" }}>Loading products...</span>
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

const NEXT_STATUS = {
  created: "accepted",
  accepted: "packed",
  packed: "dispatched",
  dispatched: "out_for_delivery",
  out_for_delivery: "delivered",
  delivered: null,
  cancelled: null,
};

const STATUS_BUTTON_LABEL = {
  created: "Accept Order",
  accepted: "Mark as Packed",
  packed: "Mark as Dispatched",
  dispatched: "Mark Out for Delivery",
  out_for_delivery: "Mark as Delivered",
};

function IncomingOrdersTab({ currentUserId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [updating, setUpdating] = useState(false);

  const loadOrders = async () => {
    try {
      const res = await getMyOrders();
      const incoming = res.data.filter((o) => o.seller_id === currentUserId);
      setOrders(incoming);
    } catch (err) {
      setError("Failed to load orders");
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

  const handleAdvanceStatus = async (order) => {
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) return;

    setUpdating(true);
    setError("");
    try {
      await updateOrderStatus(order.id, nextStatus);
      await loadOrders();
      if (selectedOrder?.id === order.id) {
        const res = await getOrderTracking(order.id);
        setTracking(res.data);
        setSelectedOrder({ ...order, status: nextStatus });
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async (order) => {
    if (!window.confirm(`Cancel order #${order.id}? This will restore your reserved stock.`)) return;
    setUpdating(true);
    setError("");
    try {
      await updateOrderStatus(order.id, "cancelled");
      await loadOrders();
      if (selectedOrder?.id === order.id) {
        const res = await getOrderTracking(order.id);
        setTracking(res.data);
        setSelectedOrder({ ...order, status: "cancelled" });
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to cancel order");
    } finally {
      setUpdating(false);
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
        <h3 style={styles.sectionTitle}>Incoming Orders</h3>
        {error && <div style={styles.error}>{error}</div>}
        {orders.length === 0 && <p style={{ color: "#64748b", margin: "16px 0" }}>No incoming requests yet.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                ...styles.orderCard,
                borderColor: selectedOrder?.id === order.id ? "#4f46e5" : "#e2e8f0",
                background: selectedOrder?.id === order.id ? "#f5f7ff" : "#fff",
              }}
            >
              <div
                onClick={() => viewTracking(order)}
                style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <strong style={{ fontSize: "14px", color: "#0f172a" }}>Order #{order.id}</strong>
                <span style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  padding: "4px 10px",
                  borderRadius: "12px",
                  background:
                    order.status === "delivered" ? "#d1fae5" :
                    order.status === "cancelled" ? "#fee2e2" :
                    "#fef3c7",
                  color:
                    order.status === "delivered" ? "#065f46" :
                    order.status === "cancelled" ? "#b91c1c" :
                    "#b45309",
                }}>
                  {order.status}
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "#334155", margin: "8px 0 4px", fontWeight: "500" }}>
                {order.order_type === "exchange" ? "🔄 Exchange Stock" : "🛒 Direct Procurement"} ·{" "}
                {order.items.map((i) => `${i.medicine.name} (${i.quantity})`).join(", ")}
              </p>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 12px" }}>
                Buyer: <strong style={{ color: "#475569" }}>{order.buyer_name || "Unknown"}</strong>
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                {NEXT_STATUS[order.status] && (
                  <button
                    onClick={() => handleAdvanceStatus(order)}
                    disabled={updating}
                    style={styles.advanceBtn}
                  >
                    {updating ? "Updating..." : STATUS_BUTTON_LABEL[order.status]}
                  </button>
                )}
                {(order.status === "created" || order.status === "accepted") && (
                  <button
                    onClick={() => handleCancelOrder(order)}
                    disabled={updating}
                    style={styles.cancelBtn}
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...styles.cardSection, flex: 0.8, marginTop: 0, minWidth: "300px" }}>
        <h3 style={styles.sectionTitle}>Dispatch Timeline</h3>
        {!selectedOrder && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
            <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}>📍</span>
            Select an order to track shipping updates.
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
              <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0" }}>Transit timeline for {selectedOrder.items.length} items</p>
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
  advanceBtn: {
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
  cancelBtn: {
    padding: "8px 14px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    boxShadow: "0 1px 2px rgba(239, 68, 68, 0.05)",
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
  ordersContainer: {
    display: "flex",
    gap: "24px",
    flexWrap: "wrap",
  },
  orderCard: {
    padding: "12px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    transition: "all 0.15s ease",
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
  },
};