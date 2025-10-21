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

  async participarEnEvento(eventoId: string, uid: string): Promise<any> {
    try {
      console.log(`EventoService: Participando en evento ${eventoId} (uid=${uid})...`);
      // Backend usa "Eventos" con mayúscula en esta ruta
      const url = `${this.baseUrl}/Eventos/${eventoId}/participar`;
      const response = await axios.post(url, { uid });
      console.log("EventoService: Participación confirmada:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("EventoService: Error al participar:", error?.response?.data || error);
      throw new Error(
        error?.response?.data?.message || "No se pudo unir al evento. Inténtalo de nuevo."
      );
    }
  }

  /**
   * 🔹 Salir de un evento (participante)
   *    Idéntico a participar pero con DELETE y { uid } en el body.
   */
  async salirDeEvento(eventoId: string, uid: string): Promise<any> {
    try {
      console.log(`EventoService: Saliendo de evento ${eventoId} (uid=${uid})...`);
      const url = `${this.baseUrl}/Eventos/${eventoId}/participar`;
      // axios.delete permite body usando { data: ... }
      const response = await axios.delete(url, { data: { uid } });
      console.log("EventoService: Participación cancelada:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("EventoService: Error al salir del evento:", error?.response?.data || error);
      throw new Error(
        error?.response?.data?.message || "No se pudo cancelar tu participación. Inténtalo de nuevo."
      );
    }
  }

  async cancelarEvento(eventoId: string, uid: string): Promise<any> {
    try {
      console.log(`EventoService: Cancelando evento ${eventoId} (creador uid=${uid})...`);
      const url = `${this.baseUrl}/eventos/${eventoId}/participar`;
      // IMPORTANTE: axios.delete acepta body usando { data: ... }
      const response = await axios.delete(url, { data: { uid } });
      console.log("EventoService: Evento cancelado/eliminado:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("EventoService: Error al cancelar evento:", error?.response?.data || error);
      throw new Error(
        error?.response?.data?.message || "No se pudo cancelar el evento. Inténtalo de nuevo."
      );
    }
  }

}

// Exportar una instancia singleton
export const eventoService = new EventoService();

// También exportar la clase por si necesitas crear instancias personalizadas
export default EventoService;
