import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically attach the JWT token to every request, if one exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------- AUTH ----------
export const registerUser = (data) => api.post("/auth/register", data);
export const loginUser = (data) => api.post("/auth/login", data);

// ---------- INVENTORY ----------
export const addInventory = (data) => api.post("/inventory/", data);
export const getMyInventory = () => api.get("/inventory/mine");
export const updateInventory = (id, data) => api.put(`/inventory/${id}`, data);
export const deleteInventory = (id) => api.delete(`/inventory/${id}`);

// ---------- PROCUREMENT ----------
export const searchAndRecommend = (medicineName) =>
  api.get(`/procurement/search?medicine_name=${encodeURIComponent(medicineName)}`);

// ---------- ORDERS ----------
export const createOrder = (data) => api.post("/orders/", data);
export const getMyOrders = () => api.get("/orders/mine");
export const getOrder = (id) => api.get(`/orders/${id}`);
export const updateOrderStatus = (id, status) =>
  api.put(`/orders/${id}/status`, { status });
export const getOrderTracking = (id) => api.get(`/orders/${id}/tracking`);

// ---------- EXCHANGE ----------
export const getExchangeListings = () => api.get("/exchange/listings");
export const getMyExchangeListings = () => api.get("/exchange/mine");
export const purchaseExchangeStock = (inventoryId, quantity) =>
  api.post(`/exchange/${inventoryId}/purchase?quantity=${quantity}`);

export default api;