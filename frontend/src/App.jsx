import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import PharmacyDashboard from "./pages/PharmacyDashboard";
import DealerDashboard from "./pages/DealerDashboard";
import Exchange from "./pages/Exchange";

function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/login" replace />;

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/pharmacy"
        element={
          <ProtectedRoute allowedRole="pharmacy">
            <PharmacyDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dealer"
        element={
          <ProtectedRoute allowedRole="dealer">
            <DealerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/exchange"
        element={
          <ProtectedRoute allowedRole="pharmacy">
            <Exchange />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          user ? (
            <Navigate to={user.role === "pharmacy" ? "/pharmacy" : "/dealer"} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;