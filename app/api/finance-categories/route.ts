import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function cleanColor(v: unknown): string | null {
  if (typeof v !== "string") return null;
  return /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim() : null;
}

// GET /api/finance-categories
export async function GET() {
  try {
    const categories = await prisma.financeCategory.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ categories });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al consultar categorías.", categories: [] },
      { status: 500 }
    );
  }
}

// POST /api/finance-categories  { name, color }
export async function POST(req: Request) {
  let body: { name?: string; color?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });

  const category = await prisma.financeCategory.create({
    data: { name, color: cleanColor(body.color) ?? "#1f4a44" },
  });
  return NextResponse.json({ category }, { status: 201 });
}
