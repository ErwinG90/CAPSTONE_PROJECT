import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Evento } from "../../../interface/Evento";

interface EventCardProps {
    evento: Evento;
    onVerDetalles?: (evento: Evento) => void;
    onUnirse?: (eventoId: string) => void;
}

export default function EventCard({ evento, onVerDetalles, onUnirse }: EventCardProps) {
    return (
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
            {/* Card dinámico con datos reales */}
            <View className="flex-row justify-between items-start mb-2">
                <Text className="text-lg font-semibold text-black flex-1">
                    {evento.nombre_evento}
                </Text>
                <View className="flex-row items-center">
                    <Ionicons name="fitness-outline" size={16} color="gray" />
                    <Text className="text-gray-500 ml-1">{evento.deporte?.nombre || 'Deporte'}</Text>
                </View>
            </View>

            <Text className="text-gray-500 mb-3">
                By {evento.creador?.nombre || 'Usuario'}
            </Text>

            <View className="flex-row justify-between mb-3">
                <View className="flex-row items-center">
                    <Ionicons name="calendar-outline" size={16} color="gray" />
                    <Text className="text-gray-600 ml-1">
                        {new Date(evento.fecha_evento).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Text>
                </View>
                <View className="flex-row items-center">
                    <Ionicons name="people-outline" size={16} color="gray" />
                    <Text className="text-gray-600 ml-1">
                        {evento.participantes?.length || 0}/{evento.max_participantes} participantes
                    </Text>
                </View>
            </View>

            <View className="flex-row items-center mb-4">
                <Ionicons name="location-outline" size={16} color="gray" />
                <Text className="text-gray-600 ml-1">{evento.lugar}</Text>
            </View>

            <View className="flex-row gap-3">
                <Pressable
                    className="flex-1 bg-transparent border-2 border-gray-500 rounded-full py-3 items-center"
                    onPress={() => onVerDetalles?.(evento)}
                >
                    <Text className="text-gray-500 font-medium">Ver detalles</Text>
                </Pressable>
                <Pressable
                    className="flex-1 bg-green-600 rounded-full py-3 items-center"
                    onPress={() => onUnirse?.(evento._id)}
                >
                    <View className="flex-row items-center">
                        <Ionicons name="person-add" size={14} color="white" />
                        <Text className="text-white font-medium ml-2">Unirse</Text>
                    </View>
                </Pressable>
            </View>
        </View>
    );
}