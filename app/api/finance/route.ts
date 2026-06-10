import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FINANCE_KIND, FINANCE_STATUS } from "@/lib/constants";

const KIND_SET = new Set(FINANCE_KIND.map((o) => o.value));
const STATUS_SET = new Set(FINANCE_STATUS.map((o) => o.value));
const clientInclude = {
  client: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, color: true } },
};

function toDate(v: unknown): Date | null {
  if (v === null || v === undefined || v === "") return null;
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d;
}
function toAmount(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return isFinite(n) && n >= 0 ? n : null;
}

// GET /api/finance              -> todos los movimientos (dashboard)
// GET /api/finance?clientId=X   -> de un cliente
// GET /api/finance?scope=general -> generales (sin cliente)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const scope = searchParams.get("scope");
  const where =
    clientId != null ? { clientId } : scope === "general" ? { clientId: null } : {};

  try {
    const entries = await prisma.financeEntry.findMany({
      where,
      include: clientInclude,
      orderBy: { date: "desc" },
    });
    return NextResponse.json({ entries });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al consultar la cartera.", entries: [] },
      { status: 500 }
    );
  }
}

// POST /api/finance
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  // clientId opcional: si no viene, es un movimiento general (sin cliente).
  const clientId = typeof body.clientId === "string" && body.clientId ? body.clientId : null;

  const kind = typeof body.kind === "string" && KIND_SET.has(body.kind) ? body.kind : null;
  if (!kind) return NextResponse.json({ error: "Tipo de movimiento inválido." }, { status: 400 });

  const amount = toAmount(body.amount);
  if (amount === null) return NextResponse.json({ error: "Monto inválido." }, { status: 400 });

  const status =
    typeof body.status === "string" && STATUS_SET.has(body.status) ? body.status : "PENDIENTE";

  try {
    const entry = await prisma.financeEntry.create({
      data: {
        clientId,
        kind,
        status,
        amount,
        concept: typeof body.concept === "string" && body.concept.trim() ? body.concept.trim() : null,
        categoryId: typeof body.categoryId === "string" && body.categoryId ? body.categoryId : null,
        date: toDate(body.date) ?? new Date(),
        dueDate: toDate(body.dueDate),
        paidDate: status === "PAGADO" ? toDate(body.paidDate) ?? new Date() : null,
      },
      include: clientInclude,
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo crear (¿cliente válido?)." }, { status: 400 });
  }
}
