"use client";

import { useEffect, useMemo, useState } from "react";
import type { FinanceEntry } from "@/lib/types";
import { FINANCE_KIND, FINANCE_STATUS, findOption } from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/format";
import { toast } from "@/lib/toast";
import StatusBadge from "./StatusBadge";
import FinanceFormModal from "./FinanceFormModal";

export default function FinancePanel({ clientId }: { clientId: string }) {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FinanceEntry | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance?clientId=${clientId}`, { cache: "no-store" });
      const data = await res.json();
      setEntries(data.entries ?? []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const sum = (f: (e: FinanceEntry) => boolean) =>
    entries.filter(f).reduce((acc, e) => acc + e.amount, 0);

  const summary = useMemo(
    () => ({
      porCobrar: sum((e) => e.kind === "COBRO" && e.status === "PENDIENTE"),
      cobrado: sum((e) => e.kind === "COBRO" && e.status === "PAGADO"),
      porPagar: sum((e) => e.kind === "POR_PAGAR" && e.status === "PENDIENTE"),
      gastos: sum((e) => e.kind === "GASTO"),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries]
  );

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  function upsert(entry: FinanceEntry) {
    setEntries((prev) => {
      const i = prev.findIndex((e) => e.id === entry.id);
      if (i === -1) return [entry, ...prev];
      const copy = [...prev];
      copy[i] = entry;
      return copy;
    });
    setShowForm(false);
    setEditing(null);
  }
  function remove(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setEditing(null);
  }
  async function toggleStatus(entry: FinanceEntry) {
    const status = entry.status === "PAGADO" ? "PENDIENTE" : "PAGADO";
    const res = await fetch(`/api/finance/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (res.ok) {
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? data.entry : e)));
      toast.success(status === "PAGADO" ? "Marcado como pagado" : "Marcado como pendiente");
    } else {
      toast.error("No se pudo actualizar el movimiento");
    }
  }

  const cards = [
    { label: "Por cobrar", value: summary.porCobrar, color: "text-primary" },
    { label: "Cobrado", value: summary.cobrado, color: "text-success" },
    { label: "Por pagar", value: summary.porPagar, color: "text-tertiary" },
    { label: "Gastos", value: summary.gastos, color: "text-danger" },
  ];

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-line bg-surface-container-lowest p-4">
            <div className="text-label-md uppercase text-on-surface-variant">{c.label}</div>
            <div className={`mt-1 text-headline-md font-bold tabular-nums ${c.color}`}>{formatNumber(c.value)}</div>
          </div>
        ))}
      </div>

      {/* Lista */}
      <section className="rounded-lg border border-line bg-surface-container-lowest">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <span className="text-label-md uppercase text-on-surface-variant">Movimientos</span>
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-body-sm font-semibold text-on-primary transition-colors hover:bg-primary-container"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            Nuevo movimiento
          </button>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-12 w-full" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="p-8 text-center text-body-sm text-on-surface-variant">
            Sin movimientos. Registra el primer cobro, pago o gasto.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {entries.map((e) => {
              const income = e.kind === "COBRO";
              const overdue = e.status === "PENDIENTE" && e.dueDate && new Date(e.dueDate).getTime() < startOfToday;
              return (
                <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge option={findOption(FINANCE_KIND, e.kind)} />
                      <span className="truncate font-medium text-on-surface">{e.concept || "Sin concepto"}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-label-md text-on-surface-variant">
                      <span>{formatDate(e.date)}</span>
                      {e.dueDate && (
                        <span className={overdue ? "font-semibold text-danger" : ""}>
                          {overdue ? "Venció " : "Vence "}
                          {formatDate(e.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-semibold tabular-nums ${income ? "text-success" : "text-danger"}`}>
                      {income ? "+" : "−"}
                      {formatNumber(e.amount)}
                    </div>
                    <button
                      onClick={() => toggleStatus(e)}
                      title={e.status === "PAGADO" ? "Marcar pendiente" : "Marcar pagado"}
                      className="mt-1 transition-opacity hover:opacity-80"
                    >
                      <StatusBadge option={findOption(FINANCE_STATUS, e.status)} />
                    </button>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => {
                        setEditing(e);
                        setShowForm(true);
                      }}
                      className="rounded-md p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                      aria-label="Editar"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3M13.5 6.5l3 3" />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {showForm && (
        <FinanceFormModal
          entry={editing ?? undefined}
          clientId={clientId}
          onSaved={upsert}
          onDeleted={remove}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
