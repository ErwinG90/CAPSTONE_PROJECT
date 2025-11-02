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
      const response = await axios.post(`${this.baseUrl}/rutas`, ruta);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "No se pudo guardar la ruta");
    }
  }

  async getRutas(): Promise<Ruta[]> {
    try {
      console.log("RutaService: Obteniendo rutas...");
      const response = await axios.get(`${this.baseUrl}/rutas`);
      console.log("RutaService: Rutas obtenidas:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("RutaService: Error obteniendo rutas:", error);
      throw new Error("No se pudieron cargar las rutas");
    }
  }
  /** 🔹 Obtener SOLO las rutas creadas por el usuario logeado */
  async getMisRutas(uid: string, page = 1, limit = 50, q?: string): Promise<Ruta[]> {
    try {
      if (!uid) throw new Error("UID requerido para obtener tus rutas");

      const url = `${this.baseUrl}/rutas/mias?uid=${uid}&page=${page}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ""
        }`;

      console.log("RutaService: Obteniendo rutas del usuario...", url);
      const response = await axios.get(url);

      // El backend devuelve { data: [...], total, totalPages, ... }
      const rutas = response.data?.data ?? response.data;
      console.log("RutaService: Mis rutas obtenidas:", rutas);

      return rutas;
    } catch (error: any) {
      console.error("RutaService: Error obteniendo rutas del usuario:", error);
      throw new Error("No se pudieron cargar tus rutas");
    }
  }

  async getValoracionesRuta(rutaId: string): Promise<ValoracionAPI[]> {
    const url = `${this.baseUrl}/rutas/${rutaId}/valoraciones`;
    const { data } = await axios.get(url);
    // tu API devuelve { items: [...] } según la captura
    return Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  }

  async calificarRuta(rutaId: string, idUsuario: string, puntuacion: number): Promise<void> {
    const url = `${this.baseUrl}/rutas/${rutaId}/valoraciones`;
    await axios.post(url, { id_usuario: idUsuario, puntuacion });
  }
}

export const rutaService = new RutaService();
