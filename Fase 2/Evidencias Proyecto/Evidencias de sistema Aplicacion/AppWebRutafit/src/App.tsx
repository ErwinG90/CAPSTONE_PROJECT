import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AppLayout from "./layouts/AppLayout";
import Users from "./pages/Users";
import RoutesPage from "./pages/RoutesPage";
import Events from "./pages/Eventos";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <Routes>
      {/* Login como inicio */}
      <Route path="/" element={<Login />} />

      {/* Área de la app con layout */}
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="routes" element={<RoutesPage />} />
        <Route path="events" element={<Events />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
