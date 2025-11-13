import React, { useEffect, useMemo, useState } from "react";
import { fetchEventos, type Evento } from "../services/eventos";
import { fetchUserByUid } from "../services/userByUid";
import { fetchDeportes } from "../services/deportes";
import { IoCalendarOutline, IoLocationOutline, IoPeopleOutline, IoClose, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoEyeOutline, } from "react-icons/io5";


// Formateo de fechas (ya recibimos Date)
function formatFecha(d: Date) {
    const fecha = new Intl.DateTimeFormat("es-CL", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(d);
    const hora = new Intl.DateTimeFormat("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(d);
    return { fecha, hora };
}

function formatSoloFecha(d: Date) {
    return new Intl.DateTimeFormat("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(d);
}

export default function Eventos() {
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Mapa uid -> nombre del usuario
    const [userMap, setUserMap] = useState<Record<string, string>>({});
    const [sportMap, setSportMap] = useState<Record<string, string>>({});

    // Evento seleccionado para el modal
    const [selected, setSelected] = useState<Evento | null>(null);

    // Cargar eventos
    useEffect(() => {
        fetchEventos()
            .then(setEventos)
            .catch((e) => setError(e.message ?? "Error al cargar"))
            .finally(() => setLoading(false));
    }, []);

    // Cargar nombres de creadores según los eventos
    useEffect(() => {
        if (eventos.length === 0) return;

        const uids = Array.from(new Set(eventos.map((e) => e.createdBy)));
        const missing = uids.filter((uid) => !(uid in userMap));
        if (missing.length === 0) return;

        (async () => {
            const nuevos: Record<string, string> = {};

            await Promise.all(
                missing.map(async (uid) => {
                    try {
                        const u = await fetchUserByUid(uid);
                        const nombreCompleto =
                            `${u?.nombre ?? ""} ${u?.apellido ?? ""}`.trim() ||
                            u?.email ||
                            uid;
                        nuevos[uid] = nombreCompleto;
                    } catch {
                        nuevos[uid] = uid;
                    }
                })
            );

            setUserMap((prev) => ({ ...prev, ...nuevos }));
        })();
    }, [eventos, userMap]);


    //carga los deportes
    useEffect(() => {
        async function loadSports() {
            try {
                const deportes = await fetchDeportes();
                const map: Record<string, string> = {};

                deportes.forEach((d) => {
                    map[d._id] = d.nombre; // _id y nombre 
                });

                setSportMap(map);
            } catch {
                setSportMap({});
            }
        }

        loadSports();
    }, []);

    // --- Ajustar estado según la fecha actual ---
    const eventosProcesados = useMemo(() => {
        const now = new Date();
        return eventos.map((e) => {
            const fecha = new Date(e.fecha_evento);
            let estadoAjustado = e.estado;

            if (e.estado !== "cancelado") {
                if (fecha < now) {
                    estadoAjustado = "completado";
                } else {
                    estadoAjustado = "programado";
                }
            }

            return { ...e, estado: estadoAjustado };
        });
    }, [eventos]);

    // Filtrado local (título, lugar, estado, nombre creador)
    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return eventosProcesados;

        return eventosProcesados.filter((e) => {
            const creadorNombre = (userMap[e.createdBy] ?? "").toLowerCase();
            return (
                e.nombre_evento.toLowerCase().includes(term) ||
                e.lugar.toLowerCase().includes(term) ||
                e.estado.toLowerCase().includes(term) ||
                creadorNombre.includes(term)
            );
        });
    }, [eventosProcesados, search, userMap]);

    // KPIs
    const stats = {
        proximos: eventosProcesados.filter((e) => e.estado === "programado").length,
        completados: eventosProcesados.filter((e) => e.estado === "completado").length,
        cancelados: eventosProcesados.filter((e) => e.estado === "cancelado").length,
        participantes: eventosProcesados.reduce(
            (acc, e) => acc + e.participantes.length,
            0
        ),
        total: eventosProcesados.length,
    };

    // Helpers para el modal
    const getCreadorNombre = (uid: string) => userMap[uid] ?? uid;

    const getOcupacion = (e: Evento) =>
        e.max_participantes > 0
            ? Math.round((e.participantes.length / e.max_participantes) * 100)
            : 0;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-semibold">Gestión de Eventos</h1>
                    <p className="text-gray-500">
                        Administra los eventos deportivos de la plataforma
                    </p>
                </div>
                <span className="text-sm text-gray-500">
                    {stats.total} eventos totales
                </span>
            </div>

            {/* Buscador */}
            <div className="flex gap-2 mb-4">
                <input
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="Buscar por título, creador, estado o ubicación…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button className="px-3 py-2 border rounded-md">Filtros</button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* Próximos */}
                <div className="rounded-2xl p-4 shadow-sm bg-blue-100 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/70 flex items-center justify-center">
                        <IoCalendarOutline className="text-blue-600 text-xl" />
                    </div>
                    <div>
                        <div className="text-3xl font-bold leading-tight">{stats.proximos}</div>
                        <div className="text-sm text-gray-500">Próximos</div>
                    </div>
                </div>

                {/* Completados */}
                <div className="rounded-2xl p-4 shadow-sm bg-green-100 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/70 flex items-center justify-center">
                        <IoCheckmarkCircleOutline className="text-green-600 text-xl" />
                    </div>
                    <div>
                        <div className="text-3xl font-bold leading-tight">{stats.completados}</div>
                        <div className="text-sm text-gray-500">Completados</div>
                    </div>
                </div>

                {/* Participantes */}
                <div className="rounded-2xl p-4 shadow-sm bg-orange-100 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/70 flex items-center justify-center">
                        <IoPeopleOutline className="text-orange-500 text-xl" />
                    </div>
                    <div>
                        <div className="text-3xl font-bold leading-tight">{stats.participantes}</div>
                        <div className="text-sm text-gray-500">Participantes</div>
                    </div>
                </div>

                {/* Cancelados */}
                <div className="rounded-2xl p-4 shadow-sm bg-red-100 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/70 flex items-center justify-center">
                        <IoCloseCircleOutline className="text-red-500 text-xl" />
                    </div>
                    <div>
                        <div className="text-3xl font-bold leading-tight">{stats.cancelados}</div>
                        <div className="text-sm text-gray-500">Cancelados</div>
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="px-4 py-3 text-sm text-gray-500 border-b">
                    Lista de Eventos
                </div>

                {loading && <div className="p-6">Cargando…</div>}
                {error && !loading && <div className="p-6 text-red-600">{error}</div>}

                {!loading && !error && (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr className="text-left">
                                <th className="p-3">Evento</th>
                                <th className="p-3">Creador</th>
                                <th className="p-3">Fecha y Hora</th>
                                <th className="p-3">Participantes</th>
                                <th className="p-3">Estado</th>
                                <th className="p-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((e) => {
                                const { fecha, hora } = formatFecha(e.fecha_evento);
                                const cupo = `${e.participantes.length} / ${e.max_participantes}`;
                                const pct = Math.min(
                                    100,
                                    Math.round(
                                        (e.participantes.length /
                                            Math.max(1, e.max_participantes)) *
                                        100
                                    )
                                );
                                const estadoClass =
                                    e.estado === "programado"
                                        ? "bg-blue-100 text-blue-700"
                                        : e.estado === "completado"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700";

                                return (
                                    <tr key={e._id} className="border-t hover:bg-gray-50">
                                        <td className="p-3">
                                            <div className="font-medium">{e.nombre_evento}</div>
                                            <div className="text-gray-500 text-xs">{e.lugar}</div>
                                        </td>

                                        <td className="p-3 text-gray-700">
                                            {getCreadorNombre(e.createdBy)}
                                        </td>

                                        <td className="p-3">
                                            <div className="text-gray-800">{fecha}</div>
                                            <div className="text-gray-500 text-xs">{hora}</div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex flex-col gap-1">
                                                {/* Línea con ícono + números */}
                                                <div className="flex items-center gap-1 text-sm">
                                                    <IoPeopleOutline className="text-gray-500" />
                                                    <span className="font-semibold text-gray-900">
                                                        {e.participantes.length}
                                                    </span>
                                                    <span className="text-gray-400">/ {e.max_participantes}</span>
                                                </div>

                                                {/* Barra de ocupación */}
                                                <div className="w-28 h-2 bg-gray-200 rounded-full">
                                                    <div
                                                        className="h-2 rounded-full bg-gray-900"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs ${estadoClass}`}
                                            >
                                                {e.estado.charAt(0).toUpperCase() + e.estado.slice(1)}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <button
                                                className="px-3 py-1 border rounded-md hover:bg-gray-100 flex items-center gap-1 text-sm"
                                                onClick={() => setSelected(e)}
                                            >
                                                <IoEyeOutline className="text-gray-600" />
                                                <span>Ver</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-6 text-center text-gray-500">
                                        Sin resultados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* MODAL DE DETALLE */}
            {selected && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 relative">
                        {/* Botón cerrar (X) */}
                        <button
                            className="absolute top-4 right-4 text-gray-500 hover:text-black text-xl"
                            onClick={() => setSelected(null)}
                        >
                            <IoClose />
                        </button>

                        <h2 className="text-xl font-semibold mb-4">Detalles del Evento</h2>

                        <h3 className="text-lg font-semibold">
                            {selected.nombre_evento}
                        </h3>
                        <p className="text-sm text-gray-500 mb-3">
                            Creado por {getCreadorNombre(selected.createdBy)}
                        </p>

                        {/* Chips de estado */}
                        <div className="flex gap-2 mb-4">
                            <span className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                                {sportMap[selected.deporte_id] ?? selected.deporte_id}
                            </span>
                            <span
                                className={`px-3 py-1 text-xs rounded-full ${selected.estado === "programado"
                                    ? "bg-blue-100 text-blue-700"
                                    : selected.estado === "completado"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                            >
                                {selected.estado === "programado"
                                    ? "Próximo"
                                    : selected.estado.charAt(0).toUpperCase() +
                                    selected.estado.slice(1)}
                            </span>
                        </div>

                        {/* Info principal */}
                        <div className="space-y-2 text-sm mb-4">
                            <div className="flex items-center gap-2">
                                <IoCalendarOutline className="text-gray-500" />
                                <span>
                                    {formatFecha(selected.fecha_evento).fecha} a las{" "}
                                    {formatFecha(selected.fecha_evento).hora}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <IoLocationOutline className="text-gray-500" />
                                <span>{selected.lugar}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <IoPeopleOutline className="text-gray-500" />
                                <span>
                                    {selected.participantes.length} / {selected.max_participantes}{" "}
                                    participantes
                                </span>
                            </div>
                        </div>
                        {/* Descripción */}
                        <div className="mb-4">
                            <h4 className="font-semibold text-sm mb-1">Descripción</h4>
                            <p className="text-sm text-gray-700">
                                {selected.descripcion || "Sin descripción."}
                            </p>
                        </div>

                        {/* Creado / Ocupación */}
                        <div className="flex justify-between text-sm mb-6">
                            <div>
                                <p className="font-semibold">Creado</p>
                                <p className="text-gray-600">
                                    {formatSoloFecha(selected.createdAt)}
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold">Ocupación</p>
                                <p className="text-gray-600">{getOcupacion(selected)}%</p>
                            </div>
                        </div>

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
