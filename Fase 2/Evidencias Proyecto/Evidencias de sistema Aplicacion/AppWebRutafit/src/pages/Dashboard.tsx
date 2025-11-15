// src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Cell,
} from "recharts";
import {
    IoPeopleOutline,
    IoMapOutline,
    IoCalendarOutline,
    IoGlobeOutline,
    IoRefreshOutline,
} from "react-icons/io5";

import { fetchUsers, type UserBasic } from "../services/users";
import { fetchRutas, type Ruta } from "../services/rutasService";
import { fetchEventos, type Evento } from "../services/eventos";
import { fetchDeportes } from "../services/catalogs";

const BAR_COLORS = ["#22c55e", "#3b82f6", "#f97316", "#e11d48", "#a855f7", "#14b8a6"];

export default function Dashboard() {
    const [users, setUsers] = useState<UserBasic[]>([]);
    const [usersTotal, setUsersTotal] = useState<number>(0);
    const [rutas, setRutas] = useState<Ruta[]>([]);
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [deportesMap, setDeportesMap] = useState<Record<string, string>>({});

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /* ===== CATÁLOGOS (deportes) ===== */
    useEffect(() => {
        let mounted = true;
        fetchDeportes()
            .then((map) => {
                if (!mounted) return;
                setDeportesMap(map);
            })
            .catch((e) => console.error("Error cargando deportes:", e));
        return () => {
            mounted = false;
        };
    }, []);

    /* ===== CARGA PRINCIPAL ===== */
    async function loadData() {
        try {
            setLoading(true);
            setError(null);

            const [usersResp, rutasResp, eventosResp] = await Promise.all([
                fetchUsers({ page: 1, pageSize: 100 }),
                fetchRutas(),
                fetchEventos(),
            ]);

            setUsers(usersResp.rows ?? []);
            setUsersTotal(usersResp.total ?? usersResp.rows.length);

            setRutas(rutasResp ?? []);
            setEventos(eventosResp ?? []);
        } catch (e) {
            console.error(e);
            setError("No se pudieron cargar los datos del dashboard.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    /* ===== KPIs ===== */

    const totalUsuarios = usersTotal || users.length;
    const totalRutas = rutas.length;
    const totalEventos = eventos.length;

    const rutasPublicas = useMemo(
        () => rutas.filter((r) => r.publico === true).length,
        [rutas]
    );

    const eventosProgramados = useMemo(
        () => eventos.filter((e) => e.estado === "programado").length,
        [eventos]
    );

    // Usuarios que aparecen en rutas o eventos
    const usuariosActivos = useMemo(() => {
        const ids = new Set<string>();

        rutas.forEach((r) => {
            if (r.id_creador) ids.add(String(r.id_creador));
        });

        eventos.forEach((e) => {
            if (e.createdBy) ids.add(String(e.createdBy));
            if (Array.isArray(e.participantes)) {
                e.participantes.forEach((p: string) => ids.add(String(p)));
            }
        });

        return ids.size;
    }, [rutas, eventos]);

    /* ===== HELPERS ===== */

    function getDeporteIdFromAny(obj: any): string | undefined {
        return (
            obj.tipo_deporte ||
            obj.deporte_id ||
            obj.deporte ||
            obj.deporteId ||
            obj.tipoDeporte ||
            obj.deporteFavorito ||
            undefined
        );
    }

    /* ===== GRÁFICOS ===== */

    // 1) Actividades (rutas + eventos) por deporte, AGRUPADAS
    const actividadesPorDeporte = useMemo(() => {
        const conteo: Record<string, number> = {};

        const acumular = (lista: any[]) => {
            lista.forEach((item) => {
                const id = getDeporteIdFromAny(item) ?? "sin-deporte";

                // Label base: uso catálogo si existe
                const rawLabel = deportesMap[id] ?? id;

                // Clave normalizada para agrupar (lowercase + trim)
                const key = String(rawLabel).trim().toLowerCase() || "sin-deporte";

                conteo[key] = (conteo[key] || 0) + 1;
            });
        };

        acumular(rutas as any[]);
        acumular(eventos as any[]);

        return Object.entries(conteo).map(([key, value]) => {
            const isSinDeporte = key === "sin-deporte";
            const pretty = isSinDeporte
                ? "Sin deporte"
                : key.charAt(0).toUpperCase() + key.slice(1);

            return {
                id: key,
                name: pretty,
                value,
            };
        });
    }, [rutas, eventos, deportesMap]);

    // 2) Rutas creadas por mes (usando fecha_creacion)
    const rutasPorMes = useMemo(() => {
        const map: Record<string, number> = {};

        rutas.forEach((r) => {
            if (!r.fecha_creacion) return;
            const d = new Date(r.fecha_creacion);
            if (isNaN(d.getTime())) return;

            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            map[key] = (map[key] || 0) + 1;
        });

        return Object.entries(map)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => {
                const [year, month] = key.split("-");
                const date = new Date(Number(year), Number(month) - 1, 1);
                const label = date.toLocaleDateString("es-CL", {
                    month: "short",
                    year: "2-digit",
                });
                return { key, label, value };
            });
    }, [rutas]);

    /* ===== LISTAS RECIENTES ===== */

    const ultimosUsuarios = useMemo(() => users.slice(0, 5), [users]);
    const ultimasRutas = useMemo(() => rutas.slice(0, 5), [rutas]);
    const ultimosEventos = useMemo(() => eventos.slice(0, 5), [eventos]);

    /* ===== RENDER ===== */

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Resumen general</h1>
                    <p className="text-sm text-gray-500">
                        Vista rápida del comportamiento de usuarios, rutas y eventos en RutaFit.
                    </p>
                </div>

                <button
                    onClick={loadData}
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                    <IoRefreshOutline className="text-lg" />
                    Actualizar
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <Kpi
                    icon={IoPeopleOutline}
                    title="Usuarios totales"
                    value={loading ? "—" : totalUsuarios.toString()}
                    helper={usuariosActivos ? `${usuariosActivos} con actividad reciente` : undefined}
                />
                <Kpi
                    icon={IoMapOutline}
                    title="Rutas creadas"
                    value={loading ? "—" : totalRutas.toString()}
                    helper={rutasPublicas ? `${rutasPublicas} públicas` : "Sin público definido"}
                />
                <Kpi
                    icon={IoCalendarOutline}
                    title="Eventos"
                    value={loading ? "—" : totalEventos.toString()}
                    helper={eventosProgramados ? `${eventosProgramados} programados` : undefined}
                />
                <Kpi
                    icon={IoGlobeOutline}
                    title="Cobertura deportiva"
                    value={loading ? "—" : actividadesPorDeporte.length.toString()}
                    helper="Deportes con actividad en la plataforma"
                />
                <Kpi
                    icon={IoPeopleOutline}
                    title="Usuarios activos (aprox.)"
                    value={loading ? "—" : usuariosActivos.toString()}
                    helper="Usuarios que han creado rutas o participado en eventos"
                />
            </div>

            {/* Gráficos principales */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Actividades por deporte */}
                <div className="border rounded-2xl bg-white p-4 md:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-700">
                            Actividades por deporte
                        </h2>
                        <span className="text-xs text-gray-400">Rutas + eventos</span>
                    </div>

                    {loading ? (
                        <div className="flex h-60 items-center justify-center text-gray-400">
                            Cargando datos...
                        </div>
                    ) : actividadesPorDeporte.length === 0 ? (
                        <div className="flex h-60 items-center justify-center text-gray-400">
                            Aún no hay actividades registradas.
                        </div>
                    ) : (
                        <div className="h-60">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={actividadesPorDeporte}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} />
                                    <YAxis fontSize={12} allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                        {actividadesPorDeporte.map((entry, idx) => (
                                            <Cell key={entry.id} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Rutas creadas por mes */}
                <div className="border rounded-2xl bg-white p-4 md:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-700">
                            Rutas creadas por mes
                        </h2>
                        <span className="text-xs text-gray-400">
                            Evolución temporal de creación de rutas
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex h-60 items-center justify-center text-gray-400">
                            Cargando datos...
                        </div>
                    ) : rutasPorMes.length === 0 ? (
                        <div className="flex h-60 items-center justify-center text-gray-400">
                            Aún no hay rutas con fecha registrada.
                        </div>
                    ) : (
                        <div className="h-60">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={rutasPorMes}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="label" fontSize={12} />
                                    <YAxis fontSize={12} allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                        {rutasPorMes.map((entry, idx) => (
                                            <Cell key={entry.key} fill={BAR_COLORS[(idx + 2) % BAR_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            {/* Actividad reciente */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Últimos usuarios */}
                <RecentCard title="Últimos usuarios">
                    {ultimosUsuarios.length === 0 ? (
                        <EmptyItem label="Sin usuarios registrados aún." />
                    ) : (
                        <ul className="space-y-2 text-sm">
                            {ultimosUsuarios.map((u) => (
                                <li
                                    key={u._id}
                                    className="flex items-center justify-between border-b border-gray-100 py-1.5 last:border-b-0"
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {u.nombre} {u.apellido}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {u.email}
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                        {u.deporteFavorito
                                            ? deportesMap[u.deporteFavorito] ?? u.deporteFavorito
                                            : "—"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </RecentCard>

                {/* Últimas rutas */}
                <RecentCard title="Últimas rutas creadas">
                    {ultimasRutas.length === 0 ? (
                        <EmptyItem label="Sin rutas registradas aún." />
                    ) : (
                        <ul className="space-y-2 text-sm">
                            {ultimasRutas.map((r) => {
                                const deporteId = getDeporteIdFromAny(r);
                                const deporteNombre =
                                    (deporteId && deportesMap[deporteId]) ||
                                    (r as any).deporteNombre ||
                                    (r as any).deporte ||
                                    "Deporte no definido";

                                return (
                                    <li
                                        key={r._id}
                                        className="flex items-center justify-between border-b border-gray-100 py-1.5 last:border-b-0"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {r.nombre_ruta || (r as any).nombre || "Ruta sin nombre"}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {deporteNombre}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            {r.distancia_km ? `${r.distancia_km.toFixed(1)} km` : ""}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </RecentCard>

                {/* Últimos eventos */}
                <RecentCard title="Últimos eventos">
                    {ultimosEventos.length === 0 ? (
                        <EmptyItem label="Sin eventos registrados aún." />
                    ) : (
                        <ul className="space-y-2 text-sm">
                            {ultimosEventos.map((e) => {
                                const nombreEvento =
                                    e.nombre_evento || (e as any).nombre || (e as any).titulo || "Evento sin nombre";

                                const deporteId = getDeporteIdFromAny(e);
                                const deporteNombre =
                                    (deporteId && deportesMap[deporteId]) ||
                                    (e as any).deporteNombre ||
                                    (e as any).deporte ||
                                    "Deporte no definido";

                                return (
                                    <li
                                        key={e._id}
                                        className="flex items-center justify-between border-b border-gray-100 py-1.5 last:border-b-0"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {nombreEvento}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {deporteNombre}
                                            </span>
                                        </div>
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-600">
                                            {e.estado || "Sin estado"}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </RecentCard>
            </div>
        </div>
    );
}

/* ================== COMPONENTES AUX ================== */

type KpiProps = {
    title: string;
    value: string;
    helper?: string;
    icon: React.ComponentType<{ className?: string }>;
};

function Kpi({ title, value, helper, icon: Icon }: KpiProps) {
    return (
        <div className="flex flex-col gap-2 rounded-2xl border bg-white/80 px-4 py-3 backdrop-blur">
            <div className="flex items-center justify-between">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {title}
                </div>
                <div className="rounded-full bg-emerald-50 p-2">
                    <Icon className="text-lg text-emerald-500" />
                </div>
            </div>
            <div className="text-2xl font-semibold tabular-nums">{value}</div>
            {helper && (
                <div className="text-[11px] text-gray-500">
                    {helper}
                </div>
            )}
        </div>
    );
}

type RecentCardProps = {
    title: string;
    children: React.ReactNode;
};

function RecentCard({ title, children }: RecentCardProps) {
    return (
        <div className="flex flex-col rounded-2xl border bg-white/80 p-4 backdrop-blur">
            <h2 className="mb-2 text-sm font-semibold text-gray-700">{title}</h2>
            <div className="max-h-56 flex-1 overflow-y-auto pr-1">{children}</div>
        </div>
    );
}

function EmptyItem({ label }: { label: string }) {
    return (
        <div className="flex h-16 items-center justify-center rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">
            {label}
        </div>
    );
}
