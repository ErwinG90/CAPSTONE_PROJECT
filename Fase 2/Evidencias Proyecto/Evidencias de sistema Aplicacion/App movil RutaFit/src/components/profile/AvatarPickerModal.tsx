// src/components/profile/AvatarPickerModal.tsx
import React, { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, FlatList, Image } from "react-native";
import { AVATAR_KEYS, AVATAR_IMAGES, AvatarKey } from "../../Constants";

type Props = {
    visible: boolean;
    initial?: string | null;
    onCancel: () => void;
    onSave: (selected: string) => void;
};

export default function AvatarPickerModal({ visible, initial, onCancel, onSave }: Props) {
    const [selected, setSelected] = useState<string | null>(initial ?? null);

    useEffect(() => {
        setSelected(initial ?? null);
    }, [initial]);

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View className="flex-1 bg-black/40 items-center justify-end">
                <View className="w-full bg-white rounded-t-3xl p-4">
                    <Text className="text-xl font-semibold text-center mb-3">Elige tu avatar</Text>

                    <FlatList
                        data={AVATAR_KEYS}
                        keyExtractor={(k) => k}
                        numColumns={3}
                        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 8 }}
                        renderItem={({ item }) => {
                            const isSel = selected === item;
                            return (
                                <Pressable
                                    onPress={() => setSelected(item)}
                                    className={`m-2 rounded-2xl border ${isSel ? "border-primary" : "border-gray-200"} p-2`}
                                    style={{ width: 96, height: 96, alignItems: "center", justifyContent: "center" }}
                                >
                                    <Image
                                        source={AVATAR_IMAGES[item as AvatarKey]}
                                        style={{ width: 80, height: 80, borderRadius: 12 }}
                                        resizeMode="contain"
                                    />
                                </Pressable>
                            );
                        }}
                    />

                    <View className="flex-row justify-between mt-2">
                        <Pressable onPress={onCancel} className="flex-1 mr-2 bg-gray-100 rounded-2xl py-3 items-center">
                            <Text className="text-gray-800 font-medium">Cancelar</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => selected && onSave(selected)}
                            className="flex-1 ml-2 bg-primary rounded-2xl py-3 items-center"
                            disabled={!selected}
                            style={{ opacity: selected ? 1 : 0.5 }}
                        >
                            <Text className="text-white font-semibold">Guardar</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
