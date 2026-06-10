import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiKey } from "@/lib/apiKey";
import { placeDetails } from "@/lib/places";

type Params = { params: Promise<{ id: string }> };

// POST /api/prospects/:id/refresh
// Vuelve a consultar Google (Place Details) para actualizar datos del negocio.
// Consume 1 llamada a la API.
export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;

  const apiKey = await getApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "No hay API key configurada." }, { status: 400 });
  }

  const prospect = await prisma.prospect.findUnique({ where: { id } });
  if (!prospect) {
    return NextResponse.json({ error: "Prospecto no encontrado." }, { status: 404 });
  }

  let place;
  let apiCalls = 0;
  try {
    const r = await placeDetails(apiKey, prospect.placeId);
    place = r.place;
    apiCalls = r.apiCalls;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al consultar Google." },
      { status: 502 }
    );
  }

  if (!place) {
    return NextResponse.json({ error: "Google no devolvió datos.", apiCalls }, { status: 502 });
  }

  const updated = await prisma.prospect.update({
    where: { id },
    data: {
      name: place.name,
      address: place.address ?? null,
      phone: place.phone ?? null,
      rating: place.rating ?? null,
      userRatingCount: place.userRatingCount ?? null,
      category: place.primaryType ?? prospect.category,
      website: place.website ?? null,
      googleMapsUri: place.googleMapsUri ?? prospect.googleMapsUri,
      openingHours: place.openingHours ? JSON.stringify(place.openingHours) : null,
    },
    include: { client: { select: { id: true } } },
  });

  const { client, ...rest } = updated;
  return NextResponse.json({ prospect: { ...rest, clientId: client?.id ?? null }, apiCalls });
}
