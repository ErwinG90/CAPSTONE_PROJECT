import axios from "axios";
import type { Nivel } from "../interface/Nivel";

class NivelService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = "https://ms-rutafit-neg.vercel.app/ms-rutafit-neg";
    }

    /**
     * Obtiene todos los tipos de Niveles desde la API
     */
    async getNiveles(): Promise<Nivel[]> {
        try {
            console.log('NivelesService: Llamando a nivel...');
            const response = await axios.get(`${this.baseUrl}/nivel-experiencia`);
            console.log('NivelesService: Niveles obtenidos:', response.data);
            return response.data;
        } catch (error) {
            console.error('NivelesService: Error obteniendo niveles:', error);
            throw new Error('No se pudieron cargar los niveles');
        }
    }

    /**
     * Obtiene un nivel específico por ID
     */
    async getNivelById(id: string): Promise<Nivel> {
        try {
            console.log(`NivelesService: Llamando a nivel-experiencia/${id}...`);
            const response = await axios.get(`${this.baseUrl}/nivel-experiencia/${id}`);
            console.log('NivelesService: Nivel obtenido:', response.data);
            return response.data;
        } catch (error) {
            console.error(`NivelesService: Error obteniendo nivel ${id}:`, error);
            throw new Error(`No se pudo cargar el nivel con ID: ${id}`);
        }
    }
}

// Exportar una instancia singleton
export const nivelService = new NivelService();

// También exportar la clase por si necesitas crear instancias personalizadas
export default NivelService;