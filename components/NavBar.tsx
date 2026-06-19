"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import ApiCounter from "./ApiCounter";
import { useConfig } from "@/lib/config-context";
import { useUI } from "@/lib/ui-context";

const SECTION: Record<string, string> = {
  "/": "Inicio",
  "/map": "Mapa",
  "/crm": "CRM",
};

function sectionName(pathname: string) {
  if (pathname.startsWith("/map")) return "Mapa";
  if (pathname.startsWith("/crm")) return "CRM";
  if (pathname.startsWith("/clients")) return "Clientes";
  if (pathname.startsWith("/finance")) return "Finanzas";
  return SECTION[pathname] ?? "Inicio";
}

export default function NavBar() {
  const pathname = usePathname();
  const { openKeyModal, hasKey } = useConfig();
  const { drawerOpen, toggleDrawer } = useUI();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const user = session?.user;
  const isAdmin = user?.role === "ADMIN";
  const initial = (user?.name || user?.email || "?").charAt(0).toUpperCase();

  return (
    <header className="relative z-[1100]  flex h-[var(--nav-h)] shrink-0 items-center gap-2 border-b border-line bg-surface-container-high px-3 sm:gap-3 sm:px-4">
      <button
        onClick={toggleDrawer}
        aria-label="Abrir menú"
        aria-expanded={drawerOpen}
        className="grid h-9 w-9 place-items-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
          {drawerOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>

      <Link href="/" className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-on-primary">
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-5.2-7-11a7 7 0 1 1 14 0c0 5.8-7 11-7 11Z" />
            <circle cx="12" cy="10" r="2.4" />
          </svg>
        </span>
        <span className="text-label-lg font-bold tracking-tight text-on-surface">Prospecta</span>
      </Link>

      <span className="hidden items-center gap-2 text-on-surface-variant sm:flex">
        <span className="text-outline-variant">/</span>
        <span className="text-body-sm font-medium">{sectionName(pathname)}</span>
      </span>

      <div className="ml-auto flex items-center gap-2">
        <ApiCounter />
        <button
          onClick={openKeyModal}
          title="Configurar API key"
          className="relative grid h-9 w-9 place-items-center rounded-md border border-line bg-surface-container-lowest text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
        >
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.3 4.3a1 1 0 0 1 1-.8h1.4a1 1 0 0 1 1 .8l.3 1.6a6.6 6.6 0 0 1 1.6.9l1.5-.6a1 1 0 0 1 1.2.4l.7 1.2a1 1 0 0 1-.2 1.3l-1.2 1a6.6 6.6 0 0 1 0 1.8l1.2 1a1 1 0 0 1 .2 1.3l-.7 1.2a1 1 0 0 1-1.2.4l-1.5-.6a6.6 6.6 0 0 1-1.6.9l-.3 1.6a1 1 0 0 1-1 .8h-1.4a1 1 0 0 1-1-.8l-.3-1.6a6.6 6.6 0 0 1-1.6-.9l-1.5.6a1 1 0 0 1-1.2-.4l-.7-1.2a1 1 0 0 1 .2-1.3l1.2-1a6.6 6.6 0 0 1 0-1.8l-1.2-1a1 1 0 0 1-.2-1.3l.7-1.2a1 1 0 0 1 1.2-.4l1.5.6a6.6 6.6 0 0 1 1.6-.9l.3-1.6Z" />
            <circle cx="12" cy="12" r="2.6" />
          </svg>
          {hasKey === false && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-surface-container-lowest" />
          )}
        </button>

        {user && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              title={user.email ?? "Cuenta"}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-on-primary transition-opacity hover:opacity-90"
            >
              {initial}
            </button>

            {menuOpen && (
              <>
                <button
                  className="fixed inset-0 z-[1200] cursor-default"
                  aria-hidden="true"
                  tabIndex={-1}
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  role="menu"
                  className="absolute right-0 z-[1300] mt-2 w-60 overflow-hidden rounded-xl border border-line bg-surface-container-lowest shadow-e3"
                >
                  <div className="border-b border-line px-4 py-3">
                    <div className="truncate text-body-sm font-semibold text-on-surface">
                      {user.name || "Usuario"}
                    </div>
                    <div className="truncate text-label-md text-on-surface-variant">{user.email}</div>
                    {isAdmin && (
                      <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-label-md font-medium text-primary">
                        Administrador
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <Link
                      href="/usuarios"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-body-sm text-on-surface transition-colors hover:bg-surface-container-high"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 20a8 8 0 0 1 16 0" />
                      </svg>
                      Usuarios
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      signOut({ redirectTo: "/login" });
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-body-sm text-danger transition-colors hover:bg-danger/10"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H3m0 0 4-4m-4 4 4 4M11 4h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" />
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
