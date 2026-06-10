import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FINANCE_KIND, FINANCE_STATUS } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

const KIND_SET = new Set(FINANCE_KIND.map((o) => o.value));
const STATUS_SET = new Set(FINANCE_STATUS.map((o) => o.value));
type Params = { params: Promise<{ id: string }> };

function toDate(v: unknown): Date | null {
  if (v === null || v === undefined || v === "") return null;
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d;
}

// PATCH /api/finance/:id
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const data: Prisma.FinanceEntryUpdateInput = {};

  if ("kind" in body) {
    if (typeof body.kind === "string" && KIND_SET.has(body.kind)) data.kind = body.kind;
    else return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
  }
  if ("status" in body) {
    if (typeof body.status === "string" && STATUS_SET.has(body.status)) {
      data.status = body.status;
      data.paidDate = body.status === "PAGADO" ? new Date() : null;
    } else {
      return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    }
  }
  if ("amount" in body) {
    const n = typeof body.amount === "number" ? body.amount : Number(body.amount);
    if (isFinite(n) && n >= 0) data.amount = n;
    else return NextResponse.json({ error: "Monto inválido." }, { status: 400 });
  }
  if ("concept" in body) {
    const c = typeof body.concept === "string" ? body.concept.trim() : "";
    data.concept = c === "" ? null : c;
  }
  if ("date" in body) {
    const d = toDate(body.date);
    if (d) data.date = d;
  }
  if ("dueDate" in body) data.dueDate = toDate(body.dueDate);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
  }

  try {
    const entry = await prisma.financeEntry.update({ where: { id }, data });
    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json({ error: "Movimiento no encontrado." }, { status: 404 });
  }
}

// DELETE /api/finance/:id
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.financeEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Movimiento no encontrado." }, { status: 404 });
  }
}
