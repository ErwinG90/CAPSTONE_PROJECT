import React, { useEffect, useRef, useState } from "react";
import { View, Text, ActivityIndicator, Platform, Pressable, Alert } from "react-native";
import MapView, { Marker, Polyline, MapType, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

import RequestLocationView from "../../src/permissions/RequestLocationView";
import { usePermissionsStore } from "../../src/permissions/store";
import { PermissionStatus } from "../../src/permissions/types";

import { auth } from "../../src/firebaseConfig";
import { getProfile } from "../../src/storage/localCache";
import MapHeader from "../../src/features/map/MapHeader";
import Fab from "../../src/components/Fab";
import { useRouteRecorder } from "../../src/hooks/useRouterRecorder";
import { getDirectionsRoute, snapToRoads } from "../../src/utils/google";

export default function HomeScreen() {
  const { locationStatus } = usePermissionsStore();

  const [displayName, setDisplayName] = useState("Usuario");
  useEffect(() => {
    (async () => {
      const dn = auth.currentUser?.displayName?.trim();
      if (dn) return setDisplayName(dn);
      const cached = await getProfile().catch(() => null);
      const name = [cached?.nombre, cached?.apellido].filter(Boolean).join(" ");
      setDisplayName(name || "Usuario");
    })();
  }, []);

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const mapRef = useRef<MapView>(null);

  const [mapType, setMapType] = useState<MapType>("standard");
  const { recording, points, lastPoint, start, stop, distanceMeters } = useRouteRecorder();

  const [dest, setDest] = useState<{ latitude: number; longitude: number } | null>(null);

  // Ruta de Google (al destino)
  const [routePath, setRoutePath] = useState<{ latitude: number; longitude: number }[] | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);

  // Ruta ajustada a calles de tu grabación (Roads)
  const [snappedPath, setSnappedPath] = useState<{ latitude: number; longitude: number }[] | null>(null);

  useEffect(() => {
    (async () => {
      if (locationStatus !== PermissionStatus.GRANTED) return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(loc);
      mapRef.current?.animateCamera({
        center: { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
        zoom: 15,
      });
    })();
  }, [locationStatus]);

  /* ---------- Toast propio (sin icono del sistema) ---------- */
  const [hint, setHint] = useState<string | null>(null);
  const hintTimer = useRef<NodeJS.Timeout | null>(null);

  function tip(msg: string, ms = 1400) {
    setHint(msg);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(null), ms);
  }

  /* ---------- acciones ---------- */
  const startAndRecenter = async () => {
    if (!location) return;
    setSnappedPath(null); // limpiar snap previo
    await start(location);
    mapRef.current?.animateCamera({
      center: { latitude: location.coords.latitude, longitude: location.coords.longitude },
      zoom: 16,
    });
  };

  const toggleRecording = async () => {
    if (recording) {
      // Detener y hacer snap-to-roads (post-proceso)
      stop();
      try {
        if (points.length > 1) {
          const base = points.map(p => ({ latitude: p.latitude, longitude: p.longitude }));
          const sp = await snapToRoads(base);
          setSnappedPath(sp);
        } else {
          setSnappedPath(null);
        }
      } catch (e: any) {
        console.warn("snapToRoads error:", e);
        Alert.alert("Snap to Roads", String(e?.message ?? e));
      }
    } else {
      await startAndRecenter();
    }
  };

  const recenter = () => {
    const target =
      lastPoint ??
      (location ? { latitude: location.coords.latitude, longitude: location.coords.longitude } : null);
    if (!target) return;
    mapRef.current?.animateCamera({ center: target, zoom: 16 });
  };

  const cycleMapType = () => {
    setMapType((t) => {
      if (t === "standard") return "satellite";
      if (t === "satellite") return Platform.OS === "android" ? "terrain" : "mutedStandard";
      if (t === "terrain") return "standard";
      return "standard";
    });
  };

  const onLongPressMap = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setDest({ latitude, longitude });
    setRoutePath(null);
    setRouteInfo(null);
    tip("Destino marcado. Toca “Trazar ruta al destino”.");
  };

  // Trazar ruta al destino (Routes API v2)
  async function traceRouteToDest() {
    if (!dest) {
      tip("Marca un destino con una pulsación larga en el mapa");
      return;
    }
    if (recording) stop(); // opcional
    setRoutePath(null);
    setRouteInfo(null);

    const origin =
      lastPoint ??
      (location ? { latitude: location.coords.latitude, longitude: location.coords.longitude } : null);

    if (!origin) {
      tip("Aún no tengo tu ubicación. Inténtalo en unos segundos");
      return;
    }

    try {
      const r = await getDirectionsRoute({ origin, destination: dest, mode: "walking" });
      setRoutePath(r.path);
      setRouteInfo({ distance: r.distanceMeters, duration: r.durationSeconds });
      mapRef.current?.animateCamera({ center: dest, zoom: 16 });
    } catch (e: any) {
      console.warn("traceRouteToDest error:", e);
      Alert.alert("Error al trazar ruta", String(e?.message ?? e));
    }
  }

  /* ---------- UI ---------- */
  if (locationStatus !== PermissionStatus.GRANTED) return <RequestLocationView />;

  if (!location) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8, color: "#6b7280" }}>Obteniendo ubicación…</Text>
      </View>
    );
  }

  const { latitude, longitude } = location.coords;

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <MapHeader displayName={displayName} />

      {/* Botones arriba */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <Pressable
          onPress={() => {
            tip(recording ? "Detener grabación y ajustar a calles" : "Comenzar a grabar tu ruta");
            toggleRecording();
          }}
          style={{
            marginTop: 10, backgroundColor: "#0B0B14", borderRadius: 12, height: 44,
            alignItems: "center", justifyContent: "center", flexDirection: "row",
          }}
        >
          <Ionicons
            name={recording ? "stop-circle" : "play-circle"}
            size={18}
            color="white"
          />
          <Text style={{ color: "white", marginLeft: 8, fontWeight: "600" }}>
            {recording ? "Detener y ajustar a calles" : "Iniciar Nueva Ruta"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            tip("Trazando ruta por calles hasta el destino");
            traceRouteToDest();
          }}
          disabled={!dest}
          style={{
            marginTop: 8,
            backgroundColor: dest ? "#111827" : "#9CA3AF",
            borderRadius: 12,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            opacity: dest ? 1 : 0.8,
          }}
        >
          <Ionicons name="navigate-outline" size={16} color="white" />
          <Text style={{ color: "white", marginLeft: 8, fontWeight: "600" }}>
            Trazar ruta al destino
          </Text>
        </Pressable>

        {!!routeInfo && (
          <Text style={{ marginTop: 6, color: "#374151" }}>
            Distancia: {(routeInfo.distance / 1000).toFixed(2)} km · Tiempo: {Math.round(routeInfo.duration / 60)} min
          </Text>
        )}
      </View>

      {/* MAPA */}
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          mapType={mapType}
          showsUserLocation
          showsCompass
          rotateEnabled
          showsMyLocationButton={Platform.OS === "android"}
          onLongPress={onLongPressMap}
          initialRegion={{
            latitude,
            longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          {/* Mi ubicación */}
          <Marker
            coordinate={{ latitude, longitude }}
            title="Tú"
            description="Ubicación actual"
            pinColor="green"
          />

          {/* Polyline de la grabación cruda (solo si no hay snapped) */}
          {points.length > 1 && !snappedPath && (
            <Polyline
              coordinates={points.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))}
              strokeWidth={4}
            />
          )}

          {/* Polyline ajustada a calles (Roads API) */}
          {snappedPath && snappedPath.length > 1 && (
            <Polyline coordinates={snappedPath} strokeWidth={5} />
          )}

          {/* Polyline de la ruta de Google al destino */}
          {routePath && routePath.length > 1 && (
            <Polyline coordinates={routePath} strokeWidth={5} />
          )}

          {/* Marcadores inicio/fin de grabación */}
          {!recording && points.length > 0 && (
            <>
              <Marker
                coordinate={{ latitude: points[0].latitude, longitude: points[0].longitude }}
                title="Inicio"
                pinColor="blue"
              />
              <Marker
                coordinate={{
                  latitude: points[points.length - 1].latitude,
                  longitude: points[points.length - 1].longitude,
                }}
                title="Fin"
                pinColor="red"
              />
            </>
          )}

          {/* Destino marcado */}
          {dest && (
            <Marker
              coordinate={dest}
              title="Destino"
              description="Marcado por pulsación larga"
              pinColor="purple"
            />
          )}
        </MapView>

        {/* HUD */}
        <View
          style={{
            position: "absolute", alignSelf: "center", top: 12,
            backgroundColor: "white", borderRadius: 14,
            paddingHorizontal: 14, paddingVertical: 8,
            borderWidth: 1, borderColor: "#e5e7eb",
            flexDirection: "row", alignItems: "center", gap: 8,
          }}
        >
          <Ionicons name="compass-outline" size={16} color="#10b981" />
          <Text style={{ color: "#111827", fontWeight: "600" }}>
            GPS conectado y listo
          </Text>
        </View>

        {/* Panel izq. (info) */}
        <View style={{ position: "absolute", left: 12, bottom: 20 }}>
          <View
            style={{
              backgroundColor: "white", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
              borderWidth: 1, borderColor: "#e5e7eb",
            }}
          >
            <Text style={{ fontWeight: "700", color: "#111827" }}>Ruta</Text>
            <Text style={{ color: "#374151", fontSize: 12 }}>Puntos: {points.length}</Text>
            <Text style={{ color: "#374151", fontSize: 12 }}>
              Distancia: {(distanceMeters / 1000).toFixed(2)} km
            </Text>
          </View>
        </View>

        {/* FABs con tips (sin icono del sistema) */}
        <View style={{ position: "absolute", right: 12, bottom: 20, gap: 10 }}>
          <Fab
            onPress={() => { tip("Cambiar tipo de mapa"); cycleMapType(); }}
            onLongPress={() => tip("Alterna entre estándar, satélite y terreno")}
          >
            <Ionicons name="layers-outline" size={20} color="#111827" />
          </Fab>

          <Fab
            onPress={() => { tip("Centrar en mi ubicación"); recenter(); }}
            onLongPress={() => tip("Vuelve a centrar la cámara en tu posición")}
          >
            <Ionicons name="locate" size={20} color="#111827" />
          </Fab>

          {recording ? (
            <Fab
              onPress={() => { tip("Detener grabación"); toggleRecording(); }}
              onLongPress={() => tip("Finaliza la grabación y ajusta a calles")}
              active
            >
              <Ionicons name="stop" size={20} color="#ef4444" />
            </Fab>
          ) : (
            <Fab
              onPress={() => { tip("Iniciar grabación"); startAndRecenter(); }}
              onLongPress={() => tip("Comienza a registrar tu recorrido")}
            >
              <Ionicons name="play" size={20} color="#111827" />
            </Fab>
          )}

          {dest && (
            <Fab
              onPress={() => {
                tip("Limpiar destino y ruta");
                setDest(null); setRoutePath(null); setRouteInfo(null);
              }}
              onLongPress={() => tip("Quita el pin morado y la polilínea de Google")}
            >
              <Ionicons name="trash-outline" size={20} color="#111827" />
            </Fab>
          )}
        </View>

        {/* --- Toast overlay propio --- */}
        {hint && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              bottom: 90,
              alignSelf: "center",
              backgroundColor: "rgba(17,17,17,0.92)",
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 12,
              maxWidth: "85%",
            }}
          >
            <Text style={{ color: "white", fontWeight: "600", textAlign: "center" }}>{hint}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
