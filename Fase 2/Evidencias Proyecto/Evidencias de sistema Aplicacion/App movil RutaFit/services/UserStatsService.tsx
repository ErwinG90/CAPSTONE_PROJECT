import { API_BASE_URL } from '../src/Constants';

// Tipos para las respuestas de la API
interface Ruta {
    distancia_km: number;
    [key: string]: any;
}

interface Evento {
    createdBy: string;
    participantes?: string[];
    estado: string;
    [key: string]: any;
}

interface UserStats {
    rutasGrabadas: number;
    distanciaTotal: number;
    eventos: number;
}

export const getUserStats = async (userId: string): Promise<UserStats> => {
    try {
        // 1. Rutas del usuario
        const rutasResponse = await fetch(`${API_BASE_URL}/rutas/mias?uid=${userId}`);
        const rutas = await rutasResponse.json();

        // 2. TODOS los eventos (para filtrar participación)
        const eventosResponse = await fetch(`${API_BASE_URL}/eventos`);
        const todosEventos: Evento[] = await eventosResponse.json();

        // 3. Filtrar eventos donde participa o creó
        const eventosRelacionados = todosEventos.filter((evento: Evento) => {
            const esCreador = evento.createdBy === userId;
            const esParticipante = evento.participantes?.includes(userId);
            const noEsCancelado = evento.estado !== 'cancelado';

            return (esCreador || esParticipante) && noEsCancelado;
        });

        return {
            rutasGrabadas: rutas.data?.length || 0,
            distanciaTotal: rutas.data?.reduce((sum: number, ruta: Ruta) => sum + (ruta.distancia_km || 0), 0) || 0,
            eventos: eventosRelacionados.length
        };
    } catch (error) {
        console.error('Error obteniendo estadísticas del usuario:', error);
        return {
            rutasGrabadas: 0,
            distanciaTotal: 0,
            eventos: 0
        };
    }
};