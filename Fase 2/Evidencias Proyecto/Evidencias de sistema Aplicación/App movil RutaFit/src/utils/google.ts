// src/utils/google.ts
const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY!;

/** Decodifica polylines codificados de Google */
export function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  let index = 0, lat = 0, lng = 0;
  const coordinates: { latitude: number; longitude: number }[] = [];
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0; result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coordinates;
}

/** Rutas con Routes API v2 (recomendado) */
export async function getDirectionsRoute(params: {
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
  mode?: "walking" | "driving" | "bicycling";
}) {
  const { origin, destination, mode = "walking" } = params;

  const travelMode =
    mode === "bicycling" ? "BICYCLE" :
    mode === "driving"   ? "DRIVE"   :
                           "WALK";

  const body = {
    origin: {
      location: { latLng: { latitude: origin.latitude, longitude: origin.longitude } },
    },
    destination: {
      location: { latLng: { latitude: destination.latitude, longitude: destination.longitude } },
    },
    travelMode,
  };

  const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_KEY,
      // Pedimos solo lo necesario
      "X-Goog-FieldMask": "routes.polyline.encodedPolyline,routes.distanceMeters,routes.duration",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  const route = json?.routes?.[0];
  if (!route) {
    const msg = json?.error?.message || "No se encontró ruta";
    throw new Error(`Routes API error: ${msg}`);
  }

  const encoded = route.polyline?.encodedPolyline ?? "";
  const path = encoded ? decodePolyline(encoded) : [];

  const distanceMeters = route.distanceMeters ?? 0;
  const durationSeconds = route.duration
    ? Math.round(Number(String(route.duration).replace("s", "")))
    : 0;

  return { path, distanceMeters, durationSeconds, raw: json };
}

/** Geocoding v1 (texto -> coordenadas) */
export async function geocodeAddress(address: string) {
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json?` +
    `address=${encodeURIComponent(address)}&key=${GOOGLE_KEY}`;

  const res = await fetch(url);
  const json = await res.json();
  if (json.status !== "OK") throw new Error(`Geocode error: ${json.status}`);

  const r = json.results[0];
  return {
    formatted: r.formatted_address,
    location: {
      latitude: r.geometry.location.lat,
      longitude: r.geometry.location.lng,
    },
  };
}

/* ===================== Roads API: Snap to Roads ===================== */

/** util simple para cortar en lotes */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Ajusta puntos GPS a calles (Google Roads API).
 * Límite: 100 puntos por request → se hace chunking automático.
 * Usa interpolate=true para curvas suaves.
 */
export async function snapToRoads(points: { latitude: number; longitude: number }[]) {
  if (!points.length) return [] as { latitude: number; longitude: number }[];

  const batches = chunk(points, 100);
  const snapped: { latitude: number; longitude: number }[] = [];

  for (const batch of batches) {
    const pathParam = batch.map(p => `${p.latitude},${p.longitude}`).join("|");
    const url =
      `https://roads.googleapis.com/v1/snapToRoads?` +
      `interpolate=true&path=${encodeURIComponent(pathParam)}&key=${GOOGLE_KEY}`;

    const res = await fetch(url);
    const json = await res.json();

    if (!json.snappedPoints) {
      const msg = json?.error?.message || "SnapToRoads: sin respuesta válida";
      throw new Error(msg);
    }

    for (const sp of json.snappedPoints) {
      snapped.push({
        latitude: sp.location.latitude,
        longitude: sp.location.longitude,
      });
    }
  }

  return snapped;
}
