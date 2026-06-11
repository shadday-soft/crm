"use client";

import { useMemo, useState } from "react";
import type { FinanceEntry } from "@/lib/types";
import { recurrenceLabel } from "@/lib/constants";
import { formatMoney, formatDate } from "@/lib/format";
import { toast } from "@/lib/toast";
import FinanceFormModal from "./FinanceFormModal";
import { useFinance } from "./FinanceProvider";

// Inicio del día (para comparar vencimientos sin la hora).
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function UpcomingPayments() {
  const { entries, clients, loading, setEntries, upsert: upsertEntry, remove: removeEntry } = useFinance();
  const [busy, setBusy] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FinanceEntry | null>(null);

  // Movimientos pendientes con vencimiento este mes o vencidos (cualquier tipo).
  const { items, aCobrar, aPagar } = useMemo(() => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const today = startOfToday();
    const list = entries
      .filter((e) => e.status === "PENDIENTE" && e.dueDate)
      .map((e) => ({ ...e, due: new Date(e.dueDate as string) }))
      .filter((e) => e.due <= endOfMonth)
      .sort((a, b) => a.due.getTime() - b.due.getTime())
      .map((e) => ({ ...e, overdue: e.due < today }));
    const aCobrar = list.filter((e) => e.kind === "COBRO").reduce((a, e) => a + e.amount, 0);
    const aPagar = list.filter((e) => e.kind !== "COBRO").reduce((a, e) => a + e.amount, 0);
    return { items: list, aCobrar, aPagar };
  }, [entries]);

  async function register(entry: FinanceEntry) {
    if (busy) return;
    setBusy(entry.id);
    try {
      const res = await fetch(`/api/finance/${entry.id}/pay`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error("No se pudo registrar el movimiento");
        return;
      }
      // Recurrente: vuelve con la fecha avanzada. Único: pasa a PAGADO y sale del listado.
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? data.entry : e)));
      toast.success(
        entry.kind === "COBRO" ? "Cobro registrado" : "Pago registrado",
        entry.recurrence !== "NONE" ? { description: "Próximo recordatorio reprogramado." } : undefined
      );
    } catch {
      toast.error("No se pudo registrar el movimiento");
    } finally {
      setBusy(null);
    }
  }

  function upsert(entry: FinanceEntry) {
    upsertEntry(entry);
    setShowForm(false);
    setEditing(null);
  }
  function remove(id: string) {
    removeEntry(id);
    setShowForm(false);
    setEditing(null);
  }

  return (
    <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(31,74,68,0.06)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#21322f]">Próximos vencimientos del mes</h2>
          <p className="text-sm text-[#6f827b]">Cobros y pagos pendientes; los recurrentes se reprograman solos.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#1f4a44] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#173a35]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          Programar
        </button>
      </div>

      {!loading && items.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#f1f7f4] p-4">
            <div className="text-xs text-[#6f827b]">Por cobrar este mes</div>
            <div className="mt-1 text-xl font-bold tabular-nums text-[#1E8E3E]">{formatMoney(aCobrar)}</div>
          </div>
          <div className="rounded-2xl bg-[#f1f7f4] p-4">
            <div className="text-xs text-[#6f827b]">Por pagar este mes</div>
            <div className="mt-1 text-xl font-bold tabular-nums text-[#b8512f]">{formatMoney(aPagar)}</div>
          </div>
        </div>
      )}

      <div className="mt-4">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-14 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#9fb3ad]">No tienes vencimientos pendientes este mes.</p>
        ) : (
          <ul className="max-h-[340px] divide-y divide-[#e7eeeb] overflow-y-auto">
            {items.map((e) => {
              const rec = recurrenceLabel(e.recurrence);
              const income = e.kind === "COBRO";
              const isBusy = busy === e.id;
              return (
                <li key={e.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium text-[#21322f]">{e.concept || "Sin concepto"}</span>
                      {rec && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#e2efe9] px-2 py-0.5 text-xs font-medium text-[#2f6f63]">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M5.5 9a7 7 0 0 1 12-2.5L20 9M18.5 15a7 7 0 0 1-12 2.5L4 15" />
                          </svg>
                          {rec}
                        </span>
                      )}
                      {e.overdue && (
                        <span className="rounded-full bg-[#f8e3da] px-2 py-0.5 text-xs font-medium text-[#b8512f]">Vencido</span>
                      )}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-[#6f827b]">
                      {e.client?.name ?? "General"} · vence {formatDate(e.dueDate)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold tabular-nums" style={{ color: income ? "#1E8E3E" : "#b8512f" }}>
                      {income ? "+" : "−"}
                      {formatMoney(e.amount)}
                    </div>
                  </div>

                  <button
                    onClick={() => register(e)}
                    disabled={isBusy}
                    title={income ? "Registrar cobro" : "Registrar pago"}
                    className="shrink-0 rounded-full bg-[#1f4a44] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#173a35] disabled:opacity-50"
                  >
                    {isBusy ? "…" : income ? "Cobrar" : "Pagar"}
                  </button>

                  <button
                    onClick={() => {
                      setEditing(e);
                      setShowForm(true);
                    }}
                    className="shrink-0 rounded-full p-1.5 text-[#6f827b] transition-colors hover:bg-[#f1f7f4] hover:text-[#21322f]"
                    aria-label="Editar"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3M13.5 6.5l3 3" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showForm && (
        <FinanceFormModal
          entry={editing ?? undefined}
          clientId={null}
          clients={clients}
          onSaved={upsert}
          onDeleted={remove}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}
