import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TASK_PRIORITY, TASK_STATUS, TASK_RECURRENCE } from "@/lib/constants";

const PRIORITY_SET = new Set(TASK_PRIORITY.map((o) => o.value));
const STATUS_SET = new Set(TASK_STATUS.map((o) => o.value));
const RECURRENCE_SET = new Set(TASK_RECURRENCE.map((o) => o.value));
const typeInclude = {
  type: { select: { id: true, name: true, color: true } },
  client: { select: { id: true, name: true } },
};

function toDate(v: unknown): Date | null {
  if (v === null || v === undefined || v === "") return null;
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d;
}

// GET /api/tasks            -> todas
// GET /api/tasks?clientId=X -> de un cliente
// GET /api/tasks?scope=general -> sin cliente (actividades del calendario)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const scope = searchParams.get("scope");

  const where =
    clientId != null ? { clientId } : scope === "general" ? { clientId: null } : {};

  const tasks = await prisma.task.findMany({
    where,
    include: typeInclude,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ tasks });
}

// POST /api/tasks
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "El título es obligatorio." }, { status: 400 });

  const priority =
    typeof body.priority === "string" && PRIORITY_SET.has(body.priority) ? body.priority : "MEDIA";
  const status =
    typeof body.status === "string" && STATUS_SET.has(body.status) ? body.status : "PENDIENTE";
  const recurrence =
    typeof body.recurrence === "string" && RECURRENCE_SET.has(body.recurrence) ? body.recurrence : "NONE";

  const task = await prisma.task.create({
    data: {
      title,
      description: typeof body.description === "string" && body.description.trim() ? body.description.trim() : null,
      priority,
      status,
      recurrence,
      dueDate: toDate(body.dueDate),
      completedAt: status === "COMPLETADA" ? new Date() : null,
      typeId: typeof body.typeId === "string" && body.typeId ? body.typeId : null,
      clientId: typeof body.clientId === "string" && body.clientId ? body.clientId : null,
    },
    include: typeInclude,
  });

  return NextResponse.json({ task }, { status: 201 });
}
