import type { NextAuthConfig } from "next-auth";

// Configuración compartida y segura para el runtime "edge" del middleware:
// NO importa Prisma ni bcrypt. El proveedor Credentials se añade en auth.ts (Node).
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    // Decide el acceso a páginas y rutas API.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // En /login: si ya hay sesión, mandar al inicio; si no, dejar ver el login.
      if (pathname === "/login") {
        return isLoggedIn ? Response.redirect(new URL("/", nextUrl)) : true;
      }

      // Rutas API sin sesión: responder 401 (no redirigir a HTML).
      if (!isLoggedIn && pathname.startsWith("/api/")) {
        return Response.json({ error: "No autenticado." }, { status: 401 });
      }

      // Resto: exige sesión (el middleware redirige a /login si falta).
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "USER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
