import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { hashPassword } from "@/lib/password";

const ROLES = new Set(["ADMIN", "USER"]);
const publicSelect = { id: true, email: true, name: true, role: true, createdAt: true };

// Exige sesión de administrador. Devuelve la sesión o null si no autorizado.
async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

// GET /api/users -> lista de usuarios (sin hash de contraseña)
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    select: publicSelect,
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ users });
}

// POST /api/users -> crea un usuario
export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : null;
  const role = typeof body.role === "string" && ROLES.has(body.role) ? body.role : "USER";

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Correo inválido." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Ya existe un usuario con ese correo." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { email, name, role, passwordHash: await hashPassword(password) },
    select: publicSelect,
  });
  return NextResponse.json({ user }, { status: 201 });
}
