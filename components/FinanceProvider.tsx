"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { FinanceEntry } from "@/lib/types";

// Estado de finanzas compartido por los paneles del dashboard
// (Costos y gastos + Próximos vencimientos), para que cualquier alta,
// edición o registro de pago se refleje al instante en todos ellos.
type FinanceContextValue = {
  entries: FinanceEntry[];
  clients: { id: string; name: string }[];
  loading: boolean;
  setEntries: React.Dispatch<React.SetStateAction<FinanceEntry[]>>;
  upsert: (entry: FinanceEntry) => void;
  remove: (id: string) => void;
  reload: () => Promise<void>;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance debe usarse dentro de <FinanceProvider>");
  return ctx;
}

export default function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [fRes, cRes] = await Promise.all([
        fetch("/api/finance", { cache: "no-store" }),
        fetch("/api/clients", { cache: "no-store" }),
      ]);
      const f = fRes.ok ? await fRes.json() : { entries: [] };
      const c = cRes.ok ? await cRes.json() : { clients: [] };
      setEntries(f.entries ?? []);
      setClients((c.clients ?? []).map((x: { id: string; name: string }) => ({ id: x.id, name: x.name })));
    } catch {
      setEntries([]);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const upsert = useCallback((entry: FinanceEntry) => {
    setEntries((prev) => {
      const i = prev.findIndex((e) => e.id === entry.id);
      if (i === -1) return [entry, ...prev];
      const copy = [...prev];
      copy[i] = entry;
      return copy;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return (
    <FinanceContext.Provider value={{ entries, clients, loading, setEntries, upsert, remove, reload }}>
      {children}
    </FinanceContext.Provider>
  );
}
