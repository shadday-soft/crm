"use client";

import { useMemo, useState } from "react";
import type { FinanceEntry } from "@/lib/types";
import { FINANCE_KIND, FINANCE_STATUS, findOption, recurrenceLabel } from "@/lib/constants";
import { formatMoney, formatDate } from "@/lib/format";
import { toast } from "@/lib/toast";
import StatusBadge from "./StatusBadge";
import FinanceFormModal from "./FinanceFormModal";
import { useFinance } from "./FinanceProvider";

export default function DashboardFinance() {
  const { entries, clients, loading, setEntries, upsert: upsertEntry, remove: removeEntry } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FinanceEntry | null>(null);

  const sum = (fn: (e: FinanceEntry) => boolean) => entries.filter(fn).reduce((a, e) => a + e.amount, 0);
  const summary = useMemo(() => {
    const cobrado = sum((e) => e.kind === "COBRO" && e.status === "PAGADO");
    const porCobrar = sum((e) => e.kind === "COBRO" && e.status === "PENDIENTE");
    const porPagarPagado = sum((e) => e.kind === "POR_PAGAR" && e.status === "PAGADO");
    const porPagar = sum((e) => e.kind === "POR_PAGAR" && e.status === "PENDIENTE");
    const gastos = sum((e) => e.kind === "GASTO");
    return {
      porCobrar,
      cobrado,
      porPagar,
      // Gastos realizados: gastos directos + cuentas por pagar ya pagadas.
      gastos: gastos + porPagarPagado,
      // Saldo proyectado: ingresos (cobrados + por cobrar) − pagos (pagados + pendientes) − gastos.
      saldoActual: cobrado + porCobrar - porPagarPagado - porPagar - gastos,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  // El listado muestra solo los movimientos del mes actual.
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = (() => {
    const raw = now.toLocaleDateString("es", { month: "long", year: "numeric" });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  })();
  const monthEntries = useMemo(
    () => entries.filter((e) => e.date.slice(0, 7) === monthKey),
    [entries, monthKey]
  );

  function upsert(entry: FinanceEntry) {
    upsertEntry(entry);
    setShowForm(false);
    setEditing(null);
  }
  function remove(id: string) {
    removeEntry(id);
    setEditing(null);
  }
  async function toggleStatus(entry: FinanceEntry) {
    // Recurrente pendiente: registrar la ocurrencia y reprogramar el siguiente periodo.
    if (entry.recurrence !== "NONE" && entry.status === "PENDIENTE") {
      const res = await fetch(`/api/finance/${entry.id}/pay`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setEntries((prev) => {
          const updated = prev.map((e) => (e.id === entry.id ? data.entry : e));
          return data.payment ? [data.payment, ...updated] : updated;
        });
        toast.success("Movimiento registrado", { description: "Próxima ocurrencia reprogramada." });
      } else {
        toast.error("No se pudo registrar el movimiento");
      }
      return;
    }

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
    { label: "Por cobrar", value: summary.porCobrar, color: "#1f4a44" },
    { label: "Cobrado", value: summary.cobrado, color: "#1E8E3E" },
    { label: "Por pagar", value: summary.porPagar, color: "#b8512f" },
    { label: "Gastos", value: summary.gastos, color: "#d9492f" },
  ];

  return (
    <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(31,74,68,0.06)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#21322f]">Costos y gastos</h2>
          <p className="text-sm text-[#6f827b]">Control de la cartera general (incluye gastos sin cliente).</p>
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
          Nuevo movimiento
        </button>
      </div>

      {/* Saldo actual: cuánto dinero deberías tener ahora */}
      <div className="mt-4 rounded-2xl bg-[#1f4a44] p-5 text-white">
        <div className="text-sm text-white/70">Dinero que deberías tener ahora</div>
        <div className="mt-1 text-3xl font-bold tabular-nums">{formatMoney(summary.saldoActual)}</div>
        <div className="mt-1 text-xs text-white/50">cobros − cuentas por pagar − gastos (incluye pendientes)</div>
      </div>

      {/* Resumen */}
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl bg-[#f1f7f4] p-4">
            <div className="text-xs text-[#6f827b]">{c.label}</div>
            <div className="mt-1 text-xl font-bold tabular-nums" style={{ color: c.color }}>
              {formatMoney(c.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Movimientos del mes actual */}
      <div className="mt-4">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[#9fb3ad]">
          Movimientos de {monthLabel}
        </div>
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-12 w-full" />
            ))}
          </div>
        ) : monthEntries.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#9fb3ad]">
            Sin movimientos este mes.
          </p>
        ) : (
          <ul className="max-h-[320px] divide-y divide-[#e7eeeb] overflow-y-auto">
            {monthEntries.map((e) => {
              const income = e.kind === "COBRO";
              return (
                <li key={e.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge option={findOption(FINANCE_KIND, e.kind)} />
                      {recurrenceLabel(e.recurrence) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#e2efe9] px-2 py-0.5 text-label-md font-medium text-[#2f6f63]">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M5.5 9a7 7 0 0 1 12-2.5L20 9M18.5 15a7 7 0 0 1-12 2.5L4 15" />
                          </svg>
                          {recurrenceLabel(e.recurrence)}
                        </span>
                      )}
                      {e.category && (
                        <span
                          className="rounded-full px-2 py-0.5 text-label-md font-medium"
                          style={{ backgroundColor: `${e.category.color}1A`, color: e.category.color }}
                        >
                          {e.category.name}
                        </span>
                      )}
                      <span className="truncate font-medium text-[#21322f]">{e.concept || "Sin concepto"}</span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-[#6f827b]">
                      {e.client?.name ?? "General"} · {formatDate(e.date)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold tabular-nums" style={{ color: income ? "#1E8E3E" : "#d9492f" }}>
                      {income ? "+" : "−"}
                      {formatMoney(e.amount)}
                    </div>
                    <button
                      onClick={() => toggleStatus(e)}
                      title={
                        e.recurrence !== "NONE" && e.status === "PENDIENTE"
                          ? "Registrar y reprogramar"
                          : e.status === "PAGADO"
                          ? "Marcar pendiente"
                          : "Marcar pagado"
                      }
                      className="mt-1 transition-opacity hover:opacity-80"
                    >
                      <StatusBadge option={findOption(FINANCE_STATUS, e.status)} />
                    </button>
                  </div>

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
