import axios from "axios";
import { API_BASE_URL } from "../src/Constants";
import type { Ruta } from "../interface/Ruta";

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
}

export const rutaService = new RutaService();
