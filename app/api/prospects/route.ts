import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/prospects -> todos los prospectos (el filtrado/búsqueda se hace en
// el cliente; el volumen local es manejable).
export async function GET() {
  const rows = await prisma.prospect.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: { select: { id: true } } },
  });
  const prospects = rows.map(({ client, ...p }) => ({ ...p, clientId: client?.id ?? null }));
  return NextResponse.json({ prospects });
}
