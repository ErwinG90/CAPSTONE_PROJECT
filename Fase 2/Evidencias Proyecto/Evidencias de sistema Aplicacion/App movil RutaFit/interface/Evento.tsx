export interface Evento {
    _id: string;
    nombre_evento: string;
    deporte_id: string;
    lugar: string;
    fecha_evento: string;
    max_participantes: number;
    descripcion: string;
    createdBy: string;
    participantes: string[];
    estado: "programado" | "en_curso" | "finalizado" | "cancelado";
    createdAt: string;

    // Campos opcionales que agregas
    creador?: {
        nombre: string;
        _id?: string;
    };
    deporte?: {
        nombre: string;
        _id?: string;
    };
}