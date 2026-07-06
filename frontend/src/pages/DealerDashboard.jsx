import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
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
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("inventory");

  return (
    <div style={{ padding: "30px", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Dealer Dashboard</h2>
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
        <TabButton active={activeTab === "orders"} onClick={() => setActiveTab("orders")}>
          Incoming Orders
        </TabButton>
      </div>

      <div style={{ marginTop: "20px" }}>
        {activeTab === "inventory" && <InventoryTab />}
        {activeTab === "orders" && <IncomingOrdersTab currentUserId={user?.id} />}
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
        <h3>Add Inventory (Stock You Supply)</h3>
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

// Defines what the NEXT status can be, matching the backend's state machine exactly
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
      // Only show orders where THIS dealer is the seller (incoming orders)
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

  if (loading) return <div style={styles.section}><p>Loading orders...</p></div>;

  return (
    <div style={{ display: "flex", gap: "20px" }}>
      <div style={{ ...styles.section, flex: 1, marginTop: 0 }}>
        <h3>Incoming Orders</h3>
        {error && <div style={styles.error}>{error}</div>}
        {orders.length === 0 && <p style={{ color: "#666" }}>No incoming orders yet.</p>}
        {orders.map((order) => (
          <div
            key={order.id}
            style={{
              padding: "12px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              marginTop: "10px",
              background: selectedOrder?.id === order.id ? "#eff6ff" : "#fff",
            }}
          >
            <div
              onClick={() => viewTracking(order)}
              style={{ cursor: "pointer", display: "flex", justifyContent: "space-between" }}
            >
              <strong>Order #{order.id}</strong>
              <span style={{
                fontSize: "12px",
                padding: "2px 8px",
                borderRadius: "10px",
                background:
                  order.status === "delivered" ? "#dcfce7" :
                  order.status === "cancelled" ? "#fee2e2" :
                  "#fef9c3",
                color:
                  order.status === "delivered" ? "#166534" :
                  order.status === "cancelled" ? "#b91c1c" :
                  "#854d0e",
              }}>
                {order.status}
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "#666", margin: "6px 0 4px" }}>
              {order.order_type === "exchange" ? "Near-Expiry Exchange" : "Procurement"} ·{" "}
              {order.items.map((i) => `${i.medicine.name} x${i.quantity}`).join(", ")}
            </p>
            <p style={{ fontSize: "12px", color: "#888", margin: "0 0 10px" }}>
              From: {order.buyer_name || "Unknown"}
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
  advanceBtn: { padding: "6px 12px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px" },
  cancelBtn: { padding: "6px 12px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px" },
  section: { marginTop: "20px", background: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  error: { background: "#fee2e2", color: "#b91c1c", padding: "10px", borderRadius: "4px", marginTop: "10px" },
};