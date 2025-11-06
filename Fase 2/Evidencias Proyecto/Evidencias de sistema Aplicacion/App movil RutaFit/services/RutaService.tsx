import axios from "axios";
import { API_BASE_URL } from "../src/Constants";
import type { Ruta } from "../interface/Ruta";

export type ValoracionAPI = {
  id_usuario: string;
  puntuacion: number;
  fecha: string;
  usuario?: { uid?: string; nombre?: string; avatar?: string | null };
};

export class RutaService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async crearRuta(ruta: Ruta): Promise<Ruta> {
    try {
      const { data } = await axios.post(`${this.baseUrl}/rutas`, ruta);
      return data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "No se pudo guardar la ruta");
    }
  }

  async getRutas(): Promise<Ruta[]> {
    try {
      const { data } = await axios.get(`${this.baseUrl}/rutas`);
      return data;
    } catch {
      throw new Error("No se pudieron cargar las rutas");
    }
  }

  /** 🔹 Obtener SOLO las rutas creadas por el usuario logeado */
  async getMisRutas(uid: string, page = 1, limit = 50, q?: string): Promise<Ruta[]> {
    try {
      if (!uid) throw new Error("UID requerido para obtener tus rutas");
      const url =
        `${this.baseUrl}/rutas/mias?uid=${encodeURIComponent(uid)}&page=${page}&limit=${limit}` +
        (q ? `&q=${encodeURIComponent(q)}` : "");
      const { data } = await axios.get(url);
      return data?.data ?? data; // tu API devuelve { data: [...] }
    } catch {
      throw new Error("No se pudieron cargar tus rutas");
    }
  }

  async getValoracionesRuta(rutaId: string): Promise<ValoracionAPI[]> {
    const url = `${this.baseUrl}/rutas/${rutaId}/valoraciones`;
    const { data } = await axios.get(url);
    return Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  }

  async calificarRuta(rutaId: string, idUsuario: string, puntuacion: number): Promise<void> {
    const url = `${this.baseUrl}/rutas/${rutaId}/valoraciones`;
    await axios.post(url, { id_usuario: idUsuario, puntuacion });
  }

  /**Eliminar ruta (solo creador) */
  async eliminarRuta(rutaId: string, uid: string) {
    const id = String(rutaId || "").trim();
    const u = encodeURIComponent(String(uid || "").trim());
    const url = `${this.baseUrl}/rutas/${id}?uid=${u}`;
    return axios.delete(url);
  }

  /** Populares con fallback silencioso y logs solo en dev */
  async getRutasPopulares(limit = 20, minRatings = 1) {
    const urlServer = `${this.baseUrl}/rutas/populares?limit=${limit}&minRatings=${minRatings}`;

    if (__DEV__) console.debug("GET POPULARES:", urlServer);
    try {
      const { data } = await axios.get(urlServer);
      // si el backend devuelve { data: [...] } o directamente [...]
      return Array.isArray(data?.data) ? data.data : data;
    } catch (err: any) {
      if (__DEV__) {
        const st = err?.response?.status;
        console.debug("GET POPULARES falló en API", st ?? "", err?.message ?? "");
      }

      // 🔁 Fallback: filtrar en cliente desde /rutas
      try {
        const { data: all } = await axios.get(`${this.baseUrl}/rutas`);
        const list = (Array.isArray(all) ? all : [])
          .filter((r: any) => {
            const count = Array.isArray(r.valoraciones) ? r.valoraciones.length : 0;
            const avg = typeof r.promedio_valoracion === "number" ? r.promedio_valoracion : 0;
            return count >= minRatings && avg > 0;
          })
          .sort((a: any, b: any) => {
            const aAvg = a.promedio_valoracion ?? 0;
            const bAvg = b.promedio_valoracion ?? 0;
            if (bAvg !== aAvg) return bAvg - aAvg;
            const aCount = (a.valoraciones?.length) ?? 0;
            const bCount = (b.valoraciones?.length) ?? 0;
            if (bCount !== aCount) return bCount - aCount;
            // más reciente primero
            const aDate = new Date(a.fecha_creacion ?? 0).getTime();
            const bDate = new Date(b.fecha_creacion ?? 0).getTime();
            return bDate - aDate;
          })
          .slice(0, limit);

        return list;
      } catch {
        throw new Error("No se pudieron cargar las rutas populares");
      }
    }   
  }
}

export const rutaService = new RutaService();
