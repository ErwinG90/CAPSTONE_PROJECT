// app/(tabs)/rutas.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import MultiSlider from "@ptomasroos/react-native-multi-slider";

import { auth } from "../../src/firebaseConfig";
import { getProfile } from "../../src/storage/localCache";
import { rutaService } from "../../services/RutaService";

/** ===== Tipos UI ===== */
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
  fechaCreacion?: string | Date;
  recorrido?: { type: "LineString"; coordinates: [number, number][] };
  publico?: boolean;
};

type SortMode = "todas" | "fecha_desc" | "fecha_asc";

/** ===== Helpers ===== */
const fmtKm = (v?: number) => (typeof v === "number" ? `${v.toFixed(1)} km` : "—");
const fmtRating = (r?: number, c?: number) =>
  r == null ? "—" : `${r.toFixed(1)}${c ? ` (${c})` : ""}`;

function adaptRutaToUI(r: any): RutaUI {
  const x = r as any;
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
    fechaCreacion: r.fecha_creacion ?? undefined,
    recorrido: r.recorrido,
    publico: x.publico !== false,
  };
}

/** ===== Item de ruta ===== */
function RouteRow({
  ruta,
  onPress,
  showDelete,
  onDelete,
  publico,
  onTogglePublico,
}: {
  ruta: RutaUI;
  onPress?: () => void;
  showDelete?: boolean;
  onDelete?: () => void;
  publico?: boolean;
  onTogglePublico?: (v: boolean) => void;
}) {
  const [isPressed, setIsPressed] = React.useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      className={`rounded-2xl bg-white mb-4 px-5 py-4 shadow-sm ${
        isPressed ? "border-2 border-green-500" : "border border-gray-200"
      }`}
      android_ripple={{ color: "#bbf7d0", borderless: false }}
    >
      <View className="flex-row items-stretch">
        <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mr-3 mt-1">
          <Ionicons name="map-outline" size={18} />
        </View>

        <View className="flex-1 mr-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold flex-1 mr-2" numberOfLines={1}>
              {ruta.nombre}
            </Text>

            <View className="flex-row items-center">
              <View className="flex-row items-center mr-2">
                <Ionicons name="star" size={14} color="#facc15" />
                <Text className="text-xs ml-1 text-gray-700">
                  {fmtRating(ruta.rating, ruta.ratingCount)}
                </Text>
              </View>

              {showDelete && (
                <View
                  className={`px-2 py-1 rounded-full ${
                    publico ? "bg-green-50 border border-green-200" : "bg-gray-100 border border-gray-200"
                  }`}
                >
                  <Text className={`text-[11px] ${publico ? "text-green-700" : "text-gray-600"}`}>
                    {publico ? "Pública" : "Privada"}
                  </Text>
                </View>
              )}
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

          {showDelete && (
            <View className="mt-3 border-t border-gray-100 pt-3">
              <View className="flex-row items-center">
                <Pressable
                  onPress={() => onTogglePublico?.(!publico)}
                  hitSlop={8}
                  className="flex-1 h-9 mr-2 rounded-full border border-gray-300 bg-white items-center justify-center"
                  android_ripple={{ color: "#e5e7eb" }}
                >
                  <View className="flex-row items-center">
                    <Ionicons
                      name={publico ? "lock-closed-outline" : "earth-outline"}
                      size={14}
                      color={publico ? "#6b7280" : "#16a34a"}
                    />
                    <Text
                      className={`ml-2 text-[13px] font-semibold ${
                        publico ? "text-gray-600" : "text-green-600"
                      }`}
                    >
                      {publico ? "Hacer Privada" : "Hacer Pública"}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={onDelete}
                  hitSlop={8}
                  className="flex-row items-center justify-center h-9 px-3 rounded-full bg-red-600 active:bg-red-700 border border-red-700/20"
                  android_ripple={{ color: "#fecaca" }}
                >
                  <Ionicons name="trash-outline" size={14} color="#fff" />
                  <Text className="ml-2 text-white text-[13px] font-semibold">Eliminar</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

/** ===== Select compacto (desplegable) ===== */
function SelectRow({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between px-3 py-3 rounded-xl border border-gray-300 bg-white"
      >
        <View>
          <Text className="text-xs text-gray-500">{label}</Text>
          <Text className="text-[14px] font-medium mt-0.5">{value}</Text>
        </View>
        <Ionicons name="chevron-down" size={16} color="#6b7280" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/30" onPress={() => setOpen(false)}>
          <View className="absolute left-6 right-6 top-28 bg-white rounded-2xl p-6">
            <Text className="text-base font-semibold mb-3">{label}</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {options.map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => {
                    onSelect(opt);
                    setOpen(false);
                  }}
                  className="py-3"
                >
                  <Text className="text-[15px]">{opt}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              onPress={() => setOpen(false)}
              className="mt-5 self-end px-4 py-2 rounded-full bg-gray-100"
            >
              <Text className="text-[13px]">Cerrar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

/** ===== Modal de Filtros (compacto con slider de rango) ===== */
function FilterModal({
  visible,
  onClose,
  values,
  onChange,
  onApply,
  onClear,
}: {
  visible: boolean;
  onClose: () => void;
  values: { sort: SortMode; deporte: string; nivel: string; minKm: number; maxKm: number };
  onChange: (patch: Partial<{ sort: SortMode; deporte: string; nivel: string; minKm: number; maxKm: number }>) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  const { sort, deporte, nivel, minKm, maxKm } = values;

  const labelSort =
    sort === "fecha_desc" ? "Más recientes" : sort === "fecha_asc" ? "Más antiguas" : "Todas las fechas";
  const Deportes = ["Todos", "Senderismo", "Ciclismo", "Running", "Trekking"];
  const Niveles = ["Todas", "Fácil", "Media", "Difícil"];

  // ancho responsivo para el slider (márgenes aproximados del modal)
  const sliderLength = Math.max(220, Math.min(320, Dimensions.get("window").width - 96));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/30" onPress={onClose}>
        <View className="absolute left-6 right-6 top-24 bg-white rounded-2xl p-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-semibold">Filtrar Rutas</Text>
            <Pressable hitSlop={10} onPress={onClose}>
              <Ionicons name="close" size={20} />
            </Pressable>
          </View>

          <View className="gap-3 mt-2">
            <SelectRow
              label="Ordenar por fecha"
              value={labelSort}
              options={["Todas las fechas", "Más recientes", "Más antiguas"]}
              onSelect={(v) =>
                onChange({
                  sort: v === "Más recientes" ? "fecha_desc" : v === "Más antiguas" ? "fecha_asc" : "todas",
                })
              }
            />
            <SelectRow
              label="Tipo de deporte"
              value={deporte}
              options={Deportes}
              onSelect={(v) => onChange({ deporte: v })}
            />
            <SelectRow
              label="Dificultad"
              value={nivel}
              options={Niveles}
              onSelect={(v) => onChange({ nivel: v })}
            />

            {/* Distancia (slider rango) */}
            <View className="px-3 py-3 rounded-xl border border-gray-300 bg-white">
              <Text className="text-xs text-gray-500">Distancia (km)</Text>
              <Text className="mt-1 text-[14px] font-medium">{`${minKm} – ${maxKm} km`}</Text>
              <View style={{ marginTop: 12 }}>
                <MultiSlider
                  values={[minKm, maxKm]}
                  min={0}
                  max={100} // ajusta el tope si lo necesitas
                  step={1}
                  sliderLength={sliderLength}
                  allowOverlap={false}
                  snapped
                  onValuesChange={(vals: number[]) => {
                    const [mi, ma] = vals;
                    onChange({ minKm: mi, maxKm: ma });
                  }}
                  selectedStyle={{}}
                  unselectedStyle={{}}
                  markerStyle={{ height: 22, width: 22, borderRadius: 22 }}
                  pressedMarkerStyle={{ height: 24, width: 24, borderRadius: 24 }}
                  containerStyle={{ alignSelf: "center" }}
                  trackStyle={{ height: 4, borderRadius: 2 }}
                />
                <View className="flex-row justify-between mt-2">
                  <Text className="text-[12px] text-gray-500">0 km</Text>
                  <Text className="text-[12px] text-gray-500">100 km</Text>
                </View>
              </View>
            </View>
          </View>

          <View className="flex-row mt-6">
            <Pressable
              onPress={onClear}
              className="flex-1 mr-3 px-4 py-3 rounded-full border border-gray-300 bg-white items-center"
            >
              <Text className="font-medium">Limpiar</Text>
            </Pressable>
            <Pressable onPress={onApply} className="flex-1 ml-3 px-4 py-3 rounded-full bg-black items-center">
              <Text className="text-white font-semibold">Aplicar Filtros</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

/** ===== Pantalla ===== */
export default function RutasScreen() {
  const router = useRouter();

  const [tab, setTab] = useState<"todas" | "mias" | "populares">("todas");

  // filtros (solo “todas”)
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("todas");
  const [fDeporte, setFDeporte] = useState<string>("Todos");
  const [fNivel, setFNivel] = useState<string>("Todas");
  const [fMinKm, setFMinKm] = useState<number>(0);
  const [fMaxKm, setFMaxKm] = useState<number>(100);

  const [list, setList] = useState<RutaUI[]>([]);
  const [allList, setAllList] = useState<RutaUI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [currentUid, setCurrentUid] = useState<string>(auth.currentUser?.uid ?? "");

  useEffect(() => {
    (async () => {
      if (!currentUid) {
        const profile = await getProfile().catch(() => null);
        const uidFromCache = (profile as any)?.uid;
        if (uidFromCache) setCurrentUid(uidFromCache);
      }
    })();
  }, [currentUid]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, currentUid]);

  const aplicarFiltros = useCallback(() => {
    if (tab !== "todas") return;

    let base = [...allList].filter((r) => r.publico !== false);

    if (fDeporte !== "Todos") {
      base = base.filter((r) => (r.deporte ?? "").toLowerCase() === fDeporte.toLowerCase());
    }
    if (fNivel !== "Todas") {
      base = base.filter((r) => (r.nivel ?? "").toLowerCase() === fNivel.toLowerCase());
    }

    base = base.filter((r) => {
      const d = r.distanciaKm ?? Number.POSITIVE_INFINITY;
      return d >= fMinKm && d <= fMaxKm;
    });

    if (sortMode === "fecha_desc") {
      base.sort(
        (a, b) =>
          new Date(b.fechaCreacion ?? 0).getTime() - new Date(a.fechaCreacion ?? 0).getTime()
      );
    } else if (sortMode === "fecha_asc") {
      base.sort(
        (a, b) =>
          new Date(a.fechaCreacion ?? 0).getTime() - new Date(b.fechaCreacion ?? 0).getTime()
      );
    }

    setList(base);
  }, [tab, allList, fDeporte, fNivel, fMinKm, fMaxKm, sortMode]);

  useEffect(() => {
    aplicarFiltros();
  }, [aplicarFiltros]);

  const togglePublico = async (ruta: RutaUI, nuevo: boolean) => {
    setList((prev) => prev.map((x) => (x.id === ruta.id ? { ...x, publico: nuevo } : x)));
    setAllList((prev) => prev.map((x) => (x.id === ruta.id ? { ...x, publico: nuevo } : x)));

    try {
      await rutaService.updatePublico(ruta.id, nuevo);
    } catch (e: any) {
      setList((prev) => prev.map((x) => (x.id === ruta.id ? { ...x, publico: !nuevo } : x)));
      setAllList((prev) => prev.map((x) => (x.id === ruta.id ? { ...x, publico: !nuevo } : x)));
      Alert.alert("No se pudo actualizar", String(e?.message ?? e));
    }
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (tab === "todas") {
        const res = await rutaService.getRutas();
        const arr = Array.isArray((res as any)?.data) ? (res as any).data : (Array.isArray(res) ? res : []);
        const mapped: RutaUI[] = arr.map(adaptRutaToUI);
        setAllList(mapped);
        setList(mapped.filter((r) => r.publico !== false));
      } else if (tab === "mias") {
        if (!currentUid) {
          setList([]);
          setError("Inicia sesión para ver tus rutas.");
        } else {
          const data = await rutaService.getMisRutas(currentUid, 1, 50);
          const arr = Array.isArray((data as any)?.data) ? (data as any).data : (Array.isArray(data) ? data : []);
          setList((arr ?? []).map(adaptRutaToUI));
        }
      } else if (tab === "populares") {
        const data = await rutaService.getRutasPopulares(20, 1);
        const arr = Array.isArray((data as any)?.data) ? (data as any).data : (Array.isArray(data) ? data : []);
        const mapped: RutaUI[] = (arr ?? []).map(adaptRutaToUI);
        setList(mapped.filter((r) => r.publico !== false));
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "No se pudieron cargar las rutas.");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [tab, currentUid]);

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

  const confirmEliminar = (ruta: RutaUI) => {
    Alert.alert("Eliminar ruta", `¿Seguro que deseas eliminar “${ruta.nombre}”?`, [
      { text: "No", style: "cancel" },
      { text: "Sí, eliminar", style: "destructive", onPress: () => doDelete(ruta) },
    ]);
  };

  const doDelete = async (ruta: RutaUI) => {
    try {
      await rutaService.eliminarRuta(ruta.id, currentUid);
      setList((prev) => prev.filter((x) => x.id !== ruta.id));
      setAllList((prev) => prev.filter((x) => x.id !== ruta.id));
    } catch (e: any) {
      Alert.alert("No se pudo eliminar", String(e?.message ?? e));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4">
        <View>
          <Text className="text-3xl font-bold text-green-500 drop-shadow-lg">Rutafit</Text>
          <Text className="text-sm text-black-500 mt-1">{headerSubtitle}</Text>
        </View>

        {/* Botón Filtros (solo en Todas) */}
        {tab === "todas" ? (
          <Pressable
            onPress={() => setFiltersOpen(true)}
            className="flex-row items-center px-3 py-2 rounded-full border border-gray-300 bg-white"
          >
            <Ionicons name="funnel-outline" size={16} />
            <Text className="ml-2 text-[13px] font-medium">Filtros</Text>
          </Pressable>
        ) : (
          <View style={{ width: 1 }} />
        )}
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
            <Text className={`text-center font-medium ${tab === t ? "text-black" : "text-gray-500"}`}>
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
            {tab === "mias"
              ? "Aún no tienes rutas creadas"
              : tab === "populares"
              ? "Aún no hay rutas con valoraciones"
              : "No hay rutas disponibles"}
          </Text>
        ) : (
          list.map((r) => (
            <RouteRow
              key={r.id}
              ruta={r}
              onPress={() =>
                router.push({ pathname: "/ruta/[id]", params: { id: r.id, data: JSON.stringify(r) } })
              }
              showDelete={tab === "mias"}
              onDelete={() => confirmEliminar(r)}
              publico={r.publico}
              onTogglePublico={(v) => togglePublico(r, v)}
            />
          ))
        )}
      </ScrollView>

      {/* Modal de Filtros */}
      <FilterModal
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        values={{ sort: sortMode, deporte: fDeporte, nivel: fNivel, minKm: fMinKm, maxKm: fMaxKm }}
        onChange={(p) => {
          if (p.sort !== undefined) setSortMode(p.sort);
          if (p.deporte !== undefined) setFDeporte(p.deporte);
          if (p.nivel !== undefined) setFNivel(p.nivel);
          if (p.minKm !== undefined) setFMinKm(p.minKm);
          if (p.maxKm !== undefined) setFMaxKm(p.maxKm);
        }}
        onApply={() => {
          aplicarFiltros();
          setFiltersOpen(false);
        }}
        onClear={() => {
          setSortMode("todas");
          setFDeporte("Todos");
          setFNivel("Todas");
          setFMinKm(0);
          setFMaxKm(100);
        }}
      />
    </SafeAreaView>
  );
}
