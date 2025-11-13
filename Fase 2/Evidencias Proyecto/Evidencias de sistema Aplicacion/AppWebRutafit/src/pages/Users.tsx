import React, { useEffect, useMemo, useState } from "react";
import { fetchUsers, type UserBasic, type UsersResponse } from "../services/users";
import { fetchDeportes, fetchNiveles } from "../services/catalogs";
import { IoPeopleOutline, IoClose } from "react-icons/io5";

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
  LabelList,
} from "recharts";

/** Paleta de colores para barras */
const COLORS = ["#22c55e", "#3b82f6", "#f97316", "#ef4444", "#a855f7", "#14b8a6"];

export default function Users() {
  // Datos
  const [rows, setRows] = useState<UserBasic[]>([]);
  const [total, setTotal] = useState(0);

  // Catálogos (id -> nombre)
  const [deportesMap, setDeportesMap] = useState<Record<string, string>>({});
  const [nivelesMap, setNivelesMap] = useState<Record<string, string>>({});

  // UI/estado
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Usuario seleccionado para el detalle
  const [selected, setSelected] = useState<UserBasic | null>(null);

  // Cargar catálogos 1 sola vez
  useEffect(() => {
    let mounted = true;
    Promise.all([fetchDeportes(), fetchNiveles()])
      .then(([d, n]) => {
        if (!mounted) return;
        setDeportesMap(d);
        setNivelesMap(n);
      })
      .catch(console.error);
    return () => {
      mounted = false;
    };
  }, []);

  // Cargar usuarios
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    fetchUsers({ search, page, pageSize })
      .then((data: UsersResponse) => {
        if (!mounted) return;
        setRows(data.rows);
        setTotal(data.total);
      })
      .catch((e: unknown) => {
        console.error(e);
        if (mounted) setError((e as any)?.message ?? "Error al cargar usuarios");
      })
      .finally(() => setLoading(false));

    return () => {
      mounted = false;
    };
  }, [search, page]);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  /* ========= DATOS PARA GRÁFICOS ========= */

  // Dona por género
  const genderData = useMemo(
    () => [
      {
        name: "hombre",
        value: rows.filter((u) => u.genero?.toLowerCase() === "hombre").length,
      },
      {
        name: "mujer",
        value: rows.filter((u) => u.genero?.toLowerCase() === "mujer").length,
      },
    ],
    [rows]
  );

  // Barras por deporte favorito (Top 5)
  const sportData = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach((u) => {
      if (!u.deporteFavorito) return;
      const id = u.deporteFavorito;
      counts[id] = (counts[id] ?? 0) + 1;
    });

    const list = Object.entries(counts).map(([id, value]) => ({
      name: deportesMap[id] ?? id,
      value,
    }));

    list.sort((a, b) => b.value - a.value);
    return list.slice(0, 5);
  }, [rows, deportesMap]);

  // Barras por nivel de experiencia
  const experienceData = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach((u) => {
      if (!u.nivelExperiencia) return;
      const id = u.nivelExperiencia;
      counts[id] = (counts[id] ?? 0) + 1;
    });

    const list = Object.entries(counts).map(([id, value]) => ({
      name: nivelesMap[id] ?? id,
      value,
    }));

    return list;
  }, [rows, nivelesMap]);

  // Barras de nuevos usuarios por mes
  const monthlyData = useMemo(() => {
    const map: Record<string, number> = {};

    rows.forEach((u) => {
      if (!u.fechaRegistro) return;
      const d = new Date(u.fechaRegistro);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = (map[key] ?? 0) + 1;
    });

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => {
        const [year, month] = key.split("-");
        const date = new Date(Number(year), Number(month) - 1, 1);
        const label = date.toLocaleDateString("es-CL", {
          month: "2-digit",
          year: "numeric",
        });
        return { key, label, value };
      });
  }, [rows]);

  /* ========= RENDER ========= */

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      {/* Header + búsqueda */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-semibold">Gestión de Usuarios</h1>
          <p className="text-gray-500">Administra los usuarios de la plataforma.</p>
        </div>
        <div className="flex-1 max-w-md flex gap-2">
          <input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Buscar por nombre, apellido o email…"
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
          <button className="px-3 py-2 border rounded-md text-sm">Filtros</button>
        </div>
      </div>

      {/* KPI total usuarios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-2">
        <div className="rounded-2xl p-4 shadow-sm bg-blue-100 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/70 flex items-center justify-center">
            <IoPeopleOutline className="text-blue-600 text-xl" />
          </div>
          <div>
            <div className="text-3xl font-bold leading-tight">{total}</div>
            <div className="text-sm text-gray-500">Usuarios totales</div>
          </div>
        </div>
      </div>

      {/* ===== FILA 1 DE GRÁFICOS ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Dona por género */}
        <div className="rounded-2xl bg-white shadow p-4 overflow-visible">
          <h3 className="text-sm font-semibold mb-2">Usuarios por género</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 10, right: 10, bottom: 40, left: 10 }}>
                <Pie
                  data={genderData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="55%"
                  outerRadius="80%"
                  paddingAngle={3}
                >
                  {genderData.map((entry, idx) => (
                    <Cell
                      key={entry.name}
                      fill={idx === 0 ? "#3b82f6" : "#22c55e"} // azul / verde
                    />
                  ))}
                  <LabelList dataKey="value" position="outside" />
                </Pie>
                <Tooltip formatter={(val) => [`${val} usuarios`, "Usuarios"]} />
                <Legend verticalAlign="bottom" height={32} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Barras por deporte favorito */}
        <div className="rounded-2xl bg-white shadow p-4">
          <h3 className="text-sm font-semibold mb-2">
            Usuarios por deporte favorito (Top 5)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sportData}
                margin={{ top: 30, right: 20, bottom: 30, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" angle={-10} textAnchor="end" height={40} />
                <YAxis
                  allowDecimals={false}
                  domain={[0, (dataMax: number) => dataMax + 1]}
                />
                <Tooltip formatter={(val) => [`${val} usuarios`, "Usuarios"]} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {sportData.map((entry, idx) => (
                    <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                  ))}
                  <LabelList dataKey="value" position="top" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ===== EXPERIENCIA ===== */}
      <div className="mt-4 rounded-2xl bg-white shadow p-4">
        <h3 className="text-sm font-semibold mb-2">Usuarios por nivel de experiencia</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={experienceData}
              margin={{ top: 30, right: 20, bottom: 30, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" height={30} />
              <YAxis
                allowDecimals={false}
                domain={[0, (dataMax: number) => dataMax + 1]}
              />
              <Tooltip formatter={(val) => [`${val} usuarios`, "Usuarios"]} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {experienceData.map((entry, idx) => (
                  <Cell key={entry.name} fill={COLORS[(idx + 2) % COLORS.length]} />
                ))}
                <LabelList dataKey="value" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===== NUEVOS USUARIOS POR MES ===== */}
      <div className="mt-4 rounded-2xl bg-white shadow p-4">
        <h3 className="text-sm font-semibold mb-2">Nuevos usuarios por mes</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 30, right: 20, bottom: 30, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" height={30} />
              <YAxis
                allowDecimals={false}
                domain={[0, (dataMax: number) => dataMax + 1]}
              />
              <Tooltip
                formatter={(val) => [`${val} nuevos usuarios`, "Nuevos usuarios"]}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#3b82f6">
                <LabelList dataKey="value" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow overflow-hidden mt-4">
        <div className="px-4 py-3 text-sm text-gray-500 border-b">
          Lista de Usuarios
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <Th>Usuario</Th>
              <Th>Género</Th>
              <Th>Deporte</Th>
              <Th>Nivel</Th>
              <Th>Fecha Registro</Th>
              <Th>Edad</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-400">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-400">
                  Sin resultados
                </td>
              </tr>
            )}
            {!loading &&
              rows
                .filter((u) => {
                  if (!search.trim()) return true;
                  const term = search.trim().toLowerCase();
                  return (
                    u.nombre?.toLowerCase().includes(term) ||
                    u.apellido?.toLowerCase().includes(term) ||
                    u.email?.toLowerCase().includes(term)
                  );
                })
                .map((u) => (
                  <tr key={u._id} className="border-t hover:bg-gray-50">
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                          {initials(u.nombre, u.apellido)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            {u.nombre} {u.apellido}
                          </div>
                          <div className="text-gray-500">{u.email}</div>
                        </div>
                      </div>
                    </Td>
                    <Td>{u.genero ?? "—"}</Td>
                    <Td>
                      {deportesMap[u.deporteFavorito ?? ""] ??
                        (u.deporteFavorito ?? "—")}
                    </Td>
                    <Td>
                      {nivelesMap[u.nivelExperiencia ?? ""] ??
                        (u.nivelExperiencia ?? "—")}
                    </Td>
                    <Td>{formatDate(u.fechaRegistro) ?? "—"}</Td>
                    <Td>{calcEdad(u.fechaNacimiento) ?? "—"}</Td>
                    <Td>
                      <button
                        className="px-3 py-1.5 rounded-lg border text-xs hover:bg-gray-100"
                        onClick={() => setSelected(u)}
                      >
                        Ver detalle
                      </button>
                    </Td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-end gap-2 mt-4">
        <button
          className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Anterior
        </button>
        <span className="text-sm text-gray-600">
          Página {page} de {pages}
        </span>
        <button
          className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
          disabled={page >= pages}
          onClick={() => setPage((p) => Math.min(pages, p + 1))}
        >
          Siguiente
        </button>
      </div>

      {/* MODAL DETALLE USUARIO */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-black text-xl"
              onClick={() => setSelected(null)}
            >
              <IoClose />
            </button>

            <h2 className="text-lg font-semibold mb-4">Detalle de usuario</h2>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">
                {initials(selected.nombre, selected.apellido)}
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  {selected.nombre} {selected.apellido}
                </div>
                <div className="text-sm text-gray-500">{selected.email}</div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold">Género:</span>{" "}
                {selected.genero ?? "—"}
              </p>
              <p>
                <span className="font-semibold">Edad:</span>{" "}
                {calcEdad(selected.fechaNacimiento) ?? "—"}
              </p>
              <p>
                <span className="font-semibold">Deporte favorito:</span>{" "}
                {deportesMap[selected.deporteFavorito ?? ""] ??
                  selected.deporteFavorito ??
                  "—"}
              </p>
              <p>
                <span className="font-semibold">Nivel de experiencia:</span>{" "}
                {nivelesMap[selected.nivelExperiencia ?? ""] ??
                  selected.nivelExperiencia ??
                  "—"}
              </p>
              <p>
                <span className="font-semibold">Fecha de registro:</span>{" "}
                {formatDate(selected.fechaRegistro) ?? "—"}
              </p>
            </div>

            <button
              className="mt-6 w-full bg-black text-white rounded-xl py-2 text-sm hover:bg-gray-900"
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

/* ---- Helpers UI ---- */
function Th({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${className}`}
    >
      {children}
    </th>
  );
}
function Td({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

/* ---- Helpers de datos ---- */
function initials(n?: string, a?: string) {
  const s = `${n ?? ""} ${a ?? ""}`.trim().split(/\s+/);
  return (s[0]?.[0] ?? "") + (s[1]?.[0] ?? "");
}
function formatDate(iso?: string) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}
function calcEdad(iso?: string) {
  if (!iso) return null;
  try {
    const nacimiento = new Date(iso);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  } catch {
    return null;
  }
}
