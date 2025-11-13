const API_BASE = "https://capstone-project-3-13xo.onrender.com/ms-rutafit-neg";

export interface Deporte {
    _id: string;
    nombre: string;
}

// Traer deportes para el panel
export async function fetchDeportes(): Promise<Deporte[]> {
    // 👇 si tu endpoint real es distinto (ej: /tipos-deporte), cámbialo aquí
    const res = await fetch(`${API_BASE}/tipos-deporte`);
    if (!res.ok) {
        throw new Error("No se pudieron obtener los deportes");
    }
    return res.json();
}
