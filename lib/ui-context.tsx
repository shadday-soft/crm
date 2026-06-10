"use client";

// Estado de la navegación lateral: el drawer expandible (con etiquetas) que se
// superpone sobre el riel de iconos. El riel siempre está visible en desktop.

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type UIContext = {
  drawerOpen: boolean;
  toggleDrawer: () => void;
  closeDrawer: () => void;
};

const Ctx = createContext<UIContext | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = useCallback(() => setDrawerOpen((v) => !v), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  return (
    <Ctx.Provider value={{ drawerOpen, toggleDrawer, closeDrawer }}>
      {children}
    </Ctx.Provider>
  );
}

export function useUI(): UIContext {
  const c = useContext(Ctx);
  if (!c) throw new Error("useUI debe usarse dentro de <UIProvider>");
  return c;
}
