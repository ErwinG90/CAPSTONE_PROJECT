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
            console.log('EventoService: Creando evento...', evento);
            const response = await axios.post(`${this.baseUrl}/eventos`, evento);
            console.log('EventoService: Evento creado:', response.data);
            return response.data;
        } catch (error) {
            console.error('EventoService: Error creando evento:', error);
            throw new Error('No se pudo crear el evento');
        }
    }

    /**
     * Obtiene todos los eventos
     */
    async getEventos(): Promise<any[]> {
        try {
            console.log('EventoService: Obteniendo eventos...');
            const response = await axios.get(`${this.baseUrl}/eventos`);
            console.log('EventoService: Eventos obtenidos:', response.data);
            return response.data;
        } catch (error) {
            console.error('EventoService: Error obteniendo eventos:', error);
            throw new Error('No se pudieron cargar los eventos');
        }
    }

    /**
     * Obtiene un evento específico por ID
     */
    async getEventoById(id: string): Promise<any> {
        try {
            console.log(`EventoService: Obteniendo evento ${id}...`);
            const response = await axios.get(`${this.baseUrl}/eventos/${id}`);
            console.log('EventoService: Evento obtenido:', response.data);
            return response.data;
        } catch (error) {
            console.error(`EventoService: Error obteniendo evento ${id}:`, error);
            throw new Error(`No se pudo cargar el evento con ID: ${id}`);
        }
    }
}

// Exportar una instancia singleton
export const eventoService = new EventoService();

// También exportar la clase por si necesitas crear instancias personalizadas
export default EventoService;