import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CONTACT_STATUS, PROPOSAL_STATUS, CONTACT_CHANNEL } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

const CONTACT_STATUS_SET = new Set(CONTACT_STATUS.map((o) => o.value));
const PROPOSAL_STATUS_SET = new Set(PROPOSAL_STATUS.map((o) => o.value));
const CONTACT_CHANNEL_SET = new Set(CONTACT_CHANNEL.map((o) => o.value));

type Params = { params: Promise<{ id: string }> };

function toDateOrNull(v: unknown): Date | null | undefined {
  if (v === undefined) return undefined; // no tocar
  if (v === null || v === "") return null;
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
  return undefined;
}

function toNumberOrNull(v: unknown): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return isNaN(n) ? undefined : n;
}

function toStringOrNull(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t === "" ? null : t;
}

// PATCH /api/prospects/:id -> actualiza campos editables (whitelist)
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const data: Prisma.ProspectUpdateInput = {};

  // strings simples
  if ("name" in body) {
    const v = toStringOrNull(body.name);
    if (v) data.name = v; // el nombre no puede quedar vacío
  }
  for (const field of ["address", "phone", "category", "zone", "notes"] as const) {
    if (field in body) {
      const v = toStringOrNull(body[field]);
      if (v !== undefined) data[field] = v;
    }
  }

  // enums
  if ("contactStatus" in body) {
    const v = body.contactStatus;
    if (typeof v === "string" && CONTACT_STATUS_SET.has(v)) data.contactStatus = v;
    else return NextResponse.json({ error: "Estado de contacto inválido." }, { status: 400 });
  }
  if ("proposalStatus" in body) {
    const v = body.proposalStatus;
    if (typeof v === "string" && PROPOSAL_STATUS_SET.has(v)) data.proposalStatus = v;
    else return NextResponse.json({ error: "Estado de propuesta inválido." }, { status: 400 });
  }
  if ("contactChannel" in body) {
    const v = body.contactChannel;
    if (v === null || v === "") data.contactChannel = null;
    else if (typeof v === "string" && CONTACT_CHANNEL_SET.has(v)) data.contactChannel = v;
    else return NextResponse.json({ error: "Canal de contacto inválido." }, { status: 400 });
  }

  // fechas
  const lastContact = toDateOrNull(body.lastContactDate);
  if (lastContact !== undefined) data.lastContactDate = lastContact;
  const proposalSent = toDateOrNull(body.proposalSentDate);
  if (proposalSent !== undefined) data.proposalSentDate = proposalSent;

  // números
  const proposalValue = toNumberOrNull(body.proposalValue);
  if (proposalValue !== undefined) data.proposalValue = proposalValue;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
  }

  try {
    const updated = await prisma.prospect.update({
      where: { id },
      data,
      include: { client: { select: { id: true } } },
    });
    const { client, ...rest } = updated;
    return NextResponse.json({ prospect: { ...rest, clientId: client?.id ?? null } });
  } catch {
    return NextResponse.json({ error: "Prospecto no encontrado." }, { status: 404 });
  }
}

// DELETE /api/prospects/:id
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.prospect.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Prospecto no encontrado." }, { status: 404 });
  }
}
