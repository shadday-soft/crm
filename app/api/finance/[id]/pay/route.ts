import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nextDueDate } from "@/lib/recurrence";

const clientInclude = {
  client: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, color: true } },
};
type Params = { params: Promise<{ id: string }> };

// POST /api/finance/:id/pay
// Registra un movimiento como realizado (cobrado / pagado), conservando su tipo.
// - Si NO es recurrente: simplemente lo pasa a PAGADO.
// - Si es recurrente: registra la ocurrencia de este ciclo (queda en el histórico)
//   y avanza fecha y vencimiento al siguiente periodo, dejándolo PENDIENTE.
export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;

  const entry = await prisma.financeEntry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Movimiento no encontrado." }, { status: 404 });

  const now = new Date();

  // No recurrente: comportamiento simple (marcar pagado).
  if (entry.recurrence === "NONE") {
    const updated = await prisma.financeEntry.update({
      where: { id },
      data: { status: "PAGADO", paidDate: now },
      include: clientInclude,
    });
    return NextResponse.json({ entry: updated });
  }

  // Recurrente: registrar la ocurrencia de este ciclo + avanzar al siguiente.
  const baseDue = entry.dueDate ?? entry.date ?? now;
  const next = nextDueDate(baseDue, entry.recurrence);
  const [payment, recurring] = await prisma.$transaction([
    prisma.financeEntry.create({
      data: {
        clientId: entry.clientId,
        categoryId: entry.categoryId,
        kind: entry.kind, // conserva el tipo original (COBRO / POR_PAGAR / GASTO)
        status: "PAGADO",
        amount: entry.amount,
        concept: entry.concept,
        recurrence: "NONE",
        date: baseDue,
        paidDate: now,
      },
      include: clientInclude,
    }),
    prisma.financeEntry.update({
      where: { id },
      data: { status: "PENDIENTE", paidDate: null, date: next, dueDate: next },
      include: clientInclude,
    }),
  ]);

  return NextResponse.json({ entry: recurring, payment });
}
