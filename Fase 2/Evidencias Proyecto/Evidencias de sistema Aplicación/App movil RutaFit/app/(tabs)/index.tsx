import React, { useEffect, useRef, useState } from "react";
import { View, Text, ActivityIndicator, Platform, Pressable } from "react-native";
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
import { getDirectionsRoute } from "../../src/utils/google";        

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
  const {
    recording, points, lastPoint, start, stop, distanceMeters, isSimulating, simulatePath,
  } = useRouteRecorder();

  const [dest, setDest] = useState<{ latitude: number; longitude: number } | null>(null);

  // ➕ ruta de Google + info
  const [routePath, setRoutePath] = useState<{ latitude: number; longitude: number }[] | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);

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

  /* ---------- helpers de simulación ---------- */
  const projectMeters = (
    origin: { latitude: number; longitude: number },
    distanceM: number,
    bearingDeg: number
  ) => {
    const R = 6371000;
    const brng = (bearingDeg * Math.PI) / 180;
    const lat1 = (origin.latitude * Math.PI) / 180;
    const lon1 = (origin.longitude * Math.PI) / 180;
    const angDist = distanceM / R;

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angDist) +
        Math.cos(lat1) * Math.sin(angDist) * Math.cos(brng)
    );

    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(brng) * Math.sin(angDist) * Math.cos(lat1),
        Math.cos(angDist) - Math.sin(lat1) * Math.sin(lat2)
      );

    return { latitude: (lat2 * 180) / Math.PI, longitude: (lon2 * 180) / Math.PI };
  };

  const buildLinearPathByDistance = (
    startPoint: { latitude: number; longitude: number },
    totalMeters = 1000,
    segments = 80,
    bearingDeg = 60
  ) => {
    const pts: { latitude: number; longitude: number }[] = [];
    for (let i = 0; i <= segments; i++) {
      const d = (totalMeters * i) / segments;
      pts.push(projectMeters(startPoint, d, bearingDeg));
    }
    return pts;
  };

  const startDemo1km = async () => {
    const base =
      lastPoint ??
      (location ? { latitude: location.coords.latitude, longitude: location.coords.longitude } : null);
    if (!base) return;
    const path = buildLinearPathByDistance(base, 1000, 80, 60);
    await simulatePath(
      path,
      (p) => mapRef.current?.animateCamera({ center: p, zoom: 16 }),
      200
    );
  };

  /* ---------- acciones ---------- */
  const startAndRecenter = async () => {
    if (!location) return;
    await start(location);
    mapRef.current?.animateCamera({
      center: { latitude: location.coords.latitude, longitude: location.coords.longitude },
      zoom: 16,
    });
  };

  const toggleRecording = async () => {
    if (recording || isSimulating) stop();
    else await startAndRecenter();
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
    // limpiar ruta anterior si marcas nuevo destino
    setRoutePath(null);
    setRouteInfo(null);
  };

  // ➕ calcular ruta al destino (Routes API v2)
  async function traceRouteToDest() {
    if (!dest) return;
    const origin =
      lastPoint ??
      (location ? { latitude: location.coords.latitude, longitude: location.coords.longitude } : null);
    if (!origin) return;

    try {
      const r = await getDirectionsRoute({
        origin,
        destination: dest,
        mode: "walking", // o "driving" | "bicycling"
      });
      setRoutePath(r.path);
      setRouteInfo({ distance: r.distanceMeters, duration: r.durationSeconds });
      mapRef.current?.animateCamera({ center: dest, zoom: 16 });
    } catch (e) {
      console.warn(String(e));
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
  const distanceKm = (distanceMeters / 1000).toFixed(2);

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <MapHeader displayName={displayName} />

      {/* Botones arriba */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <Pressable
          onPress={toggleRecording}
          style={{
            marginTop: 10, backgroundColor: "#0B0B14", borderRadius: 12, height: 44,
            alignItems: "center", justifyContent: "center", flexDirection: "row",
          }}
        >
          <Ionicons
            name={recording || isSimulating ? "stop-circle" : "play-circle"}
            size={18}
            color="white"
          />
          <Text style={{ color: "white", marginLeft: 8, fontWeight: "600" }}>
            {recording || isSimulating ? "Detener ruta" : "Iniciar Nueva Ruta"}
          </Text>
        </Pressable>

        <Pressable
          onPress={startDemo1km}
          disabled={recording || isSimulating}
          style={{
            marginTop: 8,
            backgroundColor: recording || isSimulating ? "#9CA3AF" : "#111827",
            borderRadius: 12,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            opacity: recording || isSimulating ? 0.8 : 1,
          }}
        >
          <Ionicons name="walk-outline" size={16} color="white" />
          <Text style={{ color: "white", marginLeft: 8, fontWeight: "600" }}>
            Simular
          </Text>
        </Pressable>

        {/* ➕ botón para trazar la ruta de Google al destino marcado */}
        <Pressable
          onPress={traceRouteToDest}
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
          <Marker
            coordinate={{ latitude, longitude }}
            title="Tú"
            description="Ubicación actual"
            pinColor="green"
          />

          {/* Polyline del recorder */}
          {points.length > 1 && (
            <Polyline
              coordinates={points.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))}
              strokeWidth={4}
            />
          )}

          {/* ➕ Polyline de la ruta de Google */}
          {routePath && routePath.length > 1 && (
            <Polyline coordinates={routePath} strokeWidth={5} />
          )}

          {!recording && !isSimulating && points.length > 0 && (
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
            {isSimulating ? "Simulación en curso" : "GPS conectado y listo"}
          </Text>
        </View>

        {/* HUD izquierda */}
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

        {/* FABs */}
        <View style={{ position: "absolute", right: 12, bottom: 20, gap: 10 }}>
          <Fab onPress={cycleMapType}><Ionicons name="layers-outline" size={20} color="#111827" /></Fab>
          <Fab onPress={recenter}><Ionicons name="locate" size={20} color="#111827" /></Fab>
          {(recording || isSimulating)
            ? <Fab onPress={stop} active><Ionicons name="stop" size={20} color="#ef4444" /></Fab>
            : <Fab onPress={startAndRecenter}><Ionicons name="play" size={20} color="#111827" /></Fab>}
          {dest && <Fab onPress={() => setDest(null)}><Ionicons name="trash-outline" size={20} color="#111827" /></Fab>}
          {routePath && (
            <Fab onPress={() => { setRoutePath(null); setRouteInfo(null); }}>
              <Ionicons name="close-outline" size={20} color="#111827" />
            </Fab>
          )}
        </View>
      </View>
    </View>
  );
}
