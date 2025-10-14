// src/components/profile/ProfileHeader.tsx
import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AVATAR_IMAGES, AvatarKey } from "../../Constants"; // tu Constants actual

type Props = {
    nombre?: string;
    apellido?: string;
    email?: string;
    deporteNombre?: string;
    nivelNombre?: string;
    avatar?: string | null;
    onPressChangeAvatar?: () => void;
    onPressEdit?: () => void; // <— NUEVO
};

export default function ProfileHeader({
    nombre,
    apellido,
    email,
    deporteNombre,
    nivelNombre,
    avatar,
    onPressChangeAvatar,
    onPressEdit,
}: Props) {
    const imgSrc = avatar ? AVATAR_IMAGES[avatar as AvatarKey] : null;

    return (
        <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
            <View className="flex-row items-center">
                {/* Avatar */}
                <View className="relative mr-3">
                    {imgSrc ? (
                        <Image
                            source={imgSrc}
                            style={{ width: 64, height: 64, borderRadius: 9999 }}
                            className="bg-primary/15 border border-primary"
                        />
                    ) : (
                        <View className="w-16 h-16 rounded-full bg-primary/15 border border-primary items-center justify-center">
                            <Ionicons name="person" size={28} color="#22c55e" />
                        </View>
                    )}

                    {!!onPressChangeAvatar && (
                        <Pressable
                            onPress={onPressChangeAvatar}
                            className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary items-center justify-center border-2 border-white"
                            hitSlop={8}
                            style={{ elevation: 3 }}
                        >
                            <Ionicons name="camera" size={14} color="#ffffff" />
                        </Pressable>
                    )}
                </View>

                {/* Datos + botón editar */}
                <View className="flex-1">
                    <View className="flex-row items-start justify-between">
                        <Text className="text-text text-[16px] font-bold" numberOfLines={1}>
                            {nombre || "Usuario"} {apellido || "Test"}
                        </Text>

                        {!!onPressEdit && (
                            <Pressable
                                onPress={onPressEdit}
                                className="ml-2 h-8 w-8 rounded-lg bg-gray-100 border border-gray-200 items-center justify-center"
                                hitSlop={6}
                            >
                                <Ionicons name="create-outline" size={16} color="#111827" />
                            </Pressable>
                        )}
                    </View>

                    <View className="flex-row items-center mt-1">
                        <Ionicons name="mail" size={14} color="#6b7280" />
                        <Text className="text-[#6b7280] ml-1 text-xs" numberOfLines={1}>
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
