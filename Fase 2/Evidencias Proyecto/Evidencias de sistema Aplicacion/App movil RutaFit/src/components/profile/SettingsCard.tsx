import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
    notif?: string;
    privacy?: string;
    units?: string;
    onOpenSettings?: () => void; // opcional: si lo pasas, aparece el botón
};

export default function SettingsCard({ notif, privacy, units, onOpenSettings }: Props) {
    return (
        <View className="bg-white border border-gray-200 rounded-2xl p-4">
            <View className="flex-row items-center mb-2">
                <Ionicons name="settings-outline" size={18} color="#22c55e" />
                <Text className="text-text font-bold ml-2">Configuración</Text>
            </View>

            <View className="flex-row items-center justify-between py-3 border-b border-gray-200">
                <Text className="text-[#6b7280]">Notificaciones</Text>
                <Text className="text-text font-semibold">{notif ?? "Activadas"}</Text>
            </View>
            <View className="flex-row items-center justify-between py-3 border-b border-gray-200">
                <Text className="text-[#6b7280]">Privacidad</Text>
                <Text className="text-text font-semibold">{privacy ?? "Público"}</Text>
            </View>
            <View className="flex-row items-center justify-between py-3">
                <Text className="text-[#6b7280]">Unidades</Text>
                <Text className="text-text font-semibold">{units ?? "Kilómetros"}</Text>
            </View>

            {!!onOpenSettings && (
                <View className="mt-4">
                    <Pressable onPress={onOpenSettings} className="rounded-xl px-4 py-3 items-center bg-primary">
                        <Text className="text-white font-bold">Abrir ajustes</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}
