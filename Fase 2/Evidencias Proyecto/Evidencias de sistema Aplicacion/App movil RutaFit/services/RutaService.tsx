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
    } catch (error) {
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
    } catch (error) {
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
    return axios.delete(url); // devuelve la promesa; el caller decide qué hacer
  }

  
  async getRutasPopulares(limit = 20, minRatings = 1) {
    const url = `${this.baseUrl}/rutas/populares?limit=${limit}&minRatings=${minRatings}`;
    const { data } = await axios.get(url);
    return Array.isArray(data?.data) ? data.data : data;
  }

}

export const rutaService = new RutaService();
