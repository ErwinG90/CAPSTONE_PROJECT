export interface Ruta {
    _id?: string;
    id_creador: string;
    nombre_ruta: string;
    descripcion?: string;
    tipo_deporte: string;
    nivel_dificultad: string;
    distancia_km: number;
    recorrido: {
        type: 'LineString';
        coordinates: [number, number][];
    };
    ruta_publica: boolean;
    valoraciones?: any[];
    promedio_valoracion?: number;
    fecha_creacion?: string;
}
