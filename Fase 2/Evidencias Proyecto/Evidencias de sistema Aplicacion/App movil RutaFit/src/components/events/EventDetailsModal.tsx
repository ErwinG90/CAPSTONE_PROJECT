import { View, Text, Pressable, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Evento } from "../../../interface/Evento";

interface EventDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    evento: Evento | null;
}

export default function EventDetailsModal({ visible, onClose, evento }: EventDetailsModalProps) {
    if (!evento) return null;

    const formatearFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center bg-black/50">
                {/* Modal Card Compacto */}
                <View className="bg-white rounded-2xl p-5 mx-2 w-full shadow-2xl">
                    {/* Header Centrado */}
                    <View className="mb-6">
                        <Pressable
                            onPress={onClose}
                            className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center absolute right-0 top-0 z-10"
                        >
                            <Ionicons name="close" size={18} color="#666" />
                        </Pressable>
                        <Text className="text-xl font-bold text-gray-800 mb-4 text-center" numberOfLines={2}>
                            {evento.nombre_evento}
                        </Text>
                    </View>

                    {/* Información Compacta */}
                    <View className="space-y-5">
                        {/* Deporte */}
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center mr-4">
                                <Ionicons name="fitness" size={16} color="#22C55E" />
                            </View>
                            <Text className="text-gray-800 text-lg flex-1">
                                {evento.deporte?.nombre || 'Deporte'}
                            </Text>
                        </View>
                        {/* Organizador */}
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 bg-orange-100 rounded-full items-center justify-center mr-4">
                                <Ionicons name="person" size={16} color="#F97316" />
                            </View>
                            <Text className="text-gray-800 text-lg flex-1">
                                Creado por: {evento.creador?.nombre || 'Usuario'}
                            </Text>
                        </View>

                        {/* Fecha */}
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-4">
                                <Ionicons name="calendar" size={16} color="#3B82F6" />
                            </View>
                            <Text className="text-gray-800 text-lg flex-1">
                                {formatearFecha(evento.fecha_evento)}
                            </Text>
                        </View>

                        {/* Ubicación */}
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 bg-red-100 rounded-full items-center justify-center mr-4">
                                <Ionicons name="location" size={16} color="#EF4444" />
                            </View>
                            <Text className="text-gray-800 text-lg flex-1" numberOfLines={1}>
                                {evento.lugar}
                            </Text>
                        </View>

                        {/* Participantes */}
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 bg-purple-100 rounded-full items-center justify-center mr-4">
                                <Ionicons name="people" size={16} color="#8B5CF6" />
                            </View>
                            <Text className="text-gray-800 text-lg flex-1">
                                {evento.participantes?.length || 0}/{evento.max_participantes} participantes
                            </Text>
                        </View>

                        {/* Descripción (solo si existe y es corta) */}
                        {evento.descripcion && evento.descripcion.length > 0 && (
                            <View className="bg-gray-50 p-3 rounded-xl mt-2">
                                <Text className="text-gray-600 text-xs mb-1">Descripción</Text>
                                <Text className="text-gray-700 text-sm" numberOfLines={3}>
                                    {evento.descripcion}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Botón de Acción */}
                    <Pressable
                        onPress={onClose}
                        className="mt-5 bg-gray-800 py-3 rounded-xl items-center"
                    >
                        <Text className="text-white font-medium">Cerrar</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}