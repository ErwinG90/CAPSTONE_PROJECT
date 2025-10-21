import { useRef, useState } from "react";
import * as Location from "expo-location";

export type LatLng = { latitude: number; longitude: number };
export type TrackPoint = LatLng & { accuracy?: number | null; timestamp: number };

// Distancia 2D (haversine)
function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const la1 = toRad(a.latitude);
  const la2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
function pathDistanceMeters(points: LatLng[]): number {
  let sum = 0;
  for (let i = 1; i < points.length; i++) sum += haversineMeters(points[i - 1], points[i]);
  return sum;
}

export function useRouteRecorder() {
  const watcher = useRef<Location.LocationSubscription | null>(null);
  const simAbort = useRef<{ aborted: boolean } | null>(null);

  const [recording, setRecording] = useState(false);
  const [points, setPoints] = useState<TrackPoint[]>([]);
  const [lastPoint, setLastPoint] = useState<TrackPoint | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const start = async (current: Location.LocationObject) => {
    stop(); // por si hubiera uno previo
    const first: TrackPoint = {
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
      accuracy: current.coords.accuracy,
      timestamp: Date.now(),
    };
    setPoints([first]);
    setLastPoint(first);
    setRecording(true);

    watcher.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 2,
        mayShowUserSettingsDialog: true,
      },
      (loc) => {
        const next: TrackPoint = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy,
          timestamp: Date.now(),
        };
        setLastPoint(next);
        setPoints((prev) => [...prev, next]);
      }
    );
  };

  const stop = () => {
    watcher.current?.remove();
    watcher.current = null;
    setRecording(false);
    if (simAbort.current) simAbort.current.aborted = true;
    setIsSimulating(false);
  };

  // Simula movimiento en línea recta
  const simulateTo = async (
    from: LatLng | null,
    to: LatLng,
    onStep?: (p: LatLng) => void,
    steps = 60,
    intervalMs = 300
  ) => {
    if (!from) return;
    stop();
    setRecording(true);
    setIsSimulating(true);
    setPoints([{ ...from, timestamp: Date.now() }]);
    setLastPoint({ ...from, timestamp: Date.now() });

    simAbort.current = { aborted: false };
    for (let i = 1; i <= steps; i++) {
      if (simAbort.current.aborted) break;
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, intervalMs));
      const t = i / steps;
      const lat = from.latitude + (to.latitude - from.latitude) * t;
      const lon = from.longitude + (to.longitude - from.longitude) * t;
      const next: TrackPoint = { latitude: lat, longitude: lon, timestamp: Date.now() };
      setLastPoint(next);
      setPoints((prev) => [...prev, next]);
      onStep?.(next);
    }
    setIsSimulating(false);
    setRecording(false);
  };

  // Simula un recorrido con puntos dados
  const simulatePath = async (
    path: LatLng[],
    onStep?: (p: LatLng) => void,
    intervalMs = 300
  ) => {
    if (!path.length) return;
    stop();
    setRecording(true);
    setIsSimulating(true);
    setPoints([{ ...path[0], timestamp: Date.now() }]);
    setLastPoint({ ...path[0], timestamp: Date.now() });

    simAbort.current = { aborted: false };
    for (let i = 1; i < path.length; i++) {
      if (simAbort.current.aborted) break;
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, intervalMs));
      const next: TrackPoint = { ...path[i], timestamp: Date.now() };
      setLastPoint(next);
      setPoints((prev) => [...prev, next]);
      onStep?.(next);
    }
    setIsSimulating(false);
    setRecording(false);
  };

  const distanceMeters = pathDistanceMeters(points);

  return {
    recording,
    points,
    lastPoint,
    isSimulating,
    distanceMeters,
    start,
    stop,
    simulateTo,
    simulatePath, // 👈 asegúrate de que esto esté realmente exportado
  };
}
