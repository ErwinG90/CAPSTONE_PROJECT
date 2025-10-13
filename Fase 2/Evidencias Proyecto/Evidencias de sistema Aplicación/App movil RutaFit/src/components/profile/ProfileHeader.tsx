// src/components/profile/ProfileHeader.tsx
import React from "react";
import { View, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
    nombre?: string;
    apellido?: string;
    email?: string;
    deporteNombre?: string;
    nivelNombre?: string;
    avatar?: string;
};

export default function ProfileHeader({
    nombre,
    apellido,
    email,
    deporteNombre,
    nivelNombre,
    avatar,
}: Props) {
    return (
        <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
            <View className="flex-row items-center">
                <View className="h-12 w-12 rounded-full bg-primary/15 border border-primary items-center justify-center mr-3 overflow-hidden">
                    {avatar ? (
                        <Image
                            source={{ uri: avatar }}
                            style={{ width: 48, height: 48 }}
                            className="rounded-full"
                        />
                    ) : (
                        <Ionicons name="person" size={22} color="#22c55e" />
                    )}
                </View>

                <View className="flex-1">
                    <Text className="text-text text-[16px] font-bold">
                        {nombre || "Usuario"} {apellido || "Test"}
                    </Text>

                    <View className="flex-row items-center mt-1">
                        <Ionicons name="mail" size={14} color="#6b7280" />
                        <Text className="text-[#6b7280] ml-1 text-xs">
                            {email || "correo@ejemplo.com"}
                        </Text>
                    </View>

                    {(deporteNombre || nivelNombre) && (
                        <View className="flex-row mt-2">
                            {!!deporteNombre && (
                                <View className="px-2.5 py-1 rounded-full bg-primary/15 border border-primary mr-2">
                                    <Text className="text-text text-[11px]">🏃 {deporteNombre}</Text>
                                </View>
                            )}
                            {!!nivelNombre && (
                                <View className="px-2.5 py-1 rounded-full bg-primary/15 border border-primary">
                                    <Text className="text-text text-[11px]">🎯 {nivelNombre}</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}
