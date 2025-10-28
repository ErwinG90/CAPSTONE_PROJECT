import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../src/firebaseConfig";
import { getProfile } from "../../src/storage/localCache";
import { rutaService } from "../../services/RutaService";

/** ===== Tipos UI mínimos ===== */
type RutaUI = {
  id: string;
  nombre: string;
  descripcion?: string;
  deporte?: string;
  nivel?: string;
  distanciaKm?: number;
  rating?: number;
  ratingCount?: number;
  creadorId?: string;
};

/** ===== Helpers ===== */
const fmtKm = (v?: number) => (typeof v === "number" ? `${v.toFixed(1)} km` : "—");
const fmtRating = (r?: number, c?: number) =>
  r == null ? "—" : `${r.toFixed(1)}${c ? ` (${c})` : ""}`;

/** Mapear documento/DTO del backend -> UI */
function adaptRutaToUI(r: any): RutaUI {
  return {
    id: r._id ?? r.id ?? String(Math.random()),
    nombre: r.nombre_ruta ?? r.nombre ?? "Ruta",
    descripcion: r.descripcion ?? "",
    deporte: r.tipo_deporte ?? r.deporte ?? undefined,
    nivel: r.nivel_dificultad ?? r.nivel ?? undefined,
    distanciaKm: r.distancia_km ?? r.distanciaKm ?? undefined,
    rating: r.promedio_valoracion ?? r.rating ?? undefined,
    ratingCount: Array.isArray(r.valoraciones) ? r.valoraciones.length : undefined,
    creadorId: r.id_creador ?? r.creadorId ?? undefined,
  };
}

/** ===== Card ===== */
function RouteRow({ ruta, onPress }: { ruta: RutaUI; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl bg-white border border-gray-200 mb-4 px-5 py-4"
      android_ripple={{ color: "#e5e7eb" }}
    >
      <View className="flex-row items-start">
        <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mr-3">
          <Ionicons name="map-outline" size={18} />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold" numberOfLines={1}>
              {ruta.nombre}
            </Text>
            <View className="flex-row items-center ml-2">
              <Ionicons name="star" size={14} color="#facc15" />
              <Text className="text-xs ml-1 text-gray-700">
                {fmtRating(ruta.rating, ruta.ratingCount)}
              </Text>
            </View>
          </View>

          {!!ruta.descripcion && (
            <Text className="text-xs text-gray-600 mt-1" numberOfLines={2}>
              {ruta.descripcion}
            </Text>
          )}

          <View className="flex-row gap-2 mt-2">
            {!!ruta.deporte && (
              <View className="px-2 py-1 rounded-full bg-gray-100">
                <Text className="text-[11px] text-gray-700">{ruta.deporte}</Text>
              </View>
            )}
            {!!ruta.nivel && (
              <View className="px-2 py-1 rounded-full bg-gray-100">
                <Text className="text-[11px] text-gray-700">{ruta.nivel}</Text>
              </View>
            )}
          </View>

          <View className="flex-row justify-between mt-4">
            <View className="items-center">
              <Ionicons name="trail-sign-outline" size={16} />
              <Text className="text-[11px] text-gray-500 mt-1">Distancia</Text>
              <Text className="text-xs font-medium">{fmtKm(ruta.distanciaKm)}</Text>
            </View>
            <View className="items-center opacity-0">
              <Ionicons name="time-outline" size={16} />
              <Text className="text-[11px] mt-1">—</Text>
              <Text className="text-xs">—</Text>
            </View>
            <View className="items-center opacity-0">
              <Ionicons name="speedometer-outline" size={16} />
              <Text className="text-[11px] mt-1">—</Text>
              <Text className="text-xs">—</Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/** ===== Pantalla ===== */
export default function RutasScreen() {
  const [tab, setTab] = useState<"todas" | "mias" | "populares">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [list, setList] = useState<RutaUI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [currentUid, setCurrentUid] = useState<string>(auth.currentUser?.uid ?? "");

  // intentar sacar uid desde cache si auth aún no está listo
  useEffect(() => {
    (async () => {
      if (!currentUid) {
        const profile = await getProfile().catch(() => null);
        const uidFromCache = (profile as any)?.uid;
        if (uidFromCache) setCurrentUid(uidFromCache);
      }
    })();
  }, [currentUid]);

  // Debounce para búsqueda
  const searchTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (tab !== "todas" && tab !== "mias") return; // populares aún no implementado
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      load();
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, currentUid]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (tab === "todas") {
        const res = await rutaService.getRutas(); // Ruta[]
        setList(res.map(adaptRutaToUI));
      } else if (tab === "mias") {
        if (!currentUid) {
          setList([]);
          setError("Inicia sesión para ver tus rutas.");
        } else {
          const data = await rutaService.getMisRutas(currentUid, 1, 50, busqueda);
          setList((data ?? []).map(adaptRutaToUI));
        }
      } else {
        // Populares: implementa cuando tengas endpoint
        setList([]);
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "No se pudieron cargar las rutas.");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [tab, busqueda, currentUid]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const headerSubtitle = useMemo(
    () =>
      tab === "todas"
        ? "Descubre y explora rutas increíbles"
        : tab === "mias"
        ? "Tus rutas creadas o guardadas"
        : "Rutas más valoradas",
    [tab]
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4">
        <View>
          <Text className="text-3xl font-bold text-green-500 drop-shadow-lg">Rutafit</Text>
          <Text className="text-sm text-black-500 mt-1">{headerSubtitle}</Text>
        </View>
        <View style={{ width: 1 }} />
      </View>

      {/* Buscador */}
      <View className="px-6 mb-3">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2">
          <Ionicons name="search" size={18} />
          <TextInput
            placeholder="Buscar rutas..."
            value={busqueda}
            onChangeText={setBusqueda}
            onSubmitEditing={load}
            className="flex-1 ml-2"
            returnKeyType="search"
          />
          {busqueda.length > 0 && (
            <Pressable
              onPress={() => {
                setBusqueda("");
                load();
              }}
            >
              <Ionicons name="close-circle" size={18} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row mx-6 mb-4">
        {(["todas", "mias", "populares"] as const).map((t, i) => (
          <Pressable
            key={t}
            onPress={() => {
              if (tab === t) load();
              else setTab(t);
            }}
            className={`flex-1 py-3 px-4 rounded-full ${
              i === 0 ? "mr-2" : i === 2 ? "ml-2" : "mx-2"
            } ${tab === t ? "bg-gray-200" : "bg-transparent"}`}
          >
            <Text
              className={`text-center font-medium ${
                tab === t ? "text-black" : "text-gray-500"
              }`}
            >
              {t === "todas" ? "Todas" : t === "mias" ? "Mis Rutas" : "Populares"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Lista */}
      <ScrollView
        className="flex-1 px-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View className="items-center justify-center h-40">
            <ActivityIndicator size="large" color="#111" />
            <Text className="mt-2 text-gray-500">Cargando rutas...</Text>
          </View>
        ) : error ? (
          <Text className="text-red-500 text-center mt-20 px-4">{error}</Text>
        ) : list.length === 0 ? (
          <Text className="text-gray-400 text-center mt-20">
            {tab === "mias" ? "Aún no tienes rutas creadas" : "No hay rutas disponibles"}
          </Text>
        ) : (
          list.map((r) => (
            <RouteRow
              key={r.id}
              ruta={r}
              onPress={() =>
                Platform.OS === "web"
                  ? alert(`Abrir detalles de: ${r.nombre}`)
                  : Alert.alert("Detalles", r.nombre)
              }
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
