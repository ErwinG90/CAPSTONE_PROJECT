// src/services/rutas.ts
const BASE_URL =
    "https://capstone-project-3-13xo.onrender.com/ms-rutafit-neg/rutas";

export interface Ruta {
    _id: string;
    id_creador: string;
    nombre_ruta: string;
    descripcion?: string;
    nivel_dificultad?: string;
    distancia_km?: number;
    tipo_deporte?: string;
    valoraciones: any[];
    promedio_valoracion: number;
    fecha_creacion?: string;
    publico: boolean;
}

// GET /rutas
export async function fetchRutas(): Promise<Ruta[]> {
    const res = await fetch(BASE_URL);
    if (!res.ok) {
        throw new Error("No se pudieron obtener las rutas");
    }
    return res.json();
}

// PUT /rutas/:id/publico   BODY: { "publico": true/false }
export async function setRutaPublico(idRuta: string, esPublica: boolean) {
    const body = { publico: esPublica }; // 👈 EXACTO COMO LO NECESITAS

    const res = await fetch(`${BASE_URL}/${idRuta}/publico`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const msg = await res.text().catch(() => "");
        console.error("Error setRutaPublico:", res.status, msg);
        throw new Error("No se pudo cambiar el estado público/privado");
    }

    return res.json();
}

// DELETE /rutas/:id?uid=TU_UID  + body { uid: "..." }
export async function deleteRuta(idRuta: string, idCreador: string) {
    const url = `${BASE_URL}/${idRuta}?uid=${encodeURIComponent(idCreador)}`;
    const body = { uid: idCreador };

    const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const msg = await res.text().catch(() => "");
        console.error("Error deleteRuta:", res.status, msg);
        throw new Error("No se pudo eliminar la ruta");
    }

    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        try {
            return await res.json();
        } catch {
            return null;
        }
    }
    return null;
}



