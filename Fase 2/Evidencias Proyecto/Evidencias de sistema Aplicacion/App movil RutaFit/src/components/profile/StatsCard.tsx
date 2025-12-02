import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = { rutas?: number; distanciaTotal?: string | number; eventos?: number; };
export default function StatsCard({ rutas, distanciaTotal, eventos }: Props) {
    return (
        <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
            <View className="flex-row items-center mb-2">
                <Ionicons name="stats-chart" size={18} color="#22c55e" />
                <Text className="text-text font-bold ml-2">Estadísticas</Text>
            </View>

            <View className="flex-row justify-center gap-6">
                <View className="items-center">
                    <Text className="text-[#6b7280] text-sm">Rutas Grabadas</Text>
                    <Text className="text-text font-bold text-lg">{rutas ?? 0}</Text>
                </View>
                <View className="items-center">
                    <Text className="text-[#6b7280] text-sm">Eventos</Text>
                    <Text className="text-text font-bold text-lg">{eventos ?? 0}</Text>
                </View>
                <View className="items-center">
                    <Text className="text-[#6b7280] text-sm">Distancia Total</Text>
                    <Text className="text-text font-bold text-lg">{distanciaTotal ?? "0km"}</Text>
                </View>
            </View>
        </View>
    );
}
