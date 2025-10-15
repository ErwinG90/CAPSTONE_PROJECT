import axios from "axios";

class EventoService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = "https://ms-rutafit-neg.vercel.app/ms-rutafit-neg";
  }

  /**
   * Crea un nuevo evento
   */
  async crearEvento(evento: any): Promise<any> {
    try {
      console.log("EventoService: Creando evento...", evento);
      const response = await axios.post(`${this.baseUrl}/eventos`, evento);
      console.log("EventoService: Evento creado:", response.data);
      return response.data;
    } catch (error) {
      console.error("EventoService: Error creando evento:", error);
      throw new Error("No se pudo crear el evento");
    }
  }

  /**
   * Obtiene todos los eventos
   */
  async getEventos(): Promise<any[]> {
    try {
      console.log("EventoService: Obteniendo eventos...");
      const response = await axios.get(`${this.baseUrl}/eventos`);
      console.log("EventoService: Eventos obtenidos:", response.data);
      return response.data;
    } catch (error) {
      console.error("EventoService: Error obteniendo eventos:", error);
      throw new Error("No se pudieron cargar los eventos");
    }
  }

  /**
   * Obtiene un evento específico por ID
   */
  async getEventoById(id: string): Promise<any> {
    try {
      console.log(`EventoService: Obteniendo evento ${id}...`);
      const response = await axios.get(`${this.baseUrl}/eventos/${id}`);
      console.log("EventoService: Evento obtenido:", response.data);
      return response.data;
    } catch (error) {
      console.error(`EventoService: Error obteniendo evento ${id}:`, error);
      throw new Error(`No se pudo cargar el evento con ID: ${id}`);
    }
  }

  /**
   * 🔹 Lista TODOS los eventos del usuario (creados + donde participa)
   *    Devuelve { total, page, limit, data: [...] }
   */
  async getMisEventos(
    uid: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ total: number; page: number; limit: number; data: any[] }> {
    try {
      console.log(`EventoService: Obteniendo MIS eventos (uid=${uid})...`);
      const response = await axios.get(`${this.baseUrl}/eventos/mios`, {
        params: { uid, page, limit },
      });
      console.log("EventoService: Mis eventos obtenidos:", response.data);
      return response.data;
    } catch (error) {
      console.error("EventoService: Error obteniendo MIS eventos:", error);
      throw new Error("No se pudieron cargar tus eventos");
    }
  }
}

// Exportar una instancia singleton
export const eventoService = new EventoService();

// También exportar la clase por si necesitas crear instancias personalizadas
export default EventoService;
