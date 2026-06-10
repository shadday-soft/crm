import { NextResponse } from "next/server";
import { getApiKey } from "@/lib/apiKey";
import { searchNearby } from "@/lib/places";
import {
  boundingCircle,
  pointInPolygon,
  MAX_GOOGLE_RADIUS_M,
  type LatLng,
} from "@/lib/geo";
import { prisma } from "@/lib/prisma";
import { deriveZone } from "@/lib/zone";
import type { SearchResponse } from "@/lib/types";

// POST /api/places/search
// body: { polygon: LatLng[], includedTypes?: string[] }
//
// Flujo: bounding circle -> Nearby Search -> filtrar por polígono real ->
// quedarse solo con los que NO tienen website -> marcar cuáles ya existen.
export async function POST(req: Request) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "No hay API key configurada. Configúrala primero." },
      { status: 400 }
    );
  }

  let body: { polygon?: LatLng[]; includedTypes?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const polygon = body.polygon;
  if (!Array.isArray(polygon) || polygon.length < 3) {
    return NextResponse.json(
      { error: "El polígono necesita al menos 3 puntos." },
      { status: 400 }
    );
  }

  const includedTypes = Array.isArray(body.includedTypes)
    ? body.includedTypes.filter((t) => typeof t === "string")
    : undefined;

  const { center, radiusMeters } = boundingCircle(polygon);
  if (radiusMeters > MAX_GOOGLE_RADIUS_M) {
    return NextResponse.json(
      {
        error: `El área es demasiado grande (radio ${Math.round(
          radiusMeters
        )} m; máximo ${MAX_GOOGLE_RADIUS_M} m). Dibuja un área más pequeña.`,
      },
      { status: 400 }
    );
  }

  let places;
  let apiCalls = 0;
  try {
    const r = await searchNearby({ apiKey, center, radiusMeters, includedTypes });
    places = r.places;
    apiCalls = r.apiCalls;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al llamar a Google Places." },
      { status: 502 }
    );
  }

  const found = places.length;
  const inside = places.filter((p) => pointInPolygon(p.location, polygon));
  const withoutWebsite = inside.filter((p) => !p.website || p.website.trim() === "");

  // ¿Cuáles ya están importados?
  const ids = withoutWebsite.map((p) => p.placeId);
  const existing = ids.length
    ? await prisma.prospect.findMany({
        where: { placeId: { in: ids } },
        select: { placeId: true },
      })
    : [];
  const existingSet = new Set(existing.map((e) => e.placeId));

  const candidates = withoutWebsite.map((p) => ({
    placeId: p.placeId,
    name: p.name,
    address: p.address,
    phone: p.phone,
    rating: p.rating,
    userRatingCount: p.userRatingCount,
    category: p.primaryType,
    location: p.location,
    googleMapsUri: p.googleMapsUri,
    openingHours: p.openingHours,
    zone: deriveZone(p.address),
    alreadyImported: existingSet.has(p.placeId),
  }));

  const response: SearchResponse = {
    candidates,
    stats: {
      found,
      insidePolygon: inside.length,
      withoutWebsite: withoutWebsite.length,
      apiCalls,
      radiusMeters,
      center,
    },
  };

  return NextResponse.json(response);
}
