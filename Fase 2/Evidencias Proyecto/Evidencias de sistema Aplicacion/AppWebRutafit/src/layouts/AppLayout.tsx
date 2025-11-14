import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  IoHomeOutline,
  IoPeopleOutline,
  IoMapOutline,
  IoCalendarOutline,
  IoSettingsOutline,
  IoLogOutOutline,
} from "react-icons/io5";
import logo from "../rutafit_logon_sin_texto.png";

export default function AppLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    // TODO: aquí limpias lo que uses para auth
    // ej: localStorage.removeItem("admin_token");
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white hidden md:flex md:flex-col">
        <div className="px-4 py-5 border-b">
          <div className="flex items-center gap-2">
            <div className="h-11 w-11 rounded-full bg-gray-900 flex items-center justify-center overflow-hidden">
              <img
                src={logo}
                alt="RutaFit"
                className="h-10 w-10 object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-extrabold text-green-600">RutaFit</p>
              <span className="text-xs rounded bg-green-50 text-green-700 px-2 py-0.5 border border-green-100">
                Admin
              </span>
            </div>
          </div>
        </div>

        <nav className="p-2 flex-1">
          <SideLink
            to="/app/dashboard"
            label="Panel Principal"
            icon={<IoHomeOutline className="text-lg" />}
          />
          <SideLink
            to="/app/users"
            label="Usuarios"
            icon={<IoPeopleOutline className="text-lg" />}
          />
          <SideLink
            to="/app/routes"
            label="Rutas"
            icon={<IoMapOutline className="text-lg" />}
          />
          <SideLink
            to="/app/events"
            label="Eventos"
            icon={<IoCalendarOutline className="text-lg" />}
          />
        </nav>

        <div className="p-4 border-t text-xs">
          <div className="font-medium">Administrador</div>
          <div className="text-gray-500">admin@admin.com</div>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1">
        {/* Topbar */}
        <header className="h-16 bg-white border-b flex items-center px-6 justify-between">
          <div>
            <h1 className="text-xl font-semibold">Panel de Control</h1>
            <p className="text-gray-500 text-sm">
              Análisis y métricas de la aplicación RutaFit
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200">
              Administrador
            </span>
            <button
              onClick={handleLogout}
              className="text-xs rounded-lg border px-3 py-1.5 bg-white hover:bg-gray-50 flex items-center gap-2"
            >
              <IoLogOutOutline className="text-sm" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </header>

        {/* Página */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

import type { ReactNode } from "react";

function SideLink({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center_gap-3 px-3 py-2 rounded-lg text-sm ${isActive
          ? "bg-green-50 text-green-700 font-medium"
          : "hover:bg-gray-100 text-gray-700"
        }`
      }
    >
      <span className="w-5 flex items-center justify-center">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}
