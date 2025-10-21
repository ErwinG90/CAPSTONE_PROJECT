import { View, Text, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Evento } from "../../../interface/Evento";

type Variant = "disponibles" | "mis";

interface EventCardProps {
  evento: Evento;
  currentUid?: string;
  variant?: Variant; // "disponibles" | "mis" (default: "disponibles")
  onVerDetalles?: (evento: Evento) => void;
  onUnirse?: (eventoId: string) => void; // solo en "disponibles"
  onCancelar?: (opts: { evento: Evento; motivo: "event" | "participation" }) => void; // solo en "mis"
}

export default function EventCard({
  evento,
  currentUid,
  variant = "disponibles",
  onVerDetalles,
  onUnirse,
  onCancelar,
}: EventCardProps) {
  const participantes = evento.participantes ?? [];
  const isCreator =
    (evento as any).createdBy === currentUid || (evento as any).role === "CREATOR";
  const isParticipant =
    participantes.includes(currentUid as any) || (evento as any).role === "PARTICIPANT";

  // Config botón derecho (sin iconos)
  let primaryLabel = "";
  let primaryClass = "bg-green-600";
  let onPrimaryPress: () => void = () => {};

  if (variant === "disponibles") {
    primaryLabel = "Unirse";
    primaryClass = "bg-green-600";
    onPrimaryPress = () => onUnirse?.(evento._id);
  } else {
    if (isCreator) {
      primaryLabel = "Cancelar evento";
      primaryClass = "bg-red-600";
      onPrimaryPress = () =>
        Alert.alert(
          "Cancelar evento",
          "¿Seguro que deseas cancelarlo? Esta acción no se puede deshacer.",
          [
            { text: "No", style: "cancel" },
            {
              text: "Sí, cancelar",
              style: "destructive",
              onPress: () => onCancelar?.({ evento, motivo: "event" }),
            },
          ]
        );
    } else if (isParticipant) {
      primaryLabel = "Cancelar participación";
      primaryClass = "bg-red-600";
      onPrimaryPress = () =>
        Alert.alert(
          "Cancelar participación",
          "¿Seguro que deseas salir del evento?",
          [
            { text: "No", style: "cancel" },
            {
              text: "Sí, salir",
              style: "destructive",
              onPress: () => onCancelar?.({ evento, motivo: "participation" }),
            },
          ]
        );
    } else {
      primaryLabel = ""; // en "mis" no deberías ver otros eventos
    }
  }

  return (
    <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
      {/* Título + deporte */}
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-semibold text-black flex-1">
          {evento.nombre_evento}
        </Text>
        <View className="flex-row items-center">
          <Ionicons name="fitness-outline" size={16} color="gray" />
          <Text className="text-gray-500 ml-1">
            {evento.deporte?.nombre || "Deporte"}
          </Text>
        </View>
      </View>

      {/* Creador */}
      <Text className="text-gray-500 mb-3">
        By {isCreator ? "Tú" : evento.creador?.nombre || "Usuario"}
      </Text>

      {/* Fecha + cupos */}
      <View className="flex-row justify-between mb-3">
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={16} color="gray" />
          <Text className="text-gray-600 ml-1">
            {new Date(evento.fecha_evento).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="people-outline" size={16} color="gray" />
          <Text className="text-gray-600 ml-1">
            {(evento.participantes?.length || 0)}/{evento.max_participantes} participantes
          </Text>
        </View>
      </View>

      {/* Ubicación */}
      <View className="flex-row items-center mb-4">
        <Ionicons name="location-outline" size={16} color="gray" />
        <Text className="text-gray-600 ml-1">{evento.lugar}</Text>
      </View>

      {/* Acciones */}
      <View className="flex-row gap-3">
        <Pressable
          className="flex-1 bg-transparent border-2 border-gray-500 rounded-full py-3 items-center"
          onPress={() => onVerDetalles?.(evento)}
        >
          <Text className="text-gray-500 font-medium">Ver detalles</Text>
        </Pressable>

        {primaryLabel ? (
          <Pressable
            className={`flex-1 ${primaryClass} rounded-full py-3 items-center`}
            onPress={onPrimaryPress}
          >
            {/* Sin ícono, solo texto */}
            <Text className="text-white font-medium">{primaryLabel}</Text>
          </Pressable>
        ) : (
          <View className="flex-1" />
        )}
      </View>
    </View>
  );
}
