import { ActivityIndicator, RefreshControl } from "react-native";
import { useState, useEffect, useCallback } from 'react';
import type { Evento } from '../../interface/Evento';
import type { Deporte } from '../../interface/Deporte';
import { eventoService } from '../../services/EventoService';
import { getUserById } from '../../services/UserService';

export const useEvents = (deportes: Deporte[]) => {
    // Estados para eventos reales
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [cargandoEventos, setCargandoEventos] = useState(true);
    const [errorEventos, setErrorEventos] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const obtenerEventos = useCallback(async () => {
        try {
            setRefreshing(true);
            setCargandoEventos(true);
            const eventos = await eventoService.getEventos();

            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const eventosVigentes = eventos.filter(evento => {
                const fechaEvento = new Date(evento.fecha_evento);
                return fechaEvento >= hoy;
            });

            // Para cada evento, obtener datos del usuario Y del deporte
            const eventosCompletos = await Promise.all(
                eventosVigentes.map(async (evento) => {
                    try {
                        // Obtener usuario
                        const usuario = await getUserById(evento.createdBy);

                        // Obtener deporte
                        const deporte = deportes.find(d => d._id === evento.deporte_id) || { nombre: 'Deporte no encontrado' };

                        return {
                            ...evento,
                            creador: usuario,
                            deporte: deporte
                        };
                    } catch (error: any) {
                        // Verificar si es error 404 de diferentes formas posibles
                        const is404 =
                            error?.response?.status === 404 ||          // Axios error con response
                            error?.status === 404 ||                    // Error directo con status
                            (error?.message && error.message.includes('404')) ||  // Error en el mensaje
                            (error?.code === 'ERR_BAD_REQUEST' && error?.response?.status === 404); // Axios específico

                        if (!is404) {
                            // Solo mostrar errores que NO sean 404
                            console.error('Error obteniendo datos adicionales:', error);
                        } else {
                            // Log silencioso para 404s esperados
                            console.log(`Usuario ${evento.createdBy} no encontrado, usando fallback`);
                        }

                        return {
                            ...evento,
                            creador: { nombre: 'Usuario' },
                            deporte: { nombre: 'Deporte' }
                        };
                    } finally {
                        setRefreshing(false);
                    }
                })
            );

            setEventos(eventosCompletos);
            setErrorEventos(null);
        } catch (error) {
            console.error('Error obteniendo eventos:', error);
            setErrorEventos('No se pudieron cargar los eventos');
        } finally {
            setCargandoEventos(false);
            setRefreshing(false);
        }
    }, [deportes]);

    useEffect(() => {
        obtenerEventos();
    }, [obtenerEventos]); // Ejecutar al montar y cuando cambien dependencias (ej. deportes)

    const onRefresh = async () => {
        try {
            setRefreshing(true);
            await obtenerEventos(); // tu función de carga
        } finally {
            setRefreshing(false);
        }
    };

    return {
        eventos,
        cargandoEventos,
        errorEventos,
        obtenerEventos
    };
};