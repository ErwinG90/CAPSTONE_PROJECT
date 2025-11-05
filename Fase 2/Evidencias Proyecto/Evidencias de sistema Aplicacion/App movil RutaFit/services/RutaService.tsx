// services/RutaService.ts
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
    this.baseUrl = API_BASE_URL; // ej: http://localhost:3000/ms-rutafit-neg
  }

  /** Crear una ruta */
  async crearRuta(ruta: Ruta): Promise<Ruta> {
    try {
      const { data } = await axios.post(`${this.baseUrl}/rutas`, ruta);
      return data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "No se pudo guardar la ruta");
    }
  }

  /** Listar todas las rutas (público) */
  async getRutas(): Promise<Ruta[]> {
    try {
      const { data } = await axios.get(`${this.baseUrl}/rutas`);
      return data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "No se pudieron cargar las rutas");
    }
  }

  /** Listar SOLO rutas creadas por el usuario */
  async getMisRutas(uid: string, page = 1, limit = 50, q?: string): Promise<Ruta[]> {
    try {
      if (!uid) throw new Error("UID requerido para obtener tus rutas");
      const qs =
        `uid=${encodeURIComponent(uid)}&page=${page}&limit=${limit}` +
        (q ? `&q=${encodeURIComponent(q)}` : "");
      const { data } = await axios.get(`${this.baseUrl}/rutas/mias?${qs}`);
      // El backend devuelve { data: Ruta[], total, totalPages, ... }
      return Array.isArray(data?.data) ? data.data : data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "No se pudieron cargar tus rutas");
    }
  }

  /** Obtener valoraciones de una ruta */
  async getValoracionesRuta(rutaId: string): Promise<ValoracionAPI[]> {
    try {
      const { data } = await axios.get(`${this.baseUrl}/rutas/${rutaId}/valoraciones`);
      // La API devuelve { items: [...] }
      if (Array.isArray(data?.items)) return data.items;
      if (Array.isArray(data)) return data;
      return [];
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "No se pudieron cargar las valoraciones");
    }
  }

  /** Calificar una ruta */
  async calificarRuta(rutaId: string, idUsuario: string, puntuacion: number): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/rutas/${rutaId}/valoraciones`, {
        id_usuario: idUsuario,
        puntuacion,
      });
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "No se pudo guardar tu calificación");
    }
  }

  /** Eliminar una ruta (solo creador). Backend: DELETE /rutas/:id?uid=... */
  async eliminarRuta(rutaId: string, uid: string): Promise<void> {
    try {
      const id = String(rutaId || "").trim();
      const u = encodeURIComponent(String(uid || "").trim());
      if (!id) throw new Error("rutaId requerido");
      if (!u) throw new Error("uid requerido");

      await axios.delete(`${this.baseUrl}/rutas/${id}?uid=${u}`);
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "No se pudo eliminar la ruta");
    }
  }
}

export const rutaService = new RutaService();
