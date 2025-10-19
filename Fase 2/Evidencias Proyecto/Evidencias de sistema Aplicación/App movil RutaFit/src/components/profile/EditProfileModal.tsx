// src/components/profile/EditProfileModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Modal, View, Text, Pressable, TextInput, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import type { Deporte } from "../../../interface/Deporte";
import type { Nivel } from "../../../interface/Nivel";
import { deporteService } from "../../../services/DeporteService";
import { nivelService } from "../../../services/NivelService";

type Props = {
    visible: boolean;
    initial: {
        nombre?: string | null;
        apellido?: string | null;
        fechaNacimiento?: string | null; // "YYYY-MM-DD"
        genero?: "hombre" | "mujer" | null;
        deporteFavorito?: string | null;
        nivelExperiencia?: string | null;
    };
    onCancel: () => void;
    onSave: (payload: {
        nombre: string;
        apellido: string;
        fechaNacimiento: string; // YYYY-MM-DD
        genero: "hombre" | "mujer";
        deporteFavorito: string | null;
        nivelExperiencia: string | null;
    }) => void;
};

function ymd(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
function fromYmd(s?: string | null): Date | null {
    if (!s) return null;
    const [y, m, d] = s.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
}

export default function EditProfileModal({ visible, initial, onCancel, onSave }: Props) {
    const [nombre, setNombre] = useState(initial.nombre ?? "");
    const [apellido, setApellido] = useState(initial.apellido ?? "");
    const [genero, setGenero] = useState<"hombre" | "mujer">(initial.genero === "hombre" ? "hombre" : "mujer");
    const [fecha, setFecha] = useState<Date | null>(fromYmd(initial.fechaNacimiento) ?? null);
    const [mostrarPicker, setMostrarPicker] = useState(false);

    const [errorFecha, setErrorFecha] = useState<string | null>(null);

    const [deportes, setDeportes] = useState<Deporte[]>([]);
    const [niveles, setNiveles] = useState<Nivel[]>([]);
    const [deporteId, setDeporteId] = useState<string | null>(initial.deporteFavorito ?? null);
    const [nivelId, setNivelId] = useState<string | null>(initial.nivelExperiencia ?? null);

    // ====== Límites de edad ======
    const hoy = new Date();
    const edadMinima = 16;
    const edadMaxima = 75;
    const limiteEdadMin = new Date(hoy.getFullYear() - edadMinima, hoy.getMonth(), hoy.getDate()); // más joven permitido
    const limiteEdadMax = new Date(hoy.getFullYear() - edadMaxima, hoy.getMonth(), hoy.getDate()); // más viejo permitido

    function validarFechaNacimiento(fecha: Date | null): string | null {
        if (!fecha) return "La fecha de nacimiento es obligatoria.";
        if (fecha > hoy) return "No puedes seleccionar una fecha futura.";
        if (fecha > limiteEdadMin) return "Debes tener al menos 16 años.";
        if (fecha < limiteEdadMax) return "No puedes tener más de 75 años.";
        return null;
    }

    useEffect(() => {
        setErrorFecha(validarFechaNacimiento(fecha));
    }, [fecha]);

    useEffect(() => {
        if (!visible) return;
        setNombre(initial.nombre ?? "");
        setApellido(initial.apellido ?? "");
        setGenero(initial.genero === "hombre" ? "hombre" : "mujer");
        const f = fromYmd(initial.fechaNacimiento) ?? null;
        setFecha(f);
        setErrorFecha(validarFechaNacimiento(f));
        setDeporteId(initial.deporteFavorito ?? null);
        setNivelId(initial.nivelExperiencia ?? null);

        // cargar catálogos
        (async () => {
            try {
                const ds = await deporteService.getDeportes();
                setDeportes(ds);
            } catch { }
            try {
                const ns = await nivelService.getNiveles();
                setNiveles(ns);
            } catch { }
        })();
    }, [visible]);

    const puedeGuardar = useMemo(() => {
        return nombre.trim().length >= 2 && apellido.trim().length >= 2 && !errorFecha && !!fecha;
    }, [nombre, apellido, fecha, errorFecha]);

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View className="flex-1 bg-black/40 items-center justify-end">
                <View className="w-full bg-white rounded-t-3xl p-4">
                    <Text className="text-lg font-semibold text-center mb-3">Editar perfil</Text>

                    {/* Nombre */}
                    <View className="mb-3">
                        <Text className="text-xs text-gray-600 mb-1">Nombre</Text>
                        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-11 border border-gray-200">
                            <Ionicons name="person" size={16} color="#6b7280" />
                            <TextInput
                                className="flex-1 ml-2 text-[15px]"
                                placeholder="Tu nombre"
                                value={nombre}
                                onChangeText={setNombre}
                            />
                        </View>
                    </View>

                    {/* Apellido */}
                    <View className="mb-3">
                        <Text className="text-xs text-gray-600 mb-1">Apellido</Text>
                        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-11 border border-gray-200">
                            <Ionicons name="person" size={16} color="#6b7280" />
                            <TextInput
                                className="flex-1 ml-2 text-[15px]"
                                placeholder="Tu apellido"
                                value={apellido}
                                onChangeText={setApellido}
                            />
                        </View>
                    </View>

                    {/* Fecha de nacimiento */}
                    <View className="mb-3">
                        <Text className="text-xs text-gray-600 mb-1">Fecha de nacimiento</Text>
                        {Platform.OS === "web" ? (
                            <input
                                type="date"
                                value={fecha ? ymd(fecha) : ""}
                                min={ymd(limiteEdadMax)} // no más de 75 años
                                max={ymd(hoy)} // no futura
                                onChange={(e) => {
                                    const f = e.target.value ? new Date(e.target.value) : null;
                                    setFecha(f);
                                    setErrorFecha(validarFechaNacimiento(f));
                                }}
                                style={{
                                    width: "100%",
                                    padding: 10,
                                    borderRadius: 12,
                                    border: "1px solid #e5e7eb",
                                    fontSize: 15,
                                }}
                            />
                        ) : (
                            <>
                                <Pressable
                                    onPress={() => setMostrarPicker(true)}
                                    className="flex-row items-center bg-gray-100 rounded-xl px-3 h-11 border border-gray-200"
                                >
                                    <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                                    <Text className="ml-2 text-[15px]">
                                        {fecha ? fecha.toLocaleDateString("es-CL") : "Selecciona una fecha"}
                                    </Text>
                                </Pressable>
                                {mostrarPicker && (
                                    <DateTimePicker
                                        value={fecha ?? new Date(1995, 0, 1)}
                                        mode="date"
                                        display={Platform.OS === "android" ? "calendar" : "inline"}
                                        minimumDate={limiteEdadMax}
                                        maximumDate={hoy}
                                        onChange={(_, d) => {
                                            setMostrarPicker(false);
                                            if (d) {
                                                setFecha(d);
                                                setErrorFecha(validarFechaNacimiento(d));
                                            }
                                        }}
                                    />
                                )}
                            </>
                        )}
                        {!!errorFecha && (
                            <Text className="text-xs mt-1" style={{ color: "#C51217" }}>
                                {errorFecha}
                            </Text>
                        )}
                    </View>

                    {/* Género */}
                    <View className="mb-3">
                        <Text className="text-xs text-gray-600 mb-1">Género</Text>
                        <View className="flex-row gap-2">
                            <Pressable
                                className={`flex-1 rounded-xl px-4 py-3 items-center border ${genero === "mujer" ? "bg-primary/20 border-primary" : "bg-gray-100 border-gray-200"
                                    }`}
                                onPress={() => setGenero("mujer")}
                            >
                                <Text className={`${genero === "mujer" ? "text-primary font-semibold" : "text-gray-800"}`}>
                                    Mujer
                                </Text>
                            </Pressable>
                            <Pressable
                                className={`flex-1 rounded-xl px-4 py-3 items-center border ${genero === "hombre" ? "bg-primary/20 border-primary" : "bg-gray-100 border-gray-200"
                                    }`}
                                onPress={() => setGenero("hombre")}
                            >
                                <Text className={`${genero === "hombre" ? "text-primary font-semibold" : "text-gray-800"}`}>
                                    Hombre
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* Deporte */}
                    <View className="mb-3">
                        <Text className="text-xs text-gray-600 mb-1">Deporte favorito</Text>
                        <View className="bg-gray-100 rounded-xl border border-gray-200">
                            <Picker selectedValue={deporteId ?? undefined} onValueChange={(v) => setDeporteId(v)}>
                                <Picker.Item label="Selecciona un deporte" value={undefined} />
                                {deportes.map((d) => (
                                    <Picker.Item key={d._id} label={d.nombre} value={d._id} />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    {/* Nivel */}
                    <View className="mb-4">
                        <Text className="text-xs text-gray-600 mb-1">Nivel de experiencia</Text>
                        <View className="bg-gray-100 rounded-xl border border-gray-200">
                            <Picker selectedValue={nivelId ?? undefined} onValueChange={(v) => setNivelId(v)}>
                                <Picker.Item label="Selecciona un nivel" value={undefined} />
                                {niveles.map((n) => (
                                    <Picker.Item key={n._id} label={n.nombre} value={n._id} />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    {/* Acciones */}
                    <View className="flex-row">
                        <Pressable onPress={onCancel} className="flex-1 mr-2 bg-gray-100 rounded-2xl py-3 items-center">
                            <Text className="text-gray-800 font-medium">Cancelar</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                if (!puedeGuardar || !fecha) return;
                                onSave({
                                    nombre: nombre.trim(),
                                    apellido: apellido.trim(),
                                    fechaNacimiento: ymd(fecha),
                                    genero,
                                    deporteFavorito: deporteId ?? null,
                                    nivelExperiencia: nivelId ?? null,
                                });
                            }}
                            className="flex-1 ml-2 bg-primary rounded-2xl py-3 items-center"
                            style={{ opacity: puedeGuardar ? 1 : 0.5 }}
                            disabled={!puedeGuardar}
                        >
                            <Text className="text-white font-semibold">Guardar</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}