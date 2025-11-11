import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ActivityIndicator, Platform, Pressable, Alert } from "react-native";
import MapView, { Marker, Polyline, MapType, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

import RequestLocationView from "../../src/permissions/RequestLocationView";
import { usePermissionsStore } from "../../src/permissions/store";
import { PermissionStatus } from "../../src/permissions/types";

import { auth } from "../../src/firebaseConfig";
import { getProfile } from "../../src/storage/localCache";
import MapHeader from "../../src/features/map/MapHeader";
import { useFollowStore } from "../../src/features/follow/store";
import Fab from "../../src/components/Fab";
import { useRouteRecorder } from "../../src/hooks/useRouterRecorder";
import { getDirectionsRoute, snapToRoads } from "../../src/utils/google";
import { TrackPoint } from "../../src/hooks/useRouterRecorder";

import GuardarRutaForm from "../../src/components/GuardarRutaForm";

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
  const { recording, points, lastPoint, start, stop, reset, distanceMeters } = useRouteRecorder();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [puntosRecorrido, setPuntosRecorrido] = useState<TrackPoint[]>([]);
  const [distancia, setDistancia] = useState(0);

  // Agrega este useEffect justo después:
  useEffect(() => {
    console.log("Puntos de la ruta:", points);
  }, [points]);

  const [dest, setDest] = useState<{ latitude: number; longitude: number } | null>(null);

  // Follow Mode: ruta seleccionada desde el detalle (no invasivo por defecto)
  const followingRoute = useFollowStore((s) => s.followingRoute);
  const clearFollowingRoute = useFollowStore((s) => s.clearFollowingRoute);
  const followPolyline = React.useMemo(() => {
    if (!followingRoute?.coordinates?.length) return null;
    const mapped = followingRoute.coordinates
      .map(([lng, lat]) => {
        const lon = Number(lng);
        const la = Number(lat);
        if (Number.isNaN(lon) || Number.isNaN(la)) return null;
        return { latitude: la, longitude: lon };
      })
      .filter((p): p is { latitude: number; longitude: number } => !!p);
    if (mapped.length === 0) return null;
    console.log("Ruta seleccionada:", followingRoute?.nombre);
    console.log("📍 Coordenadas (follow):", mapped.length, "puntos");
    return mapped;
  }, [followingRoute]);

  // Redondeo amigable para distancias
  const formatDistanceBrief = (meters: number | null) => {
    if (meters == null) return "-";
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  // Formateo de tiempo y ritmo
  const formatDuration = (sec: number) => {
    if (!isFinite(sec) || sec <= 0) return "00:00";
    const s = Math.floor(sec % 60);
    const m = Math.floor((sec / 60) % 60);
    const h = Math.floor(sec / 3600);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };
  const formatPaceMinPerKm = (meters: number, sec: number) => {
    if (!isFinite(sec) || sec <= 0 || !isFinite(meters) || meters <= 0) return "-";
    const paceSecPerKm = sec / (meters / 1000);
    const m = Math.floor(paceSecPerKm / 60);
    const s = Math.round(paceSecPerKm % 60);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${m}:${pad(s)} min/km`;
  };

  // Toggle: cámara centrada en ruta vs en usuario
  const [isCameraOnRoute, setIsCameraOnRoute] = useState(true);

  // Cuando seleccionas una ruta para seguir, centra la cámara a esa polilínea
  // Flag para evitar que el recenter a usuario le gane al auto-fit de la ruta
  const didAutoFitFollow = useRef(false);

  useEffect(() => {
    if (!mapRef.current) return;
    if (followPolyline && followPolyline.length > 1) {
      // Limpia cualquier ruta previa al destino para evitar confusión visual
      setDest(null);
      setRoutePath(null);
      setRouteInfo(null);
      // Ajusta cámara para encuadrar toda la ruta seleccionada
      try {
        mapRef.current.fitToCoordinates(followPolyline, {
          edgePadding: { top: 80, right: 50, bottom: 80, left: 50 },
          animated: true,
        });
        didAutoFitFollow.current = true;
        setIsCameraOnRoute(true); // cámara empieza en la ruta
      } catch (e) {
        // fallback: centra al primer punto
        const first = followPolyline[0];
        mapRef.current.animateCamera({ center: first, zoom: 14 });
        didAutoFitFollow.current = true;
        setIsCameraOnRoute(true);
      }
    } else if (followPolyline && followPolyline.length === 1) {
      mapRef.current.animateCamera({ center: followPolyline[0], zoom: 16 });
      didAutoFitFollow.current = true;
      setIsCameraOnRoute(true);
    }
  }, [/* encuadrar cuando cambie la ruta seguida */ followPolyline?.length]);

  // Limpia el seguimiento al perder foco del tab (evita que queden botones colgados)
  useFocusEffect(
    React.useCallback(() => {
      // onFocus: no hacemos nada
      return () => {
        // Limpiar navegación también al salir del tab
        stopNavigation();
        clearFollowingRoute();
        setDest(null);
        setRoutePath(null);
        setRouteInfo(null);
        didAutoFitFollow.current = false;
        setIsCameraOnRoute(false);
      };
    }, [])
  );

  // --- Umbrales (ajustables) ---
  const FOLLOW_THRESHOLDS = {
    nearStartMeters: 50,    // habilita "Iniciar recorrido" cuando estés <= 50 m del inicio
    farFromStartMeters: 100, // muestra "Ir al inicio" si estás a > 100 m del inicio
  } as const;

  // Criterios de finalización de ruta
  const COMPLETE_THRESHOLDS = {
    minPercent: 98,    // exige al menos 98% de la distancia cubierta
    minMeters: 5,      // umbral mínimo en metros
    maxMeters: 30,     // umbral máximo en metros (para evitar falsos negativos con GPS ruidoso)
    multiplier: 1.5,   // factor para escalar según precisión reportada por el GPS
    confirmations: 2,  // número de lecturas consecutivas que confirman el fin
  } as const;

  // Haversine local (m) para no tocar otros módulos
  function haversineMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const la1 = toRad(a.latitude);
    const la2 = toRad(b.latitude);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  // Punto de inicio de la ruta a seguir
  const followStart = useMemo(() => {
    if (!followingRoute?.coordinates?.length) return null;
    const [lng, lat] = followingRoute.coordinates[0];
    return { latitude: lat, longitude: lng };
  }, [followingRoute]);

  // Distancia actual al punto de inicio
  const distToStartMeters = useMemo(() => {
    if (!location || !followStart) return null;
    const cur = { latitude: location.coords.latitude, longitude: location.coords.longitude };
    return Math.round(haversineMeters(cur, followStart));
  }, [location, followStart]);

  // Ruta de Google (al destino)
  const [routePath, setRoutePath] = useState<{ latitude: number; longitude: number }[] | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);

  // Ruta ajustada a calles de tu grabación (Roads)
  const [snappedPath, setSnappedPath] = useState<{ latitude: number; longitude: number }[] | null>(null);

  /* ----------------------- FOLLOW TRACKING (mínimo viable) ----------------------- */
  const [tracking, setTracking] = useState(false);
  const followWatcher = useRef<Location.LocationSubscription | null>(null);
  const [snappedToRoute, setSnappedToRoute] = useState<{ latitude: number; longitude: number } | null>(null);

  /* ----------------------- NAVIGATION TO START (GPS automático) ----------------------- */
  const navigationWatcher = useRef<Location.LocationSubscription | null>(null);
  const [navigatingToStart, setNavigatingToStart] = useState(false);
  const [progressMeters, setProgressMeters] = useState(0);
  const [totalMeters, setTotalMeters] = useState(0);
  const lastAccuracyRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const tickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  // DEMO: simulación sin GPS
  const demoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDemoRef = useRef(false);
  const demoIdxRef = useRef(0);

  // Precalcular longitudes de la polilínea seleccionada
  type Pt = { latitude: number; longitude: number };
  const followSegments = useMemo(() => {
    if (!followPolyline || followPolyline.length < 2) return null;
    let acc = 0;
    const segs = [] as Array<{ a: Pt; b: Pt; len: number; accStart: number }>;
    for (let i = 1; i < followPolyline.length; i++) {
      const a = followPolyline[i - 1];
      const b = followPolyline[i];
      const len = haversineMeters(a, b);
      segs.push({ a, b, len, accStart: acc });
      acc += len;
    }
    return { segs, total: acc };
  }, [followPolyline]);

  useEffect(() => {
    setTotalMeters(followSegments?.total || 0);
  }, [followSegments?.total]);

  // Distancia acumulada al llegar al vértice idx de la polilínea
  const coveredAtVertex = (idx: number) => {
    if (!followSegments) return 0;
    if (idx <= 0) return 0;
    const i = idx - 1;
    if (i >= followSegments.segs.length) return followSegments.total;
    const s = followSegments.segs[i];
    return s.accStart + s.len;
  };

  // Proyección de un punto P sobre el segmento AB
  function projectOnSegment(p: Pt, a: Pt, b: Pt) {
    const ax = a.longitude, ay = a.latitude;
    const bx = b.longitude, by = b.latitude;
    const px = p.longitude, py = p.latitude;
    const abx = bx - ax, aby = by - ay;
    const apx = px - ax, apy = py - ay;
    const ab2 = abx * abx + aby * aby;
    const t = ab2 === 0 ? 0 : Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
    return { t, point: { latitude: ay + aby * t, longitude: ax + abx * t } };
  }

  // Encontrar el punto de la ruta más cercano al GPS y su progreso acumulado
  function snapToRoutePoint(gps: Pt) {
    if (!followSegments) return { snapped: null as Pt | null, covered: 0 };
    let best: { d: number; pt: Pt; covered: number } | null = null;
    for (const s of followSegments.segs) {
      const { t, point } = projectOnSegment(gps, s.a, s.b);
      const d = haversineMeters(gps, point);
      const covered = s.accStart + s.len * t;
      if (!best || d < best.d) best = { d, pt: point, covered };
    }
    return { snapped: best?.pt ?? null, covered: best?.covered ?? 0 };
  }

  async function startFollowTracking() {
    if (!followPolyline || followPolyline.length < 2) return;
    if (tracking) return;
    setTracking(true);
    startTimeRef.current = Date.now();
    setElapsedSec(0);
    if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    tickTimerRef.current = setInterval(() => {
      if (startTimeRef.current) setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    // iniciar watcher dedicado (no afectar grabación)
    followWatcher.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 1500,
        distanceInterval: 5,
      },
      (loc) => {
        const gps = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        lastAccuracyRef.current = typeof loc.coords.accuracy === "number" ? loc.coords.accuracy : null;
        const { snapped, covered } = snapToRoutePoint(gps);
        if (snapped) setSnappedToRoute(snapped);
        setProgressMeters(covered);
      }
    );
  }

  // DEMO: recorre la polilínea sin depender del emulador (solo para pruebas)
  function startDemoFollow() {
    if (!followPolyline || followPolyline.length < 2) {
      tip("No hay ruta para demo");
      return;
    }
    if (tracking) return;
    setTracking(true);
    startTimeRef.current = Date.now();
    setElapsedSec(0);
    if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    tickTimerRef.current = setInterval(() => {
      if (startTimeRef.current) setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    isDemoRef.current = true;
    demoIdxRef.current = 0;
    setSnappedToRoute(followPolyline[0]);
    setProgressMeters(0);

    // Objetivo ~30s: avanzar por puntos a intervalos regulares
    const durationMs = 45000; // un poco más lento para ver mejor el HUD
    const stepMs = 300;
    const totalSteps = Math.max(1, Math.floor(durationMs / stepMs));
    const inc = Math.max(1, Math.floor((followPolyline.length - 1) / totalSteps));

    demoTimerRef.current = setInterval(() => {
      const next = Math.min(followPolyline.length - 1, demoIdxRef.current + inc);
      demoIdxRef.current = next;
      const pt = followPolyline[next];
      setSnappedToRoute(pt);
      setProgressMeters(coveredAtVertex(next));
      if (next >= followPolyline.length - 1) {
        // Mantener al final y dejar que el efecto de finalización dispare el toast
        if (demoTimerRef.current) clearInterval(demoTimerRef.current);
        demoTimerRef.current = null;
      }
    }, stepMs);
  }

  function stopFollowTracking() {
    followWatcher.current?.remove();
    followWatcher.current = null;
    setTracking(false);
    setSnappedToRoute(null);
    setProgressMeters(0);
    if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    tickTimerRef.current = null;
    if (demoTimerRef.current) clearInterval(demoTimerRef.current);
    demoTimerRef.current = null;
    isDemoRef.current = false;
  }

  /* ----------------------- NAVIGATION FUNCTIONS ----------------------- */
  async function startNavigation() {
    if (!followStart || navigatingToStart) return;
    setNavigatingToStart(true);

    navigationWatcher.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 4000,  // cada 4 segundos para conservar batería
        distanceInterval: 10, // solo cuando te muevas 10m
      },
      (loc) => {
        // Solo actualizar location para que distToStartMeters se recalcule
        setLocation(loc);
      }
    );
  }

  function stopNavigation() {
    navigationWatcher.current?.remove();
    navigationWatcher.current = null;
    setNavigatingToStart(false);
  }

  /* ----------------------- NAVIGATION AUTO START/STOP ----------------------- */
  useEffect(() => {
    if (!followStart || distToStartMeters == null) {
      // No hay ruta seleccionada o no hay ubicación
      if (navigatingToStart) stopNavigation();
      return;
    }

    const isTrackingActive = tracking || isDemoRef.current;
    const isFarFromStart = distToStartMeters > FOLLOW_THRESHOLDS.farFromStartMeters; // >100m
    const isNearStart = distToStartMeters <= FOLLOW_THRESHOLDS.nearStartMeters; // <=50m

    if (!isTrackingActive && isFarFromStart && !navigatingToStart) {
      // Estás lejos del inicio y no estás trackeando → iniciar navegación automática
      startNavigation();
    } else if (isTrackingActive || isNearStart || !isFarFromStart) {
      // Ya estás trackeando, cerca del inicio, o no estás tan lejos → parar navegación
      if (navigatingToStart) stopNavigation();
    }
  }, [distToStartMeters, tracking, followStart, navigatingToStart]);

  // Detección básica de finalización de ruta
  // Control de finalización con precisión dinámica y confirmaciones
  const finishHitsRef = useRef(0);
  useEffect(() => {
    if (!tracking) { finishHitsRef.current = 0; return; }
    if (!followPolyline || followPolyline.length < 2) return;
    const last = followPolyline[followPolyline.length - 1];
    const cur = snappedToRoute ?? (location ? { latitude: location.coords.latitude, longitude: location.coords.longitude } : null);
    if (!cur) return;
    const percent = totalMeters > 0 ? (progressMeters / totalMeters) * 100 : 0;
    // Umbral en función de la precisión del GPS
    const acc = (lastAccuracyRef.current ?? location?.coords.accuracy) ?? 10; // metros
    const dynThreshold = Math.max(
      COMPLETE_THRESHOLDS.minMeters,
      Math.min(COMPLETE_THRESHOLDS.maxMeters, acc * COMPLETE_THRESHOLDS.multiplier)
    );
    const distToEnd = haversineMeters(cur, last);
    const remaining = Math.max(0, totalMeters - progressMeters);
    const meetsPercent = percent >= COMPLETE_THRESHOLDS.minPercent;
    const meetsDistance = distToEnd <= dynThreshold;
    // Fallback: si el cálculo de distancia al último punto no coincide por proyección/ruido,
    // permite completar si prácticamente no queda distancia acumulada.
    const meetsRemainingFallback = remaining <= 3; // 3 m de colchón

    if (meetsPercent && (meetsDistance || meetsRemainingFallback)) {
      finishHitsRef.current += 1;
      const requiredConf = isDemoRef.current ? 1 : COMPLETE_THRESHOLDS.confirmations;
      if (finishHitsRef.current >= requiredConf) {
        const finalSec = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : elapsedSec;
        const routeName = followingRoute?.nombre || "Ruta";
        const distance = formatDistanceBrief(totalMeters);
        const time = formatDuration(finalSec);
        // Mensaje sobrio, sin emojis ni pace
        const msg = `Felicitaciones\nCompletaste \"${routeName}\"\n${distance} · ${time}`;
        stopFollowTracking();
        tip(msg, 0, "success"); // toast persistente hasta cerrar
      }
    } else {
      finishHitsRef.current = 0;
    }
  }, [tracking, followPolyline, snappedToRoute, location, progressMeters, totalMeters]);

  useEffect(() => {
    (async () => {
      if (locationStatus !== PermissionStatus.GRANTED) return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(loc);
      // En modo seguimiento, dejamos que el auto-fit de la ruta controle la cámara
      if (followingRoute) return;
      mapRef.current?.animateCamera({
        center: { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
        zoom: 15,
      });
    })();
  }, [locationStatus, followingRoute]);

  /* ---------- Toast propio (sin icono del sistema) ---------- */
  const [hint, setHint] = useState<string | null>(null);
  const [hintVariant, setHintVariant] = useState<"default" | "success">("default");
  const hintTimer = useRef<NodeJS.Timeout | null>(null);

  function tip(msg: string, ms = 1400, variant: "default" | "success" = "default") {
    setHint(msg);
    setHintVariant(variant);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    if (ms > 0) {
      hintTimer.current = setTimeout(() => setHint(null), ms);
    } else {
      hintTimer.current = null; // sticky hasta que el usuario cierre
    }
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
      setPuntosRecorrido(points); // o snappedPath si prefieres la ruta ajustada
      setDistancia(distanceMeters / 1000);
      setMostrarFormulario(true);
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
      // Evita pedir rutas imposibles (p. ej., USA -> Chile por tierra)
      const distMeters = origin && dest ? haversineMeters(origin, dest) : 0;
      if (distMeters > 500_000) { // > 500 km
        Alert.alert(
          "Estás muy lejos del destino",
          `Tu ubicación está a ${(distMeters / 1000).toFixed(0)} km. Acércate al destino para trazar una ruta realista.`
        );
        return;
      }
      const r = await getDirectionsRoute({ origin, destination: dest, mode: "walking" });
      setRoutePath(r.path);
      setRouteInfo({ distance: r.distanceMeters, duration: r.durationSeconds });
      mapRef.current?.animateCamera({ center: dest, zoom: 16 });
    } catch (e: any) {
      console.warn("traceRouteToDest error:", e);
      // Mensaje más claro cuando Google no encuentra ruta
      const msg = String(e?.message ?? e);
      if (/no se encontr[óo] ruta|not found/i.test(msg)) {
        Alert.alert(
          "No hay una ruta por calles",
          "Es posible que estés demasiado lejos o no exista un camino a pie/vehículo. Si usas emulador, ajusta la ubicación cerca de la ruta."
        );
      } else {
        Alert.alert("Error al trazar ruta", msg);
      }
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
  if (mostrarFormulario) {
    return (
      <GuardarRutaForm
        puntosGPS={puntosRecorrido.map(p => [p.longitude, p.latitude])} // transforma TrackPoint[] a [number, number][]
        distancia={distancia}
        onGuardar={(ruta) => {
          setMostrarFormulario(false);
          // Limpiar todo después de guardar
          reset(); // Limpia points, lastPoint del hook
          setPuntosRecorrido([]);
          setDistancia(0);
          setSnappedPath(null);
          // Aquí puedes enviar la ruta al backend si lo necesitas
        }}
        onDescartar={() => {
          setMostrarFormulario(false);
          // Limpiar todo después de descartar
          reset(); // Limpia points, lastPoint del hook
          setPuntosRecorrido([]);
          setDistancia(0);
          setSnappedPath(null);
        }}
      />
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <MapHeader displayName={displayName} />

      {/* Botones arriba - solo visible cuando NO estés en modo seguimiento */}
      {!followingRoute && (
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
      )}

      {/* Panel de seguimiento (Follow Mode) - solo cuando hay ruta seleccionada */}
      {followingRoute && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <View style={{ marginTop: 10, backgroundColor: "#F3F4F6", borderRadius: 12, padding: 12 }}>
            <Text style={{ fontWeight: "700", color: "#111827" }}>
              Siguiendo: {followingRoute.nombre || "Ruta seleccionada"}
            </Text>
            {distToStartMeters != null && (
              <Text style={{ color: "#374151", marginTop: 4 }}>
                Estás a {formatDistanceBrief(distToStartMeters)} del inicio
              </Text>
            )}

            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              {/* Ir al inicio si estamos lejos */}
              {followStart && distToStartMeters != null && distToStartMeters > FOLLOW_THRESHOLDS.farFromStartMeters && (
                <Pressable
                  onPress={() => { setDest(followStart); tip("Trazando ruta al inicio"); traceRouteToDest(); }}
                  style={{ flex: 1, backgroundColor: "#111827", borderRadius: 10, height: 40, alignItems: "center", justifyContent: "center" }}
                >
                  <Text style={{ color: "white", fontWeight: "600" }}>Ir al inicio</Text>
                </Pressable>
              )}

              {/* Iniciar recorrido: solo cerca del inicio */}
              <Pressable
                disabled={!(distToStartMeters != null && distToStartMeters <= FOLLOW_THRESHOLDS.nearStartMeters) && !tracking}
                onPress={() => {
                  if (tracking) {
                    stopFollowTracking();
                    tip("Seguimiento detenido");
                  } else {
                    startFollowTracking();
                    tip("Seguimiento iniciado");
                  }
                }}
                style={{ flex: 1, backgroundColor: tracking ? "#ef4444" : ((distToStartMeters != null && distToStartMeters <= FOLLOW_THRESHOLDS.nearStartMeters) ? "#16A34A" : "#9CA3AF"), borderRadius: 10, height: 40, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>{tracking ? "Detener" : "Iniciar recorrido"}</Text>
              </Pressable>

              {/* Demo (solo dev): simula el recorrido sin emulador. Visible aunque estés lejos o ya tracking. */}
              {__DEV__ && (
                <Pressable
                  onPress={() => {
                    if (tracking) {
                      stopFollowTracking();
                    }
                    startDemoFollow();
                    tip("Demo iniciada");
                  }}
                  onLongPress={() => tip("Simula el recorrido sin usar el emulador")}
                  style={{ flexBasis: 70, backgroundColor: "#6B7280", borderRadius: 10, height: 40, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 }}
                >
                  <Text style={{ color: "white", fontWeight: "600" }}>Demo</Text>
                </Pressable>
              )}

              {/* Cancelar seguimiento */}
              <Pressable
                onPress={() => {
                  clearFollowingRoute();
                  setDest(null);
                  setRoutePath(null);
                  setRouteInfo(null);
                  setIsCameraOnRoute(false);
                  tip("Seguimiento cancelado");
                }}
                style={{ flexBasis: 44, backgroundColor: "#ef4444", borderRadius: 10, height: 40, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 }}
              >
                <Ionicons name="close" size={18} color="white" />
              </Pressable>
            </View>
          </View>
        </View>
      )}

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
          {/* Polyline de la ruta de Google al destino (más sutil y debajo de la ruta seguida) */}
          {routePath && routePath.length > 1 && (
            <Polyline
              coordinates={routePath}
              strokeWidth={3}
              strokeColor="#000000" // rnegro para mayor contraste
              lineDashPattern={[8, 6]}
              geodesic
            />
          )}

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

          {/* Polilínea de una ruta seleccionada para seguir (Follow Mode) - por encima del resto */}
          {followPolyline && followPolyline.length > 1 && (
            <Polyline
              coordinates={followPolyline}
              strokeWidth={5}
              strokeColor="#ff3b30"
              geodesic
            />
          )}

          {/* Punto snapeado a la ruta (indicativo) */}
          {snappedToRoute && (
            <Marker
              coordinate={snappedToRoute}
              title="En ruta"
              pinColor="#3b82f6"
            />
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

        {/* HUD - solo visible cuando NO estés en modo seguimiento */}
        {!followingRoute && (
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
        )}

        {/* HUD de seguimiento compacto (cuando estás siguiendo y trackeando) */}
        {followingRoute && tracking && (
          <View
            style={{
              position: "absolute", alignSelf: "center", top: 12,
              backgroundColor: "white", borderRadius: 14,
              paddingHorizontal: 14, paddingVertical: 8,
              borderWidth: 1, borderColor: "#e5e7eb",
              flexDirection: "row", alignItems: "center", gap: 8,
              shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6,
            }}
          >
            <Ionicons name="walk-outline" size={16} color="#111827" />
            <View>
              <Text style={{ color: "#111827", fontWeight: "700" }}>
                Recorridos {formatDistanceBrief(progressMeters)} · Restan {formatDistanceBrief(Math.max(0, totalMeters - progressMeters))} ({Math.min(100, Math.round((totalMeters > 0 ? (progressMeters * 100) / totalMeters : 0)))}%)
              </Text>
              <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                Tiempo {formatDuration(elapsedSec)} · Ritmo {formatPaceMinPerKm(progressMeters, elapsedSec)}
              </Text>
            </View>
          </View>
        )}

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

          {/* Toggle: Centrar en ruta vs centrar en usuario */}
          {followingRoute ? (
            <Fab
              onPress={() => {
                if (isCameraOnRoute) {
                  // Actualmente en ruta → centrar en usuario
                  tip("Centrar en mi posición");
                  recenter();
                  setIsCameraOnRoute(false);
                } else {
                  // Actualmente en usuario → centrar en ruta
                  tip("Centrar en la ruta");
                  if (followPolyline && followPolyline.length > 1) {
                    try {
                      mapRef.current?.fitToCoordinates(followPolyline, {
                        edgePadding: { top: 80, right: 50, bottom: 80, left: 50 },
                        animated: true,
                      });
                    } catch (_) {
                      const first = followPolyline[0];
                      mapRef.current?.animateCamera({ center: first, zoom: 15 });
                    }
                  }
                  setIsCameraOnRoute(true);
                }
              }}
              onLongPress={() => tip(isCameraOnRoute ? "Cambia a centrar en tu ubicación" : "Cambia a centrar en la ruta")}
            >
              <Ionicons name={isCameraOnRoute ? "navigate" : "map-outline"} size={20} color="#111827" />
            </Fab>
          ) : (
            <Fab
              onPress={() => { tip("Centrar en mi ubicación"); recenter(); }}
              onLongPress={() => tip("Vuelve a centrar la cámara en tu posición")}
            >
              <Ionicons name="locate" size={20} color="#111827" />
            </Fab>
          )}

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
            pointerEvents="box-none"
            style={{ position: "absolute", bottom: 90, alignSelf: "center", width: "92%" }}
          >
            {hintVariant === "success" ? (
              (() => {
                const lines = (hint || "").split("\n");
                const title = lines[0] || "Felicitaciones";
                const subtitle = lines[1] || "";
                const meta = (lines[2] || "");
                const parts = meta.split("·").map((s) => s.trim());
                const distVal = parts[0] || "";
                const timeVal = parts[1] || "";
                return (
                  <View
                    style={{
                      backgroundColor: "#111827",
                      borderColor: "#10b981",
                      borderWidth: 2,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderRadius: 16,
                      alignSelf: "center",
                      width: "100%",
                      shadowColor: "#000",
                      shadowOpacity: 0.18,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 6 },
                      elevation: 8,
                      position: "relative",
                    }}
                  >
                    <Pressable onPress={() => setHint(null)} style={{ position: "absolute", top: 10, right: 10, padding: 4 }}>
                      <Ionicons name="close" size={18} color="#ffffff" />
                    </Pressable>
                    <View style={{ alignItems: "center", marginBottom: 6 }}>
                      <Ionicons name="checkmark-circle" size={22} color="#10b981" />
                    </View>
                    <Text style={{ color: "#ffffff", fontWeight: "800", fontSize: 16, textAlign: "center" }}>{title}</Text>
                    {!!subtitle && (
                      <Text style={{ color: "#e5e7eb", fontWeight: "600", fontSize: 14, textAlign: "center", marginTop: 2 }}>
                        {subtitle}
                      </Text>
                    )}
                    {(distVal || timeVal) && (
                      <View style={{ flexDirection: "row", justifyContent: "center", gap: 18, marginTop: 10 }}>
                        {!!distVal && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Ionicons name="flag-outline" size={16} color="#ffffff" />
                            <Text style={{ color: "#9ca3af", fontSize: 12 }}>Distancia</Text>
                            <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 14 }}>{distVal}</Text>
                          </View>
                        )}
                        {!!timeVal && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Ionicons name="time-outline" size={16} color="#ffffff" />
                            <Text style={{ color: "#9ca3af", fontSize: 12 }}>Tiempo</Text>
                            <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 14 }}>{timeVal}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })()
            ) : (
              <View
                style={{
                  backgroundColor: "rgba(17,17,17,0.92)",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignSelf: "center",
                  maxWidth: "100%",
                  shadowColor: "#000",
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 6,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <Text style={{ color: "#ffffff", fontWeight: "600", flexShrink: 1 }}>{hint}</Text>
                <Pressable onPress={() => setHint(null)} style={{ paddingHorizontal: 4, paddingVertical: 2 }}>
                  <Ionicons name="close" size={18} color="#ffffff" />
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
