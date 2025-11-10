import { Outlet, NavLink } from "react-router-dom";

export default function AppLayout() {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 flex">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-white hidden md:flex md:flex-col">
                <div className="px-4 py-5 border-b">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gray-900 text-white flex items-center justify-center">🏁</div>
                        <div>
                            <p className="text-sm font-semibold">SportRoutes</p>
                            <span className="text-xs rounded bg-gray-100 px-2 py-0.5">Admin</span>
                        </div>
                    </div>
                </div>

                <nav className="p-2 flex-1">
                    <SideLink to="/app/dashboard" label="Panel Principal" icon="🏠" />
                    <SideLink to="/app/users" label="Usuarios" icon="👥" />
                    <SideLink to="/app/routes" label="Rutas" icon="🗺️" />
                    <SideLink to="/app/events" label="Eventos" icon="📅" />
                    <SideLink to="/app/settings" label="Configuración" icon="⚙️" />
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
                        <p className="text-gray-500 text-sm">Análisis y métricas de la aplicación SportRoutes</p>
                    </div>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">Administrador</span>
                </header>

                {/* Página */}
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

function SideLink({ to, label, icon }: { to: string; label: string; icon: string }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive ? "bg-gray-200 font-medium" : "hover:bg-gray-100"
                }`
            }
        >
            <span className="w-5 text-center">{icon}</span>
            <span>{label}</span>
        </NavLink>
    );
}
