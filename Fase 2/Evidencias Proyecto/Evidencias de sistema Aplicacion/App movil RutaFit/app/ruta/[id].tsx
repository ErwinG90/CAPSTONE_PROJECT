// app/ruta/[id].tsx
import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    ActivityIndicator,
    ScrollView,
    Pressable,
    Modal,
    Image,
    Alert,
} from "react-native";
import MapView, { Polyline, Region } from "react-native-maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../src/firebaseConfig";
import { rutaService } from "../../services/RutaService";
import { AVATAR_IMAGES, type AvatarKey } from "../../src/Constants";

// ===== Tipos UI mínimos (ajústalos si ya los tienes tipados) =====
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

type ValoracionAPI = {
    id_usuario: string;
    puntuacion: number; // 1..5
    fecha: string; // ISO
    usuario?: {
        uid?: string;
        nombre?: string;
        avatar?: string | null; // aquí viene la **clave** del avatar
    };
};

// ===== Helpers =====
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

function formatFecha(fechaIso?: string | Date) {
    if (!fechaIso) return "";
    try {
        const d = typeof fechaIso === "string" ? new Date(fechaIso) : fechaIso;
        return d.toLocaleDateString("es-CL", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return "";
    }
}

// Avatar local con Constants (igual patrón que ProfileHeader)
function AvatarLocal({
    avatarKey,
    name,
    size = 40,
}: {
    avatarKey?: string | null;
    name?: string;
    size?: number;
}) {
    const key = (avatarKey || "") as AvatarKey;
    const imgSrc = key && AVATAR_IMAGES[key] ? AVATAR_IMAGES[key] : null;

    if (imgSrc) {
        return (
            <Image
                source={imgSrc}
                style={{ width: size, height: size, borderRadius: 9999 }}
                className="bg-primary/15 border border-primary"
            />
        );
    }

    // fallback: iniciales
    const initials =
        (name ?? "U")
            .split(" ")
            .filter(Boolean)
            .map((n) => n[0]?.toUpperCase())
            .slice(0, 2)
            .join("") || "U";

    return (
        <View
            style={{ width: size, height: size }}
            className="rounded-full bg-primary/15 border border-primary items-center justify-center"
        >
            <Text className="text-sm font-semibold text-primary">{initials}</Text>
        </View>
    );
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
    return (
        <View className="flex-row">
            {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons
                    key={s}
                    name="star"
                    size={size}
                    color={s <= value ? "#facc15" : "#d1d5db"}
                />
            ))}
        </View>
    );
}

function CalificacionRow({ item }: { item: ValoracionAPI }) {
    const nombre = item.usuario?.nombre ?? "Usuario";
    const avatarKey = (item.usuario?.avatar ?? "") as AvatarKey;

    return (
        <View className="mb-4">
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <AvatarLocal name={nombre} avatarKey={avatarKey} />
                    <View className="ml-3">
                        <Text className="font-semibold text-base">{nombre}</Text>
                        <Stars value={item.puntuacion} />
                    </View>
                </View>
                <Text className="text-xs text-gray-500">{formatFecha(item.fecha)}</Text>
            </View>
        </View>
    );
}

