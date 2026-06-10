import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TASK_PRIORITY, TASK_STATUS, TASK_RECURRENCE } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

const PRIORITY_SET = new Set(TASK_PRIORITY.map((o) => o.value));
const STATUS_SET = new Set(TASK_STATUS.map((o) => o.value));
const RECURRENCE_SET = new Set(TASK_RECURRENCE.map((o) => o.value));
const typeInclude = {
  type: { select: { id: true, name: true, color: true } },
  client: { select: { id: true, name: true } },
};
type Params = { params: Promise<{ id: string }> };

function toDate(v: unknown): Date | null {
  if (v === null || v === undefined || v === "") return null;
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d;
}

// Avanza una fecha según la recurrencia (para la siguiente ocurrencia).
function addRecurrence(base: Date, rec: string): Date {
  const d = new Date(base);
  if (rec === "DAILY") d.setDate(d.getDate() + 1);
  else if (rec === "WEEKLY") d.setDate(d.getDate() + 7);
  else if (rec === "BIWEEKLY") d.setDate(d.getDate() + 14);
  else if (rec === "MONTHLY") d.setMonth(d.getMonth() + 1);
  return d;
}

// PATCH /api/tasks/:id
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const data: Prisma.TaskUpdateInput = {};

  if ("title" in body) {
    const t = typeof body.title === "string" ? body.title.trim() : "";
    if (t) data.title = t;
  }
  if ("description" in body) {
    const d = typeof body.description === "string" ? body.description.trim() : "";
    data.description = d === "" ? null : d;
  }
  if ("priority" in body) {
    if (typeof body.priority === "string" && PRIORITY_SET.has(body.priority)) data.priority = body.priority;
    else return NextResponse.json({ error: "Prioridad inválida." }, { status: 400 });
  }
  if ("status" in body) {
    if (typeof body.status === "string" && STATUS_SET.has(body.status)) {
      data.status = body.status;
      data.completedAt = body.status === "COMPLETADA" ? new Date() : null;
    } else {
      return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    }
  }
  if ("recurrence" in body) {
    if (typeof body.recurrence === "string" && RECURRENCE_SET.has(body.recurrence)) data.recurrence = body.recurrence;
    else return NextResponse.json({ error: "Recurrencia inválida." }, { status: 400 });
  }
  if ("dueDate" in body) data.dueDate = toDate(body.dueDate);
  if ("typeId" in body) {
    data.type =
      typeof body.typeId === "string" && body.typeId
        ? { connect: { id: body.typeId } }
        : { disconnect: true };
  }
  if ("clientId" in body) {
    data.client =
      typeof body.clientId === "string" && body.clientId
        ? { connect: { id: body.clientId } }
        : { disconnect: true };
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
  }

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Tarea no encontrada." }, { status: 404 });

  let updated;
  try {
    updated = await prisma.task.update({ where: { id }, data, include: typeInclude });
  } catch {
    return NextResponse.json({ error: "Tarea no encontrada." }, { status: 404 });
  }

  // Si la tarea recién pasó a COMPLETADA y es recurrente, crear la siguiente.
  let nextTask = null;
  const becameCompleted = existing.status !== "COMPLETADA" && updated.status === "COMPLETADA";
  if (becameCompleted && updated.recurrence !== "NONE") {
    const base = updated.dueDate ?? new Date();
    nextTask = await prisma.task.create({
      data: {
        title: updated.title,
        description: updated.description,
        priority: updated.priority,
        status: "PENDIENTE",
        recurrence: updated.recurrence,
        dueDate: addRecurrence(base, updated.recurrence),
        typeId: updated.typeId,
        clientId: updated.clientId,
      },
      include: typeInclude,
    });
  }

  return NextResponse.json({ task: updated, nextTask });
}

// DELETE /api/tasks/:id
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Tarea no encontrada." }, { status: 404 });
  }
}
