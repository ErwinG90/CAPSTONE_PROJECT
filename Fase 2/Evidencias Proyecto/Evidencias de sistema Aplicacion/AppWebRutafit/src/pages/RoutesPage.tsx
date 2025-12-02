// src/pages/RoutesPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
    fetchRutas,
    type Ruta,
    setRutaPublico,
    deleteRuta,
} from "../services/rutasService";
import { fetchUserByUid } from "../services/userByUid";
import {
    IoMapOutline,
    IoGlobeOutline,
    IoLockClosedOutline,
    IoStar,
    IoPeopleOutline,
    IoEyeOutline,
    IoTrashOutline,
} from "react-icons/io5";

import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface UsuarioDTO {
    uid: string;
    nombre?: string;
    apellido?: string;
    email?: string;
}

type SortField =
    | "nombre_ruta"
    | "creador"
    | "tipo_deporte"
    | "nivel_dificultad"
    | "distancia_km"
    | "valoraciones"
    | "promedio_valoracion"
    | "fecha_creacion"
    | "publico";

const COLORS = ["#22c55e", "#3b82f6", "#f97316", "#ef4444", "#a855f7", "#14b8a6"];

const PAGE_SIZE = 10;

export default function RoutesPage() {
    const [rutas, setRutas] = useState<Ruta[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [userMap, setUserMap] = useState<Record<string, UsuarioDTO>>({});
    const [selected, setSelected] = useState<Ruta | null>(null);

    const [sortField, setSortField] = useState<SortField>("fecha_creacion");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

    const [currentPage, setCurrentPage] = useState(1);

    // Cargar rutas
    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const data = await fetchRutas();
                setRutas(data);
            } catch (e: any) {
                setError(e?.message ?? "Error al cargar rutas");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // Cargar nombres de creadores según las rutas
    useEffect(() => {
        if (rutas.length === 0) return;

        const uids = Array.from(new Set(rutas.map((r) => r.id_creador)));
        const missing = uids.filter((uid) => !(uid in userMap));
        if (missing.length === 0) return;

        (async () => {
            const nuevos: Record<string, UsuarioDTO> = {};
            await Promise.all(
                missing.map(async (uid) => {
                    try {
                        const u = await fetchUserByUid(uid);
                        nuevos[uid] = u;
                    } catch {
                        nuevos[uid] = { uid };
                    }
                })
            );
            setUserMap((prev) => ({ ...prev, ...nuevos }));
        })();
    }, [rutas, userMap]);

    // Helpers
    const getCreadorNombre = (uid: string) => {
        const u = userMap[uid];
        if (!u) return uid;
        const nombreCompleto = `${u.nombre ?? ""} ${u.apellido ?? ""}`.trim();
        return nombreCompleto || u.email || uid;
    };

    // Filtro por texto
    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return rutas;

        return rutas.filter((r) => {
            const creador = getCreadorNombre(r.id_creador).toLowerCase();
            return (
                r.nombre_ruta.toLowerCase().includes(term) ||
                (r.tipo_deporte ?? "").toLowerCase().includes(term) ||
                (r.nivel_dificultad ?? "").toLowerCase().includes(term) ||
                creador.includes(term)
            );
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rutas, search, userMap]);

    // Ordenamiento
    const sorted = useMemo(() => {
        const data = [...filtered];

        const getValue = (r: Ruta): string | number => {
            switch (sortField) {
                case "nombre_ruta":
                    return r.nombre_ruta.toLowerCase();
                case "creador":
                    return getCreadorNombre(r.id_creador).toLowerCase();
                case "tipo_deporte":
                    return (r.tipo_deporte ?? "").toLowerCase();
                case "nivel_dificultad":
                    return (r.nivel_dificultad ?? "").toLowerCase();
                case "distancia_km":
                    return r.distancia_km ?? 0;
                case "valoraciones":
                    return r.valoraciones?.length ?? 0;
                case "promedio_valoracion":
                    return r.promedio_valoracion ?? 0;
                case "fecha_creacion":
                    return r.fecha_creacion
                        ? new Date(r.fecha_creacion).getTime()
                        : 0;
                case "publico":
                    return r.publico ? 1 : 0;
                default:
                    return 0;
            }
        };

        data.sort((a, b) => {
            const va = getValue(a);
            const vb = getValue(b);

            if (typeof va === "number" && typeof vb === "number") {
                return sortDirection === "asc" ? va - vb : vb - va;
            }

            const sa = String(va);
            const sb = String(vb);

            if (sa < sb) return sortDirection === "asc" ? -1 : 1;
            if (sa > sb) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });

        return data;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtered, sortField, sortDirection, userMap]);

    // Reset página cuando cambian filtros/orden
    useEffect(() => {
        setCurrentPage(1);
    }, [search, sortField, sortDirection]);

    // KPIs globales
    const stats = useMemo(() => {
        const publicas = rutas.filter((r) => r.publico).length;
        const privadas = rutas.filter((r) => !r.publico).length;
        const conRating = rutas.filter((r) => r.promedio_valoracion > 0);
        const ratingPromedio =
            conRating.length > 0
                ? conRating.reduce((acc, r) => acc + r.promedio_valoracion, 0) /
                conRating.length
                : 0;

        return {
            publicas,
            privadas,
            ratingPromedio,
            total: rutas.length,
        };
    }, [rutas]);

    // Datos para gráficos (usando rutas filtradas)
    const pieDeportesData = useMemo(() => {
        const counts: Record<string, number> = {};
        filtered.forEach((r) => {
            const key = r.tipo_deporte || "Sin deporte";
            counts[key] = (counts[key] ?? 0) + 1;
        });

        return Object.entries(counts).map(([name, value]) => ({
            name,
            value,
        }));
    }, [filtered]);

    const barRatingPorDeporte = useMemo(() => {
        const acc: Record<string, { suma: number; count: number }> = {};
        filtered.forEach((r) => {
            const key = r.tipo_deporte || "Sin deporte";
            if (!acc[key]) acc[key] = { suma: 0, count: 0 };
            acc[key].suma += r.promedio_valoracion ?? 0;
            acc[key].count += 1;
        });

        return Object.entries(acc).map(([deporte, { suma, count }]) => ({
            deporte,
            rating: count ? suma / count : 0,
        }));
    }, [filtered]);

    // Paginación
    const totalPages = Math.max(
        1,
        Math.ceil(sorted.length / PAGE_SIZE)
    );
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const pageData = sorted.slice(startIndex, endIndex);

    // Cambiar pública / privada
    const handleTogglePublico = async (ruta: Ruta) => {
        try {
            const nuevoEstado = !ruta.publico;
            await setRutaPublico(ruta._id, nuevoEstado);

            setRutas((prev) =>
                prev.map((r) =>
                    r._id === ruta._id ? { ...r, publico: nuevoEstado } : r
                )
            );
        } catch (e) {
            alert("No se pudo cambiar el estado público/privado");
        }
    };

    // Eliminar ruta
    const handleDeleteRuta = async (ruta: Ruta) => {
        if (
            !confirm(
                `¿Seguro que deseas eliminar la ruta "${ruta.nombre_ruta}"? Esta acción no se puede deshacer.`
            )
        ) {
            return;
        }

        try {
            await deleteRuta(ruta._id, ruta.id_creador);
            setRutas((prev) => prev.filter((r) => r._id !== ruta._id));
        } catch (e) {
            alert("No se pudo eliminar la ruta");
        }
    };

    // Cambiar orden cuando se hace click en el header
    const handleSortChange = (field: SortField) => {
        if (field === sortField) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const getSortIcon = (field: SortField) => {
        if (field !== sortField) return "↕";
        return sortDirection === "asc" ? "↑" : "↓";
    };

    // Exportar PDF (usa rutas filtradas + ordenadas)
    const handleExportPdf = () => {
        const doc = new jsPDF();

        doc.setFontSize(14);
        doc.text("Reporte de Rutas", 14, 18);

        autoTable(doc, {
            startY: 24,
            head: [
                [
                    "Ruta",
                    "Creador",
                    "Deporte",
                    "Nivel",
                    "Distancia (km)",
                    "Rating",
                    "Estado",
                    "Fecha",
                ],
            ],
            body: sorted.map((r) => {
                const fecha = r.fecha_creacion
                    ? new Date(r.fecha_creacion).toLocaleDateString("es-CL")
                    : "-";

                return [
                    r.nombre_ruta,
                    getCreadorNombre(r.id_creador),
                    r.tipo_deporte ?? "-",
                    r.nivel_dificultad ?? "-",
                    r.distancia_km?.toFixed(2) ?? "0.00",
                    (r.promedio_valoracion ?? 0).toFixed(1),
                    r.publico ? "Pública" : "Privada",
                    fecha,
                ];
            }),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [34, 197, 94] }, // verde
        });

        doc.save("reporte_rutas.pdf");
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-semibold">Reportes de Rutas</h1>
                    <p className="text-gray-500 text-sm">
                        Visualiza métricas, gráficos y listado detallado de las rutas creadas en RutaFit.
                    </p>
                </div>
                <span className="text-sm text-gray-500">
                    Total: {stats.total} rutas
                </span>
            </div>

            {/* Buscador + acciones */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4 items-stretch sm:items-center">
                <input
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    placeholder="Buscar por nombre, creador, deporte o dificultad…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                    <button className="px-3 py-2 border rounded-md text-sm">
                        Filtros
                    </button>
                    <button
                        onClick={handleExportPdf}
                        className="px-4 py-2 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition"
                    >
                        Exportar PDF
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* Públicas */}
                <div className="rounded-2xl p-4 shadow-sm bg-emerald-100 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/70 flex items-center justify-center">
                        <IoGlobeOutline className="text-emerald-600 text-xl" />
                    </div>
                    <div>
                        <div className="text-3xl font-bold leading-tight">
                            {stats.publicas}
                        </div>
                        <div className="text-sm text-gray-500">Públicas</div>
                    </div>
                </div>

                {/* Privadas */}
                <div className="rounded-2xl p-4 shadow-sm bg-gray-200 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/70 flex items-center justify-center">
                        <IoLockClosedOutline className="text-gray-700 text-xl" />
                    </div>
                    <div>
                        <div className="text-3xl font-bold leading-tight">
                            {stats.privadas}
                        </div>
                        <div className="text-sm text-gray-500">Privadas</div>
                    </div>
                </div>

                {/* Rating promedio */}
                <div className="rounded-2xl p-4 shadow-sm bg-yellow-100 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/70 flex items-center justify-center">
                        <IoStar className="text-yellow-500 text-xl" />
                    </div>
                    <div>
                        <div className="text-3xl font-bold leading-tight">
                            {stats.ratingPromedio.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-500">Rating promedio</div>
                    </div>
                </div>

                {/* Total (en vista actual) */}
                <div className="rounded-2xl p-4 shadow-sm bg-blue-100 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/70 flex items-center justify-center">
                        <IoMapOutline className="text-blue-600 text-xl" />
                    </div>
                    <div>
                        <div className="text-3xl font-bold leading-tight">
                            {filtered.length}
                        </div>
                        <div className="text-sm text-gray-500">
                            Rutas en la vista
                        </div>
                    </div>
                </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Torta deportes más usados */}
                <div className="bg-white rounded-xl shadow p-4">
                    <h2 className="text-sm font-semibold mb-2">
                        Distribución de rutas por deporte
                    </h2>
                    <p className="text-xs text-gray-500 mb-4">
                        Muestra qué deportes concentran la mayor cantidad de rutas creadas.
                    </p>
                    {pieDeportesData.length === 0 ? (
                        <div className="text-xs text-gray-400 text-center py-10">
                            No hay datos para mostrar.
                        </div>
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieDeportesData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label
                                    >
                                        {pieDeportesData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Bar: rating promedio por deporte */}
                <div className="bg-white rounded-xl shadow p-4">
                    <h2 className="text-sm font-semibold mb-2">
                        Rating promedio por deporte
                    </h2>
                    <p className="text-xs text-gray-500 mb-4">
                        Permite comparar la valoración promedio de las rutas según el deporte.
                    </p>
                    {barRatingPorDeporte.length === 0 ? (
                        <div className="text-xs text-gray-400 text-center py-10">
                            No hay datos para mostrar.
                        </div>
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barRatingPorDeporte}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="deporte" />
                                    <YAxis domain={[0, 5]} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar
                                        dataKey="rating"
                                        name="Rating promedio"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="px-4 py-3 text-sm text-gray-500 border-b flex items-center justify-between">
                    <span>Listado de rutas</span>
                    <span className="text-xs text-gray-400">
                        Mostrando {sorted.length === 0 ? 0 : startIndex + 1}–
                        {Math.min(endIndex, sorted.length)} de {sorted.length} rutas
                        filtradas
                    </span>
                </div>

                {loading && <div className="p-6">Cargando…</div>}
                {error && !loading && (
                    <div className="p-6 text-red-600">{error}</div>
                )}

                {!loading && !error && (
                    <>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr className="text-left">
                                    <th
                                        className="p-3 cursor-pointer select-none"
                                        onClick={() =>
                                            handleSortChange("nombre_ruta")
                                        }
                                    >
                                        Ruta{" "}
                                        <span className="text-xs text-gray-400">
                                            {getSortIcon("nombre_ruta")}
                                        </span>
                                    </th>
                                    <th
                                        className="p-3 cursor-pointer select-none"
                                        onClick={() =>
                                            handleSortChange("creador")
                                        }
                                    >
                                        Creador{" "}
                                        <span className="text-xs text-gray-400">
                                            {getSortIcon("creador")}
                                        </span>
                                    </th>
                                    <th className="p-3">Detalles</th>
                                    <th
                                        className="p-3 cursor-pointer select-none"
                                        onClick={() =>
                                            handleSortChange(
                                                "promedio_valoracion"
                                            )
                                        }
                                    >
                                        Rating{" "}
                                        <span className="text-xs text-gray-400">
                                            {getSortIcon(
                                                "promedio_valoracion"
                                            )}
                                        </span>
                                    </th>
                                    <th
                                        className="p-3 cursor-pointer select-none"
                                        onClick={() =>
                                            handleSortChange("publico")
                                        }
                                    >
                                        Estado{" "}
                                        <span className="text-xs text-gray-400">
                                            {getSortIcon("publico")}
                                        </span>
                                    </th>
                                    <th className="p-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageData.map((r) => {
                                    const fecha = r.fecha_creacion
                                        ? new Date(
                                            r.fecha_creacion
                                        ).toLocaleDateString("es-CL")
                                        : "-";

                                    const estadoClass = r.publico
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-gray-800 text-gray-100";

                                    return (
                                        <tr
                                            key={r._id}
                                            className="border-t hover:bg-gray-50 align-top"
                                        >
                                            {/* Ruta */}
                                            <td className="p-3">
                                                <div className="font-medium">
                                                    {r.nombre_ruta}
                                                </div>
                                                <div className="mt-1 flex gap-2 flex-wrap text-[11px]">
                                                    {r.tipo_deporte && (
                                                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                                            {r.tipo_deporte}
                                                        </span>
                                                    )}
                                                    {r.nivel_dificultad && (
                                                        <span className="px-2 py-0.5 rounded-full bg-gray-900 text-white">
                                                            {
                                                                r.nivel_dificultad
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Creador */}
                                            <td className="p-3">
                                                <div className="text-gray-800">
                                                    {getCreadorNombre(
                                                        r.id_creador
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {fecha}
                                                </div>
                                            </td>

                                            {/* Detalles */}
                                            <td className="p-3 text-sm">
                                                <div className="flex flex-col gap-1 text-gray-700">
                                                    <div>
                                                        {r.distancia_km?.toFixed(
                                                            2
                                                        )}{" "}
                                                        km
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <IoPeopleOutline />
                                                        <span>
                                                            {r.valoraciones
                                                                ?.length ?? 0}{" "}
                                                            valoraciones
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Rating */}
                                            <td className="p-3">
                                                <div className="flex items-center gap-1">
                                                    <IoStar className="text-yellow-500" />
                                                    <span className="font-semibold">
                                                        {r.promedio_valoracion !==
                                                            undefined &&
                                                            r.promedio_valoracion !==
                                                            null
                                                            ? r.promedio_valoracion.toFixed(
                                                                1
                                                            )
                                                            : "0.0"}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Estado */}
                                            <td className="p-3">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${estadoClass}`}
                                                >
                                                    {r.publico ? (
                                                        <>
                                                            <IoGlobeOutline />
                                                            <span>
                                                                Pública
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <IoLockClosedOutline />
                                                            <span>
                                                                Privada
                                                            </span>
                                                        </>
                                                    )}
                                                </span>
                                            </td>

                                            {/* Acciones */}
                                            <td className="p-3">
                                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                                    {/* Ver */}
                                                    <button
                                                        onClick={() =>
                                                            setSelected(r)
                                                        }
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition"
                                                    >
                                                        <IoEyeOutline className="text-sm" />
                                                        <span className="hidden sm:inline">
                                                            Ver
                                                        </span>
                                                    </button>

                                                    {/* Cambiar público / privado */}
                                                    <button
                                                        onClick={() =>
                                                            handleTogglePublico(
                                                                r
                                                            )
                                                        }
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition
                                                        ${r.publico
                                                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                                                            }`}
                                                    >
                                                        {r.publico ? (
                                                            <>
                                                                <IoLockClosedOutline className="text-sm" />
                                                                <span className="hidden sm:inline">
                                                                    Hacer
                                                                    privada
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <IoGlobeOutline className="text-sm" />
                                                                <span className="hidden sm:inline">
                                                                    Hacer
                                                                    pública
                                                                </span>
                                                            </>
                                                        )}
                                                    </button>

                                                    {/* Eliminar */}
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteRuta(r)
                                                        }
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium transition"
                                                    >
                                                        <IoTrashOutline className="text-sm" />
                                                        <span className="hidden sm:inline">
                                                            Eliminar
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {sorted.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="p-6 text-center text-gray-500"
                                        >
                                            No se encontraron rutas con el
                                            criterio de búsqueda.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Paginación */}
                        {sorted.length > 0 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-gray-600">
                                <span>
                                    Página {currentPage} de {totalPages}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.max(1, p - 1)
                                            )
                                        }
                                        disabled={currentPage === 1}
                                        className="px-2 py-1 border rounded disabled:opacity-40"
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.min(totalPages, p + 1)
                                            )
                                        }
                                        disabled={currentPage === totalPages}
                                        className="px-2 py-1 border rounded disabled:opacity-40"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal simple para "Ver" */}
            {selected && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
                        <h2 className="text-lg font-semibold mb-2">
                            {selected.nombre_ruta}
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Creada por {getCreadorNombre(selected.id_creador)}
                        </p>

                        <p className="text-sm mb-2">
                            <span className="font-semibold">Deporte: </span>
                            {selected.tipo_deporte ?? "-"}
                        </p>
                        <p className="text-sm mb-2">
                            <span className="font-semibold">Distancia: </span>
                            {selected.distancia_km?.toFixed(2) ?? 0} km
                        </p>
                        <p className="text-sm mb-4">
                            <span className="font-semibold">Descripción: </span>
                            {selected.descripcion || "Sin descripción."}
                        </p>

                        <button
                            className="w-full bg-black text-white rounded-xl py-2 text-sm hover:bg-gray-900"
                            onClick={() => setSelected(null)}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
