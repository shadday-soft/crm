// Cliente de Google Places API (New) — https://places.googleapis.com/v1
//
// NOTA DE COSTOS (importante para no salirse de la capa gratuita):
// La Places API "New" permite pedir teléfono, website y horarios DENTRO de la
// misma llamada Nearby Search (via FieldMask). Por eso UNA sola búsqueda nos da
// todo lo necesario de hasta 20 negocios, en lugar de 1 Nearby + N Place Details.
// Esto reduce drásticamente el número de llamadas facturadas.
//
// Igual exponemos placeDetails() para la función de "actualizar datos" de un
// prospecto puntual desde el CRM.

import type { LatLng } from "./geo";

const BASE = "https://places.googleapis.com/v1";

export type PlaceResult = {
  placeId: string;
  name: string;
  address?: string;
  phone?: string;
  rating?: number;
  userRatingCount?: number;
  primaryType?: string;
  types?: string[];
  website?: string;
  googleMapsUri?: string;
  openingHours?: string[]; // descripciones por día (weekdayDescriptions)
  location: LatLng;
  businessStatus?: string;
};

// Campos que pedimos. Para Nearby llevan prefijo "places."; para Details no.
const DETAIL_FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "types",
  "primaryType",
  "rating",
  "userRatingCount",
  "nationalPhoneNumber",
  "internationalPhoneNumber",
  "websiteUri",
  "regularOpeningHours",
  "googleMapsUri",
  "businessStatus",
];

const NEARBY_FIELD_MASK = DETAIL_FIELDS.map((f) => `places.${f}`).join(",");
const DETAILS_FIELD_MASK = DETAIL_FIELDS.join(",");

type RawPlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  types?: string[];
  primaryType?: string;
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  googleMapsUri?: string;
  businessStatus?: string;
};

function mapPlace(p: RawPlace): PlaceResult | null {
  if (!p.id || !p.location?.latitude || !p.location?.longitude) return null;
  return {
    placeId: p.id,
    name: p.displayName?.text ?? "(sin nombre)",
    address: p.formattedAddress,
    phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber,
    rating: p.rating,
    userRatingCount: p.userRatingCount,
    primaryType: p.primaryType ?? p.types?.[0],
    types: p.types,
    website: p.websiteUri,
    googleMapsUri: p.googleMapsUri,
    openingHours: p.regularOpeningHours?.weekdayDescriptions,
    location: { lat: p.location.latitude, lng: p.location.longitude },
    businessStatus: p.businessStatus,
  };
}

/** Intenta sacar un mensaje de error legible de la respuesta de Google. */
async function googleError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    const msg = body?.error?.message || body?.error?.status;
    if (msg) return `Google Places: ${msg} (HTTP ${res.status})`;
  } catch {
    /* ignore */
  }
  return `Google Places respondió HTTP ${res.status}`;
}

export type NearbyParams = {
  apiKey: string;
  center: LatLng;
  radiusMeters: number;
  includedTypes?: string[];
  maxResultCount?: number;
};

/**
 * Nearby Search (New). Devuelve hasta 20 lugares con todos los campos útiles.
 * Cuenta como 1 llamada a la API.
 */
export async function searchNearby(
  params: NearbyParams
): Promise<{ places: PlaceResult[]; apiCalls: number }> {
  const { apiKey, center, radiusMeters, includedTypes, maxResultCount } = params;

  const body: Record<string, unknown> = {
    maxResultCount: Math.min(Math.max(maxResultCount ?? 20, 1), 20),
    languageCode: "es",
    locationRestriction: {
      circle: {
        center: { latitude: center.lat, longitude: center.lng },
        radius: radiusMeters,
      },
    },
  };
  if (includedTypes && includedTypes.length > 0) {
    body.includedTypes = includedTypes;
  }

  const res = await fetch(`${BASE}/places:searchNearby`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": NEARBY_FIELD_MASK,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(await googleError(res));

  const data = (await res.json()) as { places?: RawPlace[] };
  const places = (data.places ?? [])
    .map(mapPlace)
    .filter((p): p is PlaceResult => p !== null);

  return { places, apiCalls: 1 };
}

/**
 * Place Details (New) para un place_id puntual. Cuenta como 1 llamada.
 * Lo usamos para "actualizar datos desde Google" de un prospecto del CRM.
 */
export async function placeDetails(
  apiKey: string,
  placeId: string
): Promise<{ place: PlaceResult | null; apiCalls: number }> {
  const res = await fetch(`${BASE}/places/${encodeURIComponent(placeId)}`, {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": DETAILS_FIELD_MASK,
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(await googleError(res));

  const raw = (await res.json()) as RawPlace;
  return { place: mapPlace(raw), apiCalls: 1 };
}

/** Validación ligera de la API key: una búsqueda mínima de 1 resultado. */
export async function validateApiKey(apiKey: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`${BASE}/places:searchNearby`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id",
      },
      body: JSON.stringify({
        maxResultCount: 1,
        locationRestriction: {
          circle: {
            center: { latitude: 40.4168, longitude: -3.7038 }, // Madrid centro
            radius: 500,
          },
        },
      }),
      cache: "no-store",
    });
    if (res.ok) return { ok: true, message: "Clave válida." };
    return { ok: false, message: await googleError(res) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Error de red al validar." };
  }
}
