import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ActivityIndicator, ScrollView, Pressable } from "react-native";
import MapView, { Polyline, Region } from "react-native-maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getUserById } from "../../services/UserService";

type Ruta = {
    id?: string;
    _id?: string;
    nombre?: string;
    descripcion?: string;
    deporte?: string;
    nivel?: string;
    distanciaKm?: number;
    rating?: number;
    ratingCount?: number;
    creadorId?: string;
    fechaCreacion?: string | Date;
    recorrido?: { type: "LineString"; coordinates: [number, number][] };
};

type Calificacion = {
    usuario: string;
    valoracion: number;
    fecha: string;
};

// calificaciones (reemplazar con data real cuando exista el endpoint)
const mockCalificaciones: Calificacion[] = [
    {
        usuario: "Carlos Ruiz",
        valoracion: 5,
        fecha: "19 ene 2024",
    },
    {
        usuario: "Ana López",
        valoracion: 4,
        fecha: "17 ene 2024",
    },
    {
        usuario: "Luis Hernández",
        valoracion: 5,
        fecha: "15 ene 2024",
    },
];

function toLatLng(coords: [number, number][]) {
    // Backend envía [lon, lat]; MapView espera { latitude, longitude }
    return coords.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
}

function computeRegionFromCoords(coords: [number, number][]): Region | null {
    if (!coords || coords.length === 0) return null;
    const lats = coords.map((c) => c[1]);
    const lngs = coords.map((c) => c[0]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latitude = (minLat + maxLat) / 2;
    const longitude = (minLng + maxLng) / 2;
    const latitudeDelta = Math.max(0.01, (maxLat - minLat) * 1.4);
    const longitudeDelta = Math.max(0.01, (maxLng - minLng) * 1.4);
    return { latitude, longitude, latitudeDelta, longitudeDelta };
}

function formatDistance(km?: number) {
    if (km == null) return "-";
    return `${km.toFixed(1)} km`;
}

function CalificacionCard({ cal }: { cal: Calificacion }) {
    return (
        <View className="mb-4">
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-3">
                        <Text className="text-sm font-semibold text-gray-700">
                            {cal.usuario
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                        </Text>
                    </View>
                    <View>
                        <Text className="font-semibold text-base">{cal.usuario}</Text>
                        <View className="flex-row">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Ionicons
                                    key={star}
                                    name="star"
                                    size={14}
                                    color={star <= cal.valoracion ? "#facc15" : "#d1d5db"}
                                />
                            ))}
                        </View>
                    </View>
                </View>
                <Text className="text-xs text-gray-500">{cal.fecha}</Text>
            </View>
        </View>
    );
}

