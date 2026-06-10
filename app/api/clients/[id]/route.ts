import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CLIENT_STATUS } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

const STATUS_SET = new Set(CLIENT_STATUS.map((o) => o.value));
type Params = { params: Promise<{ id: string }> };

function strOrNull(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t === "" ? null : t;
}

// GET /api/clients/:id
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });
  return NextResponse.json({ client });
}

// PATCH /api/clients/:id
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const data: Prisma.ClientUpdateInput = {};

  if ("name" in body) {
    const v = strOrNull(body.name);
    if (v) data.name = v; // el nombre no puede quedar vacío
  }
  for (const f of ["contactName", "email", "phone", "address", "taxId", "category", "zone", "notes"] as const) {
    if (f in body) {
      const v = strOrNull(body[f]);
      if (v !== undefined) data[f] = v;
    }
  }
  if ("status" in body) {
    const v = body.status;
    if (typeof v === "string" && STATUS_SET.has(v)) data.status = v;
    else return NextResponse.json({ error: "Estado de cliente inválido." }, { status: 400 });
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
  }

  try {
    const client = await prisma.client.update({ where: { id }, data });
    return NextResponse.json({ client });
  } catch {
    return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });
  }
}

// DELETE /api/clients/:id
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });
  }
}
