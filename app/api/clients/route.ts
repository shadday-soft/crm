import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CLIENT_STATUS } from "@/lib/constants";

const STATUS_SET = new Set(CLIENT_STATUS.map((o) => o.value));

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

// GET /api/clients -> todos los clientes
export async function GET() {
  const clients = await prisma.client.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ clients });
}

// POST /api/clients -> crear cliente manual
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const name = str(body.name);
  if (!name) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }

  const status =
    typeof body.status === "string" && STATUS_SET.has(body.status) ? body.status : "ACTIVO";

  const client = await prisma.client.create({
    data: {
      name,
      contactName: str(body.contactName),
      email: str(body.email),
      phone: str(body.phone),
      address: str(body.address),
      taxId: str(body.taxId),
      category: str(body.category),
      zone: str(body.zone),
      notes: str(body.notes),
      status,
    },
  });

  return NextResponse.json({ client }, { status: 201 });
}
