"use client";

// Contador de llamadas a la Google Places API "de la sesión".
// Se persiste en localStorage para sobrevivir recargas; el usuario puede
// reiniciarlo con un botón. Cada respuesta del backend trae cuántas llamadas
// facturables hizo, y el cliente las acumula aquí.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "prospecta.apiCalls";
const STORAGE_SINCE = "prospecta.apiCallsSince";

type ApiCounterContext = {
  apiCalls: number;
  since: string | null;
  addApiCalls: (n: number) => void;
  resetApiCalls: () => void;
};

const Ctx = createContext<ApiCounterContext | null>(null);

export function ApiCounterProvider({ children }: { children: ReactNode }) {
  const [apiCalls, setApiCalls] = useState(0);
  const [since, setSince] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Carga inicial desde localStorage.
  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY) ?? "0");
    setApiCalls(Number.isFinite(stored) ? stored : 0);
    let s = localStorage.getItem(STORAGE_SINCE);
    if (!s) {
      s = new Date().toISOString();
      localStorage.setItem(STORAGE_SINCE, s);
    }
    setSince(s);
    setHydrated(true);
  }, []);

  // Persiste cambios.
  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, String(apiCalls));
  }, [apiCalls, hydrated]);

  const addApiCalls = useCallback((n: number) => {
    if (!n || n <= 0) return;
    setApiCalls((prev) => prev + n);
  }, []);

  const resetApiCalls = useCallback(() => {
    setApiCalls(0);
    const s = new Date().toISOString();
    localStorage.setItem(STORAGE_SINCE, s);
    setSince(s);
  }, []);

  return (
    <Ctx.Provider value={{ apiCalls, since, addApiCalls, resetApiCalls }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApiCounter(): ApiCounterContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApiCounter debe usarse dentro de <ApiCounterProvider>");
  return ctx;
}