export default function RutaDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const id = String(params.id || "");
    const dataParam = typeof params.data === "string" ? params.data : undefined;

    const [ruta, setRuta] = useState<Ruta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [creatorName, setCreatorName] = useState<string>("Usuario");
    const [hasZoomed, setHasZoomed] = useState(false);
    const mapRef = React.useRef<any>(null);

    useEffect(() => {
        let mounted = true;
        try {
            setLoading(true);
            if (dataParam) {
                const parsed = JSON.parse(dataParam) as Ruta;
                if (mounted) setRuta(parsed);
            } else {
                setError("Falta params.data; implementa GET /rutas/:id para cargar por ID");
            }
        } catch (e: any) {
            setError(e?.message ?? "Error cargando la ruta");
        } finally {
            setLoading(false);
        }
        return () => {
            mounted = false;
        };
    }, [id, dataParam]);

    // Fetch creator info
    useEffect(() => {
        if (!ruta?.creadorId) return;
        let mounted = true;
        getUserById(ruta.creadorId)
            .then((user) => {
                if (mounted) {
                    const displayName = user.displayName || `${user.nombre || ""} ${user.apellido || ""}`.trim() || "Usuario";
                    setCreatorName(displayName);
                }
            })
            .catch(() => {
                if (mounted) setCreatorName("Usuario");
            });
        return () => {
            mounted = false;
        };
    }, [ruta?.creadorId]);

    const coords = ruta?.recorrido?.coordinates ?? [];
    const region = useMemo(() => computeRegionFromCoords(coords), [coords]);
    const polyline = useMemo(() => toLatLng(coords), [coords]);

    // Guardar la región inicial solo una vez usando useMemo
    const initialRegion = React.useMemo(() => {
        return region;
    }, [coords]); // Depende de coords, no de region

    const formatDate = (date?: string | Date) => {
        if (!date) return null;
        try {
            const d = typeof date === "string" ? new Date(date) : date;
            return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
        } catch {
            return null;
        }
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" />
                <Text className="mt-3 text-gray-500">Cargando ruta…</Text>
            </View>
        );
    }

    if (error || !ruta) {
        return (
            <View className="flex-1 items-center justify-center px-6 bg-white">
                <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                <Text className="text-red-500 text-center mt-4">{error ?? "No se encontró la ruta"}</Text>
                <Pressable
                    className="mt-6 bg-black px-6 py-3 rounded-xl"
                    onPress={() => router.back()}
                >
                    <Text className="text-white font-semibold">Volver</Text>
                </Pressable>
            </View>
        );
    }

    const nombre = ruta.nombre ?? "Ruta";

    return (
        <View className="flex-1 bg-white">
            {/* Header con botón Volver */}
            <View className="flex-row items-center px-4 pt-12 pb-3 bg-white border-b border-gray-100">
                <Pressable
                    onPress={() => router.back()}
                    className="mr-3 p-2"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color="#111" />
                </Pressable>
                <Text className="text-lg font-semibold flex-1" numberOfLines={1}>
                    {nombre}
                </Text>
            </View>

            <ScrollView className="flex-1">
                {/* Mapa interactivo con vista previa */}
                <View className="h-64 w-full bg-gray-100 relative">
                    {region && polyline.length >= 2 ? (
                        <>
                            <MapView
                                ref={(ref) => {
                                    if (ref && !ref.getCamera) return;
                                    (mapRef as any).current = ref;
                                }}
                                style={{ height: "100%", width: "100%" }}
                                initialRegion={initialRegion || region}
                                scrollEnabled={true}
                                zoomEnabled={true}
                                rotateEnabled={false}
                                pitchEnabled={false}
                                mapType="standard"
                                onRegionChangeComplete={(newRegion) => {
                                    // Detectar si el usuario hizo zoom comparando con la región inicial
                                    if (initialRegion) {
                                        const zoomChanged =
                                            Math.abs(newRegion.latitudeDelta - initialRegion.latitudeDelta) > 0.001 ||
                                            Math.abs(newRegion.longitudeDelta - initialRegion.longitudeDelta) > 0.001;
                                        setHasZoomed(zoomChanged);
                                    }
                                }}
                            >
                                <Polyline coordinates={polyline} strokeColor="#2563eb" strokeWidth={4} />
                            </MapView>

                            {/* Botón reset sutil - solo visible si hizo zoom */}
                            {hasZoomed && (
                                <Pressable
                                    className="absolute bottom-3 right-3 bg-black/60 p-2.5 rounded-full"
                                    onPress={() => {
                                        if ((mapRef as any).current && initialRegion) {
                                            (mapRef as any).current.animateToRegion(initialRegion, 300);
                                            setHasZoomed(false);
                                        }
                                    }}
                                >
                                    <Ionicons name="expand-outline" size={18} color="white" />
                                </Pressable>
                            )}
                        </>
                    ) : (
                        <View className="flex-1 items-center justify-center">
                            <Ionicons name="map-outline" size={48} color="#9ca3af" />
                            <Text className="text-gray-500 mt-2">Vista previa de la ruta</Text>
                        </View>
                    )}
                </View>

                {/* Botón Iniciar esta Ruta */}
                <View className="px-4 pt-4">
                    <Pressable
                        className="bg-green-600 rounded-xl py-4 items-center flex-row justify-center"
                        onPress={() => {
                            // TODO: navegar al mapa con esta ruta precargada
                            router.back();
                        }}
                    >
                        <Ionicons name="play" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text className="text-white font-semibold text-base">Iniciar esta Ruta</Text>
                    </Pressable>
                </View>

                {/*deporte y dificultad + rating */}
                <View className="px-4 pt-4">
                    <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row gap-2">
                            {ruta.deporte ? (
                                <View className="px-3 py-1 rounded-full bg-gray-100">
                                    <Text className="text-sm text-gray-700">{ruta.deporte}</Text>
                                </View>
                            ) : null}
                            {ruta.nivel ? (
                                <View className="px-3 py-1 rounded-full bg-black">
                                    <Text className="text-sm text-white font-medium">{ruta.nivel}</Text>
                                </View>
                            ) : null}
                        </View>
                        {ruta.rating != null && (
                            <View className="flex-row items-center">
                                <Ionicons name="star" size={18} color="#facc15" />
                                <Text className="ml-1 text-base font-semibold">
                                    {ruta.rating.toFixed(1)}
                                </Text>
                                {ruta.ratingCount != null && (
                                    <Text className="ml-1 text-sm text-gray-500">({ruta.ratingCount})</Text>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Nombre, creador y fecha */}
                    <Text className="text-2xl font-bold mb-1">{nombre}</Text>
                    <View className="flex-row items-center mb-3">
                        <Ionicons name="person-outline" size={14} color="#6b7280" />
                        <Text className="text-sm text-gray-600 ml-1">por {creatorName}</Text>
                        {formatDate(ruta.fechaCreacion) && (
                            <>
                                <Text className="text-sm text-gray-400 mx-2">•</Text>
                                <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                                <Text className="text-sm text-gray-600 ml-1">{formatDate(ruta.fechaCreacion)}</Text>
                            </>
                        )}
                    </View>
                    {ruta.descripcion ? (
                        <Text className="text-sm text-gray-600 leading-5 mb-4">{ruta.descripcion}</Text>
                    ) : null}

                    {/* Métricas */}
                    <View className="bg-gray-50 rounded-xl p-4 mb-4">
                        <View className="flex-row justify-center">
                            <View className="items-center">
                                <Ionicons name="trail-sign-outline" size={24} color="#6b7280" />
                                <Text className="text-xs text-gray-500 mt-1">Distancia</Text>
                                <Text className="text-lg font-semibold mt-1">{formatDistance(ruta.distanciaKm)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Sección Calificaciones */}
                <View className="px-4 py-4 border-t border-gray-200">
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center">
                            <Ionicons name="chatbubble-outline" size={20} color="#111" />
                            <Text className="text-lg font-semibold ml-2">
                                Calificaciones ({mockCalificaciones.length})
                            </Text>
                        </View>
                        <Pressable>
                            <View className="flex-row items-center">
                                <Ionicons name="star-outline" size={18} color="#111" />
                                <Text className="ml-1 text-sm font-medium">Calificar</Text>
                            </View>
                        </Pressable>
                    </View>

                    {mockCalificaciones.map((cal, idx) => (
                        <CalificacionCard key={idx} cal={cal} />
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}
