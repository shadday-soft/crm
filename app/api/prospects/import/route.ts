import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { SearchCandidate } from "@/lib/types";

// POST /api/prospects/import
// body: { candidates: SearchCandidate[] }
// Inserta los nuevos (dedup por placeId). Devuelve cuántos importó y omitió.
export async function POST(req: Request) {
  let body: { candidates?: SearchCandidate[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const candidates = body.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return NextResponse.json({ error: "No hay candidatos para importar." }, { status: 400 });
  }

  // Filtra los que ya existen.
  const ids = candidates.map((c) => c.placeId).filter(Boolean);
  const existing = await prisma.prospect.findMany({
    where: { placeId: { in: ids } },
    select: { placeId: true },
  });
  const existingSet = new Set(existing.map((e) => e.placeId));

  // Evita duplicados dentro del mismo lote también.
  const seen = new Set<string>();
  const toCreate = candidates.filter((c) => {
    if (!c.placeId || existingSet.has(c.placeId) || seen.has(c.placeId)) return false;
    seen.add(c.placeId);
    return true;
  });

  if (toCreate.length === 0) {
    return NextResponse.json({ imported: 0, skipped: candidates.length });
  }

  await prisma.prospect.createMany({
    data: toCreate.map((c) => ({
      placeId: c.placeId,
      name: c.name,
      address: c.address ?? null,
      phone: c.phone ?? null,
      rating: c.rating ?? null,
      userRatingCount: c.userRatingCount ?? null,
      category: c.category ?? null,
      latitude: c.location?.lat ?? null,
      longitude: c.location?.lng ?? null,
      googleMapsUri: c.googleMapsUri ?? null,
      openingHours: c.openingHours ? JSON.stringify(c.openingHours) : null,
      zone: c.zone ?? null,
      website: null, // por definición no tienen website
    })),
  });

  return NextResponse.json({
    imported: toCreate.length,
    skipped: candidates.length - toCreate.length,
  });
}
