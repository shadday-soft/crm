"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useUI } from "@/lib/ui-context";

type NavItem = { href: string; label: string; icon: ReactNode; hint: string };

const NAV: NavItem[] = [
  {
    href: "/",
    label: "Inicio",
    hint: "Panel general",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 11.5 12 4l8.5 7.5M5.5 10v9h13v-9M9.5 19v-5h5v5" />
    ),
  },
  {
    href: "/map",
    label: "Mapa",
    hint: "Buscar prospectos",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.5 3.5 4.8v12.7L9 19.2m0-12.7 6 1.7m-6-1.7v12.7m6-11 5.5-1.7v12.7L15 17.5m0-11v11" />
    ),
  },
  {
    href: "/crm",
    label: "CRM",
    hint: "Prospectos de venta",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6.5h16M4 12h16M4 17.5h16" />
    ),
  },
  {
    href: "/clients",
    label: "Clientes",
    hint: "Gestión post-venta",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm10.5 8v-1.5a3.5 3.5 0 0 0-2.7-3.4M15 4.1a3.5 3.5 0 0 1 0 6.8"
      />
    ),
  },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      {children}
    </svg>
  );
}

/* Riel de iconos — siempre visible en desktop (md+). */
export function NavRail() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-[var(--rail-w)] shrink-0 flex-col items-center gap-1 border-r border-line bg-surface-container-low py-3 md:flex">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={`group relative grid h-11 w-11 place-items-center rounded-md transition-colors ${
              active
                ? "bg-primary-fixed text-primary-on-fixed"
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            }`}
          >
            <Icon>{item.icon}</Icon>
            <span className="pointer-events-none absolute left-[calc(100%+0.5rem)] z-[1200] hidden whitespace-nowrap rounded-md bg-inverse-surface px-2 py-1 text-label-md text-inverse-on-surface shadow-e2 group-hover:block">
              {item.label}
            </span>
          </Link>
        );
      })}
    </aside>
  );
}

/* Drawer expandible con etiquetas — se superpone bajo el navbar. */
export function NavDrawer() {
  const pathname = usePathname();
  const { drawerOpen, closeDrawer } = useUI();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeDrawer]);

  return (
    <>
      {/* backdrop (bajo el navbar) */}
      <div
        onClick={closeDrawer}
        className={`fixed inset-x-0 bottom-0 top-[var(--nav-h)] z-[1000] bg-on-surface/30 transition-opacity duration-200 ${
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* panel */}
      <nav
        className={`fixed bottom-0 left-0 top-[var(--nav-h)] z-[1001] flex w-[var(--drawer-w)] flex-col gap-1 border-r border-line bg-surface-container-low p-3 shadow-e3 transition-transform duration-200 ease-out ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!drawerOpen}
      >
        <p className="px-3 pb-2 pt-1 text-label-md uppercase text-on-surface-variant">Menú</p>
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeDrawer}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${
                active
                  ? "bg-primary-fixed text-primary-on-fixed"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <Icon>{item.icon}</Icon>
              <span className="flex flex-col">
                <span className="text-label-lg leading-tight">{item.label}</span>
                <span className={`text-label-md ${active ? "text-primary-on-fixed/70" : "text-on-surface-variant/70"}`}>
                  {item.hint}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
