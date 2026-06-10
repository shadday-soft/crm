import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/clients/convert  { prospectId }
// Crea un Cliente copiando los datos del prospecto, lo enlaza y marca el
// prospecto como CERRADO. Devuelve el cliente y el prospecto actualizado.
export async function POST(req: Request) {
  let body: { prospectId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const prospectId = body.prospectId;
  if (!prospectId) {
    return NextResponse.json({ error: "Falta el prospecto." }, { status: 400 });
  }

  const prospect = await prisma.prospect.findUnique({
    where: { id: prospectId },
    include: { client: { select: { id: true } } },
  });
  if (!prospect) {
    return NextResponse.json({ error: "Prospecto no encontrado." }, { status: 404 });
  }
  if (prospect.client) {
    return NextResponse.json(
      { error: "Este prospecto ya es cliente.", clientId: prospect.client.id },
      { status: 409 }
    );
  }

  const client = await prisma.client.create({
    data: {
      name: prospect.name,
      phone: prospect.phone,
      address: prospect.address,
      category: prospect.category,
      zone: prospect.zone,
      rating: prospect.rating,
      googleMapsUri: prospect.googleMapsUri,
      prospectId: prospect.id,
      status: "ACTIVO",
    },
  });

  // Marcar el prospecto como cerrado (ganado).
  const updated = await prisma.prospect.update({
    where: { id: prospect.id },
    data: { contactStatus: "CERRADO" },
  });

  return NextResponse.json({
    client,
    prospect: { ...updated, clientId: client.id },
  });
}
