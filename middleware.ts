import NextAuth from "next-auth";
import authConfig from "./auth.config";

// El middleware usa SOLO authConfig (edge-safe). Protege páginas y rutas API.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Todo excepto la API de auth y los assets internos de Next.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
