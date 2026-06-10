import { NextResponse } from "next/server";
import { hasApiKey, setApiKey } from "@/lib/apiKey";
import { validateApiKey } from "@/lib/places";

// GET /api/config -> ¿hay API key configurada?
export async function GET() {
  return NextResponse.json({ hasKey: await hasApiKey() });
}

// POST /api/config -> guarda (y opcionalmente valida) la API key en .env.local
export async function POST(req: Request) {
  let body: { apiKey?: string; validate?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const apiKey = body.apiKey?.trim();
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "La clave está vacía." }, { status: 400 });
  }

  let apiCalls = 0;
  if (body.validate !== false) {
    const v = await validateApiKey(apiKey);
    apiCalls = 1; // la validación consume 1 llamada
    if (!v.ok) {
      return NextResponse.json({ ok: false, error: v.message, apiCalls }, { status: 400 });
    }
  }

  try {
    await setApiKey(apiKey);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "No se pudo guardar la clave." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, apiCalls });
}
