import { deporteService } from "../../services/DeporteService";
import { nivelService } from "../../services/NivelService";

// Caches en memoria
const deporteNameById = new Map<string, string>();
const nivelNameById = new Map<string, string>();

export const isMongoId = (v: any) => typeof v === "string" && /^[a-f\d]{24}$/i.test(v);

// Si el valor ya trae nombre, úsalo
export const getNombreInline = (v: any) => {
    if (!v) return undefined;
    if (typeof v === "string" && !isMongoId(v)) return v;        // ya es un nombre
    if (typeof v === "object" && v?.nombre) return v.nombre;     // objeto { _id, nombre }
    return undefined;
};

/** Precarga catálogos para poder resolver nombres sin pedir por ID (evita 404). */
export async function preloadCatalogos() {
    try {
        const [deps, nivs] = await Promise.all([
            deporteService.getDeportes().catch(() => []),
            nivelService.getNiveles().catch(() => []),
        ]);
        deps.forEach((d: any) => {
            const id = String(d?._id || "");
            const nombre = String(d?.nombre || "");
            if (id && nombre) deporteNameById.set(id, nombre);
        });
        nivs.forEach((n: any) => {
            const id = String(n?._id || "");
            const nombre = String(n?.nombre || "");
            if (id && nombre) nivelNameById.set(id, nombre);
        });
    } catch {
        // silencioso: si falla seguimos con inline/fallback
    }
}

/** Resuelve nombre de deporte sin golpear /:id (usa catálogo precargado). */
export async function resolveNombreDeporte(val?: any) {
    const inline = getNombreInline(val);
    if (inline) return inline;

    const id = typeof val === "string" ? val : val?._id;
    if (!id) return undefined;

    // Si tenemos el catálogo precargado, resolvemos; si no, devolvemos el id legible.
    const nombre = deporteNameById.get(String(id));
    return nombre ?? String(id);
}

/** Resuelve nombre de nivel sin golpear /:id (usa catálogo precargado). */
export async function resolveNombreNivel(val?: any) {
    const inline = getNombreInline(val);
    if (inline) return inline;

    const id = typeof val === "string" ? val : val?._id;
    if (!id) return undefined;

    const nombre = nivelNameById.get(String(id));
    return nombre ?? String(id);
}

/** Devuelve un perfil con campos bonitos en `_display` */
export async function enrichProfile(raw: any) {
    if (!raw) return raw;
    const [depNombre, nivNombre] = await Promise.all([
        resolveNombreDeporte(raw.deporteFavorito),
        resolveNombreNivel(raw.nivelExperiencia),
    ]);
    return {
        ...raw,
        _display: {
            deporteFavoritoNombre: depNombre,
            nivelExperienciaNombre: nivNombre,
        },
    };
}