// ===== Pantalla =====
export default function RutaDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const id = String(params.id || "");
    const dataParam = typeof params.data === "string" ? params.data : undefined;

    const [ruta, setRuta] = useState<Ruta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // mapa
    const [hasZoomed, setHasZoomed] = useState(false);
    const mapRef = React.useRef<any>(null);

    // calificaciones
    const [cals, setCals] = useState<ValoracionAPI[]>([]);
    const [loadingCals, setLoadingCals] = useState(false);

    // modal calificar
    const [showModal, setShowModal] = useState(false);
    const [myStars, setMyStars] = useState<number>(0);
    const uid = auth.currentUser?.uid;

    // cargar ruta desde params (o haz GET por id si lo prefieres)
    useEffect(() => {
        let mounted = true;
        (async () => {
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
        })();
        return () => {
            mounted = false;
        };
    }, [id, dataParam]);

    // GET calificaciones (via service)
    const fetchCals = async () => {
        if (!id) return;
        try {
            setLoadingCals(true);
            const items = await rutaService.getValoracionesRuta(id);
            setCals(items);
        } catch (e: any) {
            console.error("GET valoraciones error:", e?.message);
        } finally {
            setLoadingCals(false);
        }
    };

    useEffect(() => {
        fetchCals();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // métricas de rating local
    const localAvg = useMemo(() => {
        if (!cals.length) return ruta?.rating ?? undefined;
        const s = cals.reduce((acc, v) => acc + (v.puntuacion || 0), 0);
        return s / cals.length;
    }, [cals, ruta?.rating]);

    const localCount = useMemo(
        () => (cals.length ? cals.length : ruta?.ratingCount),
        [cals, ruta?.ratingCount]
    );

    const coords = ruta?.recorrido?.coordinates ?? [];
    const region = useMemo(() => computeRegionFromCoords(coords), [coords]);
    const polyline = useMemo(() => toLatLng(coords), [coords]);
    const initialRegion = React.useMemo(() => region, [coords]);

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
                <Pressable className="mt-6 bg-black px-6 py-3 rounded-xl" onPress={() => router.back()}>
                    <Text className="text-white font-semibold">Volver</Text>
                </Pressable>
            </View>
        );
    }

    const nombre = ruta.nombre ?? "Ruta";

    const handleSubmitRating = async () => {
        if (!uid) {
            Alert.alert("Inicia sesión", "Debes iniciar sesión para calificar.");
            return;
        }
        if (myStars < 1 || myStars > 5) {
            Alert.alert("Selecciona una puntuación", "Elige un valor entre 1 y 5 estrellas.");
            return;
        }
        try {
            await rutaService.calificarRuta(id, uid, myStars);
            setShowModal(false);
            setMyStars(0);
            await fetchCals();
            Alert.alert("¡Gracias!", "Tu calificación fue registrada.");
        } catch (e: any) {
            console.error("POST valoracion error:", e?.message);
            Alert.alert("No se pudo calificar", e?.response?.data?.message || "Inténtalo nuevamente.");
        }
    };

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center px-4 pt-12 pb-3 bg-white border-b border-gray-100">
                <Pressable onPress={() => router.back()} className="mr-3 p-2" hitSlop={10}>
                    <Ionicons name="arrow-back" size={24} color="#111" />
                </Pressable>
                <Text className="text-lg font-semibold flex-1" numberOfLines={1}>
                    {nombre}
                </Text>
            </View>

            <ScrollView className="flex-1">
                {/* Mapa */}
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
                                scrollEnabled
                                zoomEnabled
                                rotateEnabled={false}
                                pitchEnabled={false}
                                mapType="standard"
                                onRegionChangeComplete={(newRegion) => {
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
                        onPress={() => router.back()}
                    >
                        <Ionicons name="play" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text className="text-white font-semibold text-base">Iniciar esta Ruta</Text>
                    </Pressable>
                </View>

                {/* Info + rating promedio local */}
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
                        {localAvg != null && (
                            <View className="flex-row items-center">
                                <Ionicons name="star" size={18} color="#facc15" />
                                <Text className="ml-1 text-base font-semibold">
                                    {Number(localAvg).toFixed(1)}
                                </Text>
                                {localCount != null && (
                                    <Text className="ml-1 text-sm text-gray-500">({localCount})</Text>
                                )}
                            </View>
                        )}
                    </View>

                    <Text className="text-2xl font-bold mb-1">{nombre}</Text>
                    {ruta.descripcion ? (
                        <Text className="text-sm text-gray-600 leading-5 mb-4">{ruta.descripcion}</Text>
                    ) : null}

                    {/* Métrica distancia */}
                    <View className="bg-gray-50 rounded-xl p-4 mb-4">
                        <View className="flex-row justify-center">
                            <View className="items-center">
                                <Ionicons name="trail-sign-outline" size={24} color="#6b7280" />
                                <Text className="text-xs text-gray-500 mt-1">Distancia</Text>
                                <Text className="text-lg font-semibold mt-1">
                                    {formatDistance(ruta.distanciaKm)}
                                </Text>
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
                                Calificaciones ({cals?.length ?? 0})
                            </Text>
                        </View>
                        <Pressable onPress={() => setShowModal(true)}>
                            <View className="flex-row items-center">
                                <Ionicons name="star-outline" size={18} color="#111" />
                                <Text className="ml-1 text-sm font-medium">Calificar</Text>
                            </View>
                        </Pressable>
                    </View>

                    {loadingCals ? (
                        <View className="items-center py-6">
                            <ActivityIndicator />
                        </View>
                    ) : cals.length === 0 ? (
                        <Text className="text-gray-500">Aún no hay calificaciones.</Text>
                    ) : (
                        cals.map((it, idx) => <CalificacionRow key={`${it.id_usuario}-${idx}`} item={it} />)
                    )}
                </View>
            </ScrollView>

            {/* Modal Calificar */}
            <Modal visible={showModal} transparent animationType="slide">
                <View className="flex-1 bg-black/40 items-center justify-end">
                    <View className="bg-white w-full rounded-t-2xl p-5">
                        <View className="items-center mb-3">
                            <Text className="text-lg font-semibold">Calificar Ruta</Text>
                            <Text className="text-gray-500 mt-1">Selecciona tu puntuación</Text>
                        </View>

                        <View className="flex-row items-center justify-center my-3">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Pressable key={s} onPress={() => setMyStars(s)} className="mx-1">
                                    <Ionicons
                                        name={s <= myStars ? "star" : "star-outline"}
                                        size={32}
                                        color={s <= myStars ? "#facc15" : "#9ca3af"}
                                    />
                                </Pressable>
                            ))}
                        </View>

                        <View className="flex-row justify-end mt-2">
                            <Pressable onPress={() => setShowModal(false)} className="px-4 py-3 mr-2">
                                <Text className="text-gray-600 font-medium">Cancelar</Text>
                            </Pressable>
                            <Pressable
                                onPress={handleSubmitRating}
                                className={`px-4 py-3 rounded-xl ${myStars ? "bg-black" : "bg-gray-300"}`}
                                disabled={!myStars}
                            >
                                <Text className="text-white font-semibold">Guardar</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
