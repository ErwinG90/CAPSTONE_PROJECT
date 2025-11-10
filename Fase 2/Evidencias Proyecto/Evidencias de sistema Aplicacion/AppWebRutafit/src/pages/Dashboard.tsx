export default function Dashboard() {
    return (
        <div className="space-y-6">
            {/* KPIs vacíos */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Kpi title="Usuarios Totales" />
                <Kpi title="Usuarios Activos" />
                <Kpi title="Rutas Creadas" />
                <Kpi title="Eventos Realizados" />
            </div>

            {/* Tabs dummy */}
            <div className="flex gap-2">
                <button className="px-4 py-2 rounded-full bg-gray-200 text-sm">Deportes</button>
                <button className="px-4 py-2 rounded-full hover:bg-gray-100 text-sm">Tendencias</button>
                <button className="px-4 py-2 rounded-full hover:bg-gray-100 text-sm">Rankings</button>
            </div>

            {/* Gráfico placeholder */}
            <div className="border rounded-2xl bg-white p-6 h-72 flex items-center justify-center text-gray-400">
                Distribución de Actividades por Deporte (placeholder)
            </div>
        </div>
    );
}

function Kpi({ title }: { title: string }) {
    return (
        <div className="border rounded-2xl bg-white p-4">
            <div className="text-3xl font-bold">—</div>
            <div className="text-sm text-gray-500">{title}</div>
        </div>
    );
}
