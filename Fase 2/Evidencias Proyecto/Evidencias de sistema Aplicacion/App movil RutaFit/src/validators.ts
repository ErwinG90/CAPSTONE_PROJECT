import { Platform } from "react-native";

// palabra@palabra.com | palabra@palabra.cl
const EMAIL_REGEX = /^[A-Za-z][A-Za-z0-9._%+-]*@[A-Za-z][A-Za-z0-9-]*\.(com|cl)$/i;
// mínimo 6, al menos 1 minúscula y 1 MAYÚSCULA
const PASS_REGEX = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/;
// solo letras, espacios y caracteres especiales (sin números)
const NO_NUMBERS_REGEX = /^[^0-9]*$/;

export const validateEmail = (s: string) => EMAIL_REGEX.test(s.trim());
export const validatePassword = (s: string) => PASS_REGEX.test(s);

export function calcularEdadSuave(
    d?: number,
    m?: number,
    a?: number
): { exactaOK: boolean; edad?: number; futura?: boolean; menor16Posible?: boolean } {
    const hoy = new Date();
    const Y = hoy.getFullYear();
    const M = hoy.getMonth() + 1;
    const D = hoy.getDate();

    if (!a) return { exactaOK: false };
    if (a > Y) return { exactaOK: false, futura: true };

    if (!m || !d) {
        if (a > Y - 16) return { exactaOK: false, menor16Posible: true };
        if (a === Y - 16) return { exactaOK: false, menor16Posible: true };
        return { exactaOK: false };
    }

    const nacimiento = new Date(a, m - 1, d);
    if (nacimiento > hoy) return { exactaOK: false, futura: true };

    let edad = Y - a;
    if (m > M || (m === M && d > D)) edad--;
    return { exactaOK: true, edad };
}

// ===== VALIDACIONES PARA EVENTOS =====

export interface EventoValidationResult {
    isValid: boolean;
    errors: string[];
}

export function validateEventoForm(
    nombreEvento: string,
    deporteId: string | undefined,
    lugar: string,
    fechaEvento: Date,
    horaEvento: Date,
    maxParticipantes: number,
    descripcion?: string
): EventoValidationResult {
    const errors: string[] = [];

    // Validar campos obligatorios
    if (!nombreEvento.trim()) {
        errors.push('El título del evento es obligatorio');
    }

    if (!deporteId || deporteId === 'undefined' || deporteId === '' || deporteId.trim() === '') {
        errors.push('Debe seleccionar un deporte');
    }

    if (!lugar.trim()) {
        errors.push('La ubicación es obligatoria');
    }

    // Validar máximo de participantes
    if (maxParticipantes < 1 || maxParticipantes > 100) {
        errors.push('Debe permitir al menos 1 participante y un máximo de 100');
    }

    // Validar fecha y hora
    const fechaHoraErrors = validateFechaHoraEvento(fechaEvento, horaEvento);
    errors.push(...fechaHoraErrors);

    return {
        isValid: errors.length === 0,
        errors
    };
}

export function validateFechaHoraEvento(fechaEvento: Date, horaEvento: Date): string[] {
    const errors: string[] = [];
    const ahora = new Date();

    // 1. No puede ser hoy (debe ser mañana o después)
    const fechaSoloFecha = new Date(fechaEvento.getFullYear(), fechaEvento.getMonth(), fechaEvento.getDate());
    const mañana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1);

    if (fechaSoloFecha < mañana) {
        errors.push('Los eventos deben crearse para mañana en adelante');
    }

    // 2. No puede ser más de 1 año en el futuro
    const unAñoDelante = new Date(ahora);
    unAñoDelante.setFullYear(unAñoDelante.getFullYear() + 1);
    if (fechaEvento > unAñoDelante) {
        errors.push('No se pueden crear eventos con más de un año de anticipación');
    }

    // 3. No puede ser entre las 00:00 y 6:59 AM
    const horaDelEvento = horaEvento.getHours();
    if (horaDelEvento >= 0 && horaDelEvento < 7) {
        errors.push('No se pueden crear eventos entre las 00:00 y las 6:59 AM');
    }

    return errors;
}

export function esFechaValida(fecha: Date): boolean {
    const hoy = new Date();
    const fechaEvento = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const mañana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);

    // La fecha debe ser mañana o futura (no hoy)
    return fechaEvento >= mañana;
}

export function esHoraValida(fecha: Date, hora: Date): boolean {
    // Solo validar que no sea en horario no permitido (00:00 - 6:59)
    const horaDelEvento = hora.getHours();
    return horaDelEvento >= 7; // 7 AM en adelante
}

// Funciones para validaciones específicas de campos
export function validateFechaEvento(fecha: Date): string | null {
    const hoy = new Date();

    // Crear fechas sin hora para comparar solo el día
    const fechaEvento = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const fechaHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const mañana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);

    // Solo permitir fechas desde mañana en adelante
    if (fechaEvento < mañana) {
        return 'Los eventos deben crearse con un día de anticipación como mínimo';
    }

    const unAñoDelante = new Date(hoy);
    unAñoDelante.setFullYear(unAñoDelante.getFullYear() + 1);
    if (fecha > unAñoDelante) {
        return 'No se pueden crear eventos con más de un año de anticipación';
    }

    return null;
}

export function validateHoraEvento(hora: Date): string | null {
    const horaDelEvento = hora.getHours();
    if (horaDelEvento >= 0 && horaDelEvento < 7) {
        return 'No se pueden crear eventos entre las 00:00 y las 6:59 AM';
    }
    return null;
}

export function validateDeporteEvento(deporteId: string): string | null {
    if (!deporteId || deporteId === 'undefined' || deporteId === '' || deporteId.trim() === '') {
        return 'Debe seleccionar un deporte';
    }
    return null;
}

export function validateTituloEvento(titulo: string): string | null {
    if (!titulo || titulo.trim() === '') {
        return 'El título del evento es obligatorio';
    }

    if (!NO_NUMBERS_REGEX.test(titulo)) {
        return 'El título del evento no puede contener números';
    }

    return null;
}

export function validateUbicacionEvento(ubicacion: string): string | null {
    if (!ubicacion || ubicacion.trim() === '') {
        return 'La ubicación es obligatoria';
    }
    return null;
}

export const prepararFechaHoraCombinada = (fechaEvento: any, horaEvento: any) => {
    let fechaString, horaString;

    if (Platform.OS === 'web') {
        fechaString = fechaEvento;
        horaString = horaEvento;
    } else {
        fechaString = fechaEvento.toISOString().split('T')[0];
        horaString = horaEvento.toTimeString().split(' ')[0].slice(0, 5);
    }

    return new Date(`${fechaString}T${horaString}:00`);
};

export const validateParticipantesEvento = (maxParticipantes: number): string | null => {
    if (maxParticipantes < 1 || maxParticipantes > 100) {
        return 'Debe permitir entre 1 y máximo 100 participantes';
    }
    return null;
};