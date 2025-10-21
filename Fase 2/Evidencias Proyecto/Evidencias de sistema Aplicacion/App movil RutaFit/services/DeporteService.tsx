import axios from "axios";
import type { Deporte } from "../interface/Deporte";

class DeporteService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = "https://ms-rutafit-neg.vercel.app/ms-rutafit-neg";
    }

    /**
     * Obtiene todos los tipos de deporte desde la API
     */
    async getDeportes(): Promise<Deporte[]> {
        try {
            console.log('DeporteService: Llamando a tipos-deporte...');
            const response = await axios.get(`${this.baseUrl}/tipos-deporte`);
            console.log('DeporteService: Deportes obtenidos:', response.data);
            return response.data;
        } catch (error) {
            console.error('DeporteService: Error obteniendo deportes:', error);
            throw new Error('No se pudieron cargar los deportes');
        }
    }

    /**
     * Obtiene un deporte específico por ID
     */
    async getDeporteById(id: string): Promise<Deporte> {
        try {
            console.log(`DeporteService: Llamando a tipos-deporte/${id}...`);
            const response = await axios.get(`${this.baseUrl}/tipos-deporte/${id}`);
            console.log('DeporteService: Deporte obtenido:', response.data);
            return response.data;
        } catch (error) {
            console.error(`DeporteService: Error obteniendo deporte ${id}:`, error);
            throw new Error(`No se pudo cargar el deporte con ID: ${id}`);
        }
    }
}

// Exportar una instancia singleton
export const deporteService = new DeporteService();

// También exportar la clase por si necesitas crear instancias personalizadas
export default DeporteService;