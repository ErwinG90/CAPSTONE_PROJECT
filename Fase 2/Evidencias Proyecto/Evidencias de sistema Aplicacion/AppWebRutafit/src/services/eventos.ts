const API_BASE = "https://capstone-project-3-13xo.onrender.com/ms-rutafit-neg";

export interface Evento {
    _id: string;
    nombre_evento: string;
    deporte_id: string;
    lugar: string;
    fecha_evento: Date;
    max_participantes: number;
    descripcion: string;
    createdBy: string;
    participantes: string[];
    estado: string;
    createdAt: Date;
}

// --- Helpers de normalización ---
function toId(rawId: any): string {
    if (rawId?.$oid) return String(rawId.$oid);
    if (typeof rawId === "object" && rawId?.toString) {
        const s = rawId.toString();
        const m = s.match(/[a-f0-9]{24}/i);
        return m ? m[0] : s;
    }
    return String(rawId ?? "");
}

function toDate(v: any): Date {
    return v instanceof Date ? v : new Date(v);
}

function toNum(v: any): number {
    return typeof v === "number" ? v : Number(v ?? 0);
}

function toEvento(raw: any): Evento {
    return {
        _id: toId(raw._id),
        nombre_evento: String(raw.nombre_evento ?? ""),
        deporte_id: String(raw.deporte_id ?? ""),
        lugar: String(raw.lugar ?? ""),
        fecha_evento: toDate(raw.fecha_evento),
        max_participantes: toNum(raw.max_participantes),
        descripcion: String(raw.descripcion ?? ""),
        createdBy: String(raw.createdBy ?? ""),
        participantes: Array.isArray(raw.participantes)
            ? raw.participantes.map(String)
            : [],
        estado: String(raw.estado ?? "programado"),
        createdAt: toDate(raw.createdAt),
    };
}

// --- GET /eventos ---
export async function fetchEventos(): Promise<Evento[]> {
    const res = await fetch(`${API_BASE}/eventos`);
    if (!res.ok) throw new Error("No se pudieron obtener los eventos");
    const data = await res.json();
    return (Array.isArray(data) ? data : []).map(toEvento);
}