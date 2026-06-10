// Utilidades geométricas para la búsqueda por área.
//
// Google Places NO acepta polígonos: solo (centro + radio). El flujo es:
//   1. boundingCircle(polígono) -> círculo que cubre TODO el polígono (radio mínimo)
//   2. se llama a Google con ese centro + radio
//   3. pointInPolygon() descarta los resultados que caen fuera del polígono real.

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_M = 6_371_008.8; // radio medio terrestre (metros)

/** Distancia en metros entre dos coordenadas (fórmula de Haversine). */
export function haversine(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Círculo envolvente del polígono.
 * Centro = punto medio del bounding box; radio = distancia máxima del centro
 * a cualquier vértice. Como el disco es convexo, cubrir todos los vértices
 * garantiza cubrir todo el polígono (incluso si es cóncavo).
 */
export function boundingCircle(polygon: LatLng[]): {
  center: LatLng;
  radiusMeters: number;
} {
  if (polygon.length === 0) {
    throw new Error("El polígono no tiene vértices.");
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const p of polygon) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }

  const center: LatLng = {
    lat: (minLat + maxLat) / 2,
    lng: (minLng + maxLng) / 2,
  };

  let radiusMeters = 0;
  for (const p of polygon) {
    const d = haversine(center, p);
    if (d > radiusMeters) radiusMeters = d;
  }

  // +1m de margen por seguridad de coma flotante en el borde.
  radiusMeters = Math.ceil(radiusMeters) + 1;

  return { center, radiusMeters };
}

/**
 * ¿El punto está dentro del polígono? Algoritmo ray casting (par/impar).
 * Trata lng como X y lat como Y. El polígono no necesita cerrarse explícitamente.
 */
export function pointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  const x = point.lng;
  const y = point.lat;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}

/** Radio máximo permitido por Google Places Nearby Search (New). */
export const MAX_GOOGLE_RADIUS_M = 50_000;
