"use client";

import { useEffect, useMemo, useState } from "react";
import type { FinanceEntry, FinanceCategory } from "@/lib/types";
import { FINANCE_KIND, FINANCE_STATUS, findOption } from "@/lib/constants";
import { formatMoney, formatDate } from "@/lib/format";
import { toast } from "@/lib/toast";
import StatusBadge from "@/components/StatusBadge";
import FinanceFormModal from "@/components/FinanceFormModal";
import FinanceCategoryManager from "@/components/FinanceCategoryManager";

function Skeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton h-12 w-full" style={{ opacity: 1 - i * 0.09 }} />
      ))}
    </div>
  );
}

export default function FinancePage() {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [fKind, setFKind] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [fClient, setFClient] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FinanceEntry | null>(null);
  const [showCategories, setShowCategories] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [fRes, cRes, catRes] = await Promise.all([
        fetch("/api/finance", { cache: "no-store" }),
        fetch("/api/clients", { cache: "no-store" }),
        fetch("/api/finance-categories", { cache: "no-store" }),
      ]);
      const f = fRes.ok ? await fRes.json() : { entries: [] };
      const c = cRes.ok ? await cRes.json() : { clients: [] };
      const cat = catRes.ok ? await catRes.json() : { categories: [] };
      if (!fRes.ok) setError("No se pudieron cargar las transacciones (¿corriste prisma db push?).");
      setEntries(f.entries ?? []);
      setClients((c.clients ?? []).map((x: { id: string; name: string }) => ({ id: x.id, name: x.name })));
      setCategories(cat.categories ?? []);
    } catch {
      setError("Error de red al cargar.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function loadCategories() {
    const res = await fetch("/api/finance-categories", { cache: "no-store" });
    const data = res.ok ? await res.json() : { categories: [] };
    setCategories(data.categories ?? []);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (q && !(e.concept ?? "").toLowerCase().includes(q)) return false;
      if (fKind && e.kind !== fKind) return false;
      if (fStatus && e.status !== fStatus) return false;
      if (fCategory && e.categoryId !== fCategory) return false;
      if (fClient === "GENERAL" && e.clientId !== null) return false;
      if (fClient && fClient !== "GENERAL" && e.clientId !== fClient) return false;
      return true;
    });
  }, [entries, search, fKind, fStatus, fCategory, fClient]);

  const sum = (f: (e: FinanceEntry) => boolean) => filtered.filter(f).reduce((a, e) => a + e.amount, 0);
  const summary = useMemo(() => {
    const totalCobro = sum((e) => e.kind === "COBRO");
    const totalPorPagar = sum((e) => e.kind === "POR_PAGAR");
    const totalGastos = sum((e) => e.kind === "GASTO");
    return {
      porCobrar: sum((e) => e.kind === "COBRO" && e.status === "PENDIENTE"),
      cobrado: sum((e) => e.kind === "COBRO" && e.status === "PAGADO"),
      porPagar: sum((e) => e.kind === "POR_PAGAR" && e.status === "PENDIENTE"),
      gastos: sum((e) => e.kind === "GASTO" || (e.kind === "POR_PAGAR" && e.status === "PAGADO")),
      saldo: totalCobro - totalPorPagar - totalGastos,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

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
    const data = res.ok ? await res.json() : null;
    if (data?.entry) {
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? data.entry : e)));
      toast.success(status === "PAGADO" ? "Marcado como pagado" : "Marcado como pendiente");
    } else {
      toast.error("No se pudo actualizar el movimiento");
    }
  }

  const hasFilters = search || fKind || fStatus || fCategory || fClient;
  const selectCls =
    "rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

  const cards = [
    { label: "Por cobrar", value: summary.porCobrar, color: "text-primary" },
    { label: "Cobrado", value: summary.cobrado, color: "text-success" },
    { label: "Por pagar", value: summary.porPagar, color: "text-tertiary" },
    { label: "Gastos", value: summary.gastos, color: "text-danger" },
    { label: "Saldo proyectado", value: summary.saldo, color: "text-on-surface" },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Cabecera + filtros */}
      <div className="space-y-3 border-b border-line bg-surface-container-lowest px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-label-md text-on-surface-variant">
            {loading ? "Cargando…" : `${filtered.length} de ${entries.length} transacciones`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCategories(true)}
              className="rounded-md border border-line px-3 py-2 text-body-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
            >
              Categorías
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-body-sm font-semibold text-on-primary shadow-e2 transition-colors hover:bg-primary-container"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
              </svg>
              Nuevo movimiento
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por concepto…"
              className={`${selectCls} w-full pl-9`}
            />
          </div>
          <select value={fKind} onChange={(e) => setFKind(e.target.value)} className={selectCls}>
            <option value="">Todos los tipos</option>
            {FINANCE_KIND.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={selectCls}>
            <option value="">Todos los estados</option>
            {FINANCE_STATUS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select value={fCategory} onChange={(e) => setFCategory(e.target.value)} className={selectCls}>
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={fClient} onChange={(e) => setFClient(e.target.value)} className={selectCls}>
            <option value="">Todos los clientes</option>
            <option value="GENERAL">General (sin cliente)</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={() => {
                setSearch("");
                setFKind("");
                setFStatus("");
                setFCategory("");
                setFClient("");
              }}
              className="rounded-md px-3 py-2 text-body-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {cards.map((c) => (
            <div key={c.label} className="rounded-md border border-line bg-surface-subtle px-3 py-2">
              <div className="text-label-md uppercase text-on-surface-variant">{c.label}</div>
              <div className={`mt-0.5 font-bold tabular-nums ${c.color}`}>{formatMoney(c.value)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto">
        {error ? (
          <div className="m-4 rounded-md bg-error-container px-4 py-3 text-body-sm text-error-on">{error}</div>
        ) : loading ? (
          <Skeleton />
        ) : entries.length === 0 ? (
          <div className="grid h-full place-items-center px-4 text-center">
            <div>
              <p className="text-body-sm text-on-surface-variant">Aún no hay transacciones.</p>
              <button
                onClick={() => {
                  setEditing(null);
                  setShowForm(true);
                }}
                className="mt-3 rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-on-primary shadow-e2 transition-colors hover:bg-primary-container"
              >
                Registrar movimiento
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="grid h-full place-items-center text-body-sm text-on-surface-variant">
            Ninguna transacción coincide con los filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-line bg-surface-subtle text-left text-label-md uppercase text-on-surface-variant">
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium">Concepto</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 text-right font-medium">Monto</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((e) => {
                  const income = e.kind === "COBRO";
                  return (
                    <tr
                      key={e.id}
                      onClick={() => {
                        setEditing(e);
                        setShowForm(true);
                      }}
                      className="cursor-pointer transition-colors hover:bg-surface-subtle"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">{formatDate(e.date)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge option={findOption(FINANCE_KIND, e.kind)} />
                      </td>
                      <td className="px-4 py-3">
                        {e.category ? (
                          <span
                            className="rounded-full px-2 py-0.5 text-label-md font-medium"
                            style={{ backgroundColor: `${e.category.color}1A`, color: e.category.color }}
                          >
                            {e.category.name}
                          </span>
                        ) : (
                          <span className="text-on-surface-variant/50">—</span>
                        )}
                      </td>
                      <td className="max-w-[260px] truncate px-4 py-3 text-on-surface">{e.concept || "Sin concepto"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">{e.client?.name ?? "General"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums" style={{ color: income ? "#1E8E3E" : "#d9492f" }}>
                        {income ? "+" : "−"}
                        {formatMoney(e.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            toggleStatus(e);
                          }}
                          title={e.status === "PAGADO" ? "Marcar pendiente" : "Marcar pagado"}
                          className="transition-opacity hover:opacity-80"
                        >
                          <StatusBadge option={findOption(FINANCE_STATUS, e.status)} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
      {showCategories && (
        <FinanceCategoryManager onClose={() => setShowCategories(false)} onChanged={loadCategories} />
      )}
    </div>
  );
}
