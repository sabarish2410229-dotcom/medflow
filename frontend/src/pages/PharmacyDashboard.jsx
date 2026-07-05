import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyInventory, addInventory, deleteInventory, searchAndRecommend, createOrder } from "../api";
import InventoryTable from "../components/InventoryTable";
import RecommendationCard from "../components/RecommendationCard";

export default function PharmacyDashboard() {
  const { user, logout } = useAuth();
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
      </div>

      <div style={{ marginTop: "20px" }}>
        {activeTab === "inventory" && <InventoryTab />}
        {activeTab === "search" && <SearchTab />}
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
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderMsg, setOrderMsg] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    setOrderMsg("");
    setLoading(true);
    try {
      const res = await searchAndRecommend(medicineName);
      setResults(res.data);
    } catch (err) {
      setResults([]);
      setError(err.response?.data?.detail || "Search failed");
    } finally {
      setLoading(false);
    }
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
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
        <input
          placeholder="Medicine name (e.g. Paracetamol)"
          value={medicineName}
          onChange={(e) => setMedicineName(e.target.value)}
          required
          style={{ ...styles.input, flex: 1 }}
        />
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

const styles = {
  input: { padding: "8px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "14px" },
  addBtn: { padding: "8px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" },
  section: { marginTop: "20px", background: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  error: { background: "#fee2e2", color: "#b91c1c", padding: "10px", borderRadius: "4px", marginTop: "10px" },
  success: { background: "#dcfce7", color: "#166534", padding: "10px", borderRadius: "4px", marginTop: "10px" },
};