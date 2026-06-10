import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

function cleanColor(v: unknown): string | null {
  if (typeof v !== "string") return null;
  return /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim() : null;
}

// PATCH /api/task-types/:id
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  let body: { name?: string; color?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const data: Prisma.TaskTypeUpdateInput = {};
  if ("name" in body) {
    const n = body.name?.trim();
    if (n) data.name = n;
  }
  if ("color" in body) {
    const c = cleanColor(body.color);
    if (c) data.color = c;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
  }

  try {
    const type = await prisma.taskType.update({ where: { id }, data });
    return NextResponse.json({ type });
  } catch {
    return NextResponse.json({ error: "Tipo no encontrado." }, { status: 404 });
  }
}

// DELETE /api/task-types/:id  (las tareas que lo usaban quedan sin tipo)
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.taskType.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Tipo no encontrado." }, { status: 404 });
  }
}
