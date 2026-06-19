"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sileo";
import NavBar from "./NavBar";
import { NavRail, NavDrawer } from "./Sidebar";

// Estructura: navbar arriba (full width) + riel de iconos a la izquierda +
// contenido a la derecha. El drawer con etiquetas se superpone bajo el navbar.
// En /login se muestra el contenido a pantalla completa, sin el chrome de la app.
export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return (
      <>
        {children}
        <Toaster position="top-right" theme="light" options={{ fill: "#000000" }} />
      </>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <NavBar />
      <div className="flex min-h-0 flex-1">
        <NavRail />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
      <NavDrawer />
      <Toaster
        position="top-right"
        theme="light"
        options={{ fill: "#000000" }}
        offset={{ top: 64 }}
      />
    </div>
  );
}
