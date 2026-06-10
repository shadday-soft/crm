import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function cleanColor(v: unknown): string | null {
  if (typeof v !== "string") return null;
  return /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim() : null;
}

// GET /api/task-types
export async function GET() {
  const types = await prisma.taskType.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ types });
}

// POST /api/task-types  { name, color }
export async function POST(req: Request) {
  let body: { name?: string; color?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });

  const type = await prisma.taskType.create({
    data: { name, color: cleanColor(body.color) ?? "#1a73e8" },
  });
  return NextResponse.json({ type }, { status: 201 });
}
