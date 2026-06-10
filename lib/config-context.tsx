"use client";

// Estado global de configuración: ¿hay API key? y control del modal de setup.
// Si no hay clave al cargar, fuerza el modal (no se puede cerrar hasta poner una).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import ApiKeySetup from "@/components/ApiKeySetup";

type ConfigContext = {
  hasKey: boolean | null; // null mientras carga
  loading: boolean;
  openKeyModal: () => void;
};

const Ctx = createContext<ConfigContext | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/config", { cache: "no-store" });
      const data = await res.json();
      setHasKey(!!data.hasKey);
      if (!data.hasKey) setModalOpen(true);
    } catch {
      setHasKey(false);
      setModalOpen(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openKeyModal = useCallback(() => setModalOpen(true), []);
  const closeKeyModal = useCallback(() => {
    if (hasKey) setModalOpen(false); // sin clave, no se puede cerrar
  }, [hasKey]);

  const onSaved = useCallback(() => {
    setHasKey(true);
    setModalOpen(false);
  }, []);

  return (
    <Ctx.Provider value={{ hasKey, loading: hasKey === null, openKeyModal }}>
      {children}
      {modalOpen && (
        <ApiKeySetup dismissable={!!hasKey} onClose={closeKeyModal} onSaved={onSaved} />
      )}
    </Ctx.Provider>
  );
}

export function useConfig(): ConfigContext {
  const c = useContext(Ctx);
  if (!c) throw new Error("useConfig debe usarse dentro de <ConfigProvider>");
  return c;
}
