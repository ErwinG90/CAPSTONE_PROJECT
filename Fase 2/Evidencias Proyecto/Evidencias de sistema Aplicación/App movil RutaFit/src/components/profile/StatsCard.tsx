import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = { rutas?: number; distanciaTotal?: string | number; eventos?: number; metaMensual?: string | number; };
export default function StatsCard({ rutas, distanciaTotal, eventos, metaMensual }: Props) {
    return (
        <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
            <View className="flex-row items-center mb-2">
                <Ionicons name="stats-chart" size={18} color="#22c55e" />
                <Text className="text-text font-bold ml-2">Estadísticas</Text>
            </View>

            <View className="flex-row gap-4">
                <View className="flex-1">
                    <Text className="text-[#6b7280]">Rutas Grabadas</Text>
                    <Text className="text-text font-bold text-lg">{rutas ?? 12}</Text>
                </View>
                <View className="flex-1">
                    <Text className="text-[#6b7280]">Distancia Total</Text>
                    <Text className="text-text font-bold text-lg">{distanciaTotal ?? "89.5km"}</Text>
                </View>
            </View>

            <View className="h-3" />

            <View className="flex-row gap-4">
                <View className="flex-1">
                    <Text className="text-[#6b7280]">Eventos</Text>
                    <Text className="text-text font-bold text-lg">{eventos ?? 5}</Text>
                </View>
                <View className="flex-1">
                    <Text className="text-[#6b7280]">Meta Mensual</Text>
                    <Text className="text-text font-bold text-lg">{metaMensual ?? "100km"}</Text>
                </View>
            </View>
        </View>
    );
}
