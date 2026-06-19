import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { hashPassword } from "@/lib/password";
import type { Prisma } from "@prisma/client";

const ROLES = new Set(["ADMIN", "USER"]);
const publicSelect = { id: true, email: true, name: true, role: true, createdAt: true };
type Params = { params: Promise<{ id: string }> };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

// PATCH /api/users/:id -> actualiza nombre, rol y/o contraseña
export async function PATCH(req: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });

  const data: Prisma.UserUpdateInput = {};

  if ("name" in body) {
    data.name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : null;
  }
  if ("password" in body) {
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
    }
    data.passwordHash = await hashPassword(password);
  }
  if ("role" in body) {
    if (typeof body.role !== "string" || !ROLES.has(body.role)) {
      return NextResponse.json({ error: "Rol inválido." }, { status: 400 });
    }
    // Evitar quedarse sin administradores al degradar al último admin.
    if (target.role === "ADMIN" && body.role !== "ADMIN") {
      const admins = await prisma.user.count({ where: { role: "ADMIN" } });
      if (admins <= 1) {
        return NextResponse.json({ error: "Debe existir al menos un administrador." }, { status: 400 });
      }
    }
    data.role = body.role;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
  }

  const user = await prisma.user.update({ where: { id }, data, select: publicSelect });
  return NextResponse.json({ user });
}

// DELETE /api/users/:id
export async function DELETE(_req: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const { id } = await params;

  if (session.user.id === id) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });

  if (target.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) {
      return NextResponse.json({ error: "Debe existir al menos un administrador." }, { status: 400 });
    }
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
