"use client";

import { useEffect, useState } from "react";
import type { FinanceEntry, FinanceCategory } from "@/lib/types";
import { FINANCE_KIND, FINANCE_STATUS, FINANCE_RECURRENCE } from "@/lib/constants";
import { toDateInputValue } from "@/lib/format";
import { toast } from "@/lib/toast";
import FinanceCategoryManager from "./FinanceCategoryManager";

type Props = {
  entry?: FinanceEntry; // si viene, es edición
  clientId?: string | null; // cliente por defecto (ficha de cliente)
  clients?: { id: string; name: string }[]; // si viene, muestra selector de cliente
  defaultKind?: string; // tipo inicial al crear (p. ej. "POR_PAGAR")
  onSaved: (entry: FinanceEntry) => void;
  onClose: () => void;
  onDeleted?: (id: string) => void;
};

const inputCls =
  "w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelCls = "mb-1 block text-label-md uppercase text-on-surface-variant";

export default function FinanceFormModal({ entry, clientId, clients, defaultKind, onSaved, onClose, onDeleted }: Props) {
  const [kind, setKind] = useState(entry?.kind ?? defaultKind ?? "COBRO");
  const [concept, setConcept] = useState(entry?.concept ?? "");
  const [amount, setAmount] = useState(entry?.amount != null ? String(entry.amount) : "");
  const [status, setStatus] = useState(entry?.status ?? "PENDIENTE");
  const [date, setDate] = useState(entry ? toDateInputValue(entry.date) : toDateInputValue(new Date().toISOString()));
  const [dueDate, setDueDate] = useState(toDateInputValue(entry?.dueDate));
  const [recurrence, setRecurrence] = useState(entry?.recurrence ?? "NONE");
  const [clientIdState, setClientIdState] = useState((entry?.clientId ?? clientId) ?? "");
  const [categoryId, setCategoryId] = useState(entry?.categoryId ?? "");
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [showCategories, setShowCategories] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function readJson<T>(res: Response): Promise<T | null> {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  }

  async function loadCategories() {
    const res = await fetch("/api/finance-categories", { cache: "no-store" });
    const data = await readJson<{ categories?: FinanceCategory[] }>(res);
    setCategories(data?.categories ?? []);
  }
  useEffect(() => {
    loadCategories();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!isFinite(amt) || amt < 0 || amount === "") {
      setError("Ingresa un monto válido.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      kind,
      concept,
      amount: amt,
      status,
      date: date || null,
      dueDate: dueDate || null,
      recurrence,
      clientId: clientIdState || null,
      categoryId: categoryId || null,
    };
    try {
      const res = await fetch(entry ? `/api/finance/${entry.id}` : "/api/finance", {
        method: entry ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await readJson<{ entry?: FinanceEntry; error?: string }>(res);
      if (!res.ok) {
        const message = data?.error || "No se pudo guardar.";
        setError(message);
        toast.error("No se pudo guardar el movimiento", { description: message });
        return;
      }
      toast.success(entry ? "Movimiento actualizado" : "Movimiento registrado");
      if (data?.entry) onSaved(data.entry);
    } catch {
      setError("Error de red al guardar.");
      toast.error("Error de red al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!entry || !onDeleted) return;
    if (!confirm("¿Eliminar este movimiento?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/finance/${entry.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Movimiento eliminado");
        onDeleted(entry.id);
      } else {
        setError("No se pudo eliminar.");
        toast.error("No se pudo eliminar el movimiento");
      }
    } catch {
      setError("Error de red al eliminar.");
      toast.error("Error de red al eliminar");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
    <div
      className="fixed inset-0 z-[2100] flex animate-fade-in items-center justify-center bg-on-surface/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-lg bg-surface-container-lowest shadow-e3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-surface-subtle px-5 py-4">
          <h2 className="text-headline-md text-on-surface">{entry ? "Editar movimiento" : "Nuevo movimiento"}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          {clients && (
            <div>
              <label className={labelCls}>Cliente</label>
              <select className={inputCls} value={clientIdState} onChange={(e) => setClientIdState(e.target.value)}>
                <option value="">General (sin cliente)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Tipo</label>
              <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)}>
                {FINANCE_KIND.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Monto (COP)</label>
              <input
                type="number"
                min="0"
                step="any"
                className={inputCls}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Concepto</label>
            <input className={inputCls} value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="p. ej. Factura 001, Hosting, Comisión…" />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-label-md uppercase text-on-surface-variant">Categoría</span>
              <button
                type="button"
                onClick={() => setShowCategories(true)}
                className="text-label-md font-medium text-primary hover:underline"
              >
                Gestionar
              </button>
            </div>
            <select className={inputCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Estado</label>
              <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                {FINANCE_STATUS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Fecha</label>
              <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelCls}>
              {recurrence !== "NONE" ? "Próximo vencimiento" : "Vencimiento (opcional)"}
            </label>
            <input type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>Recurrencia</label>
            <select className={inputCls} value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
              {FINANCE_RECURRENCE.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {recurrence !== "NONE" && (
              <p className="mt-1 text-label-md text-on-surface-variant">
                Te recordaremos en cada vencimiento. Al marcarlo registrado, se guarda la transacción y la fecha avanza
                automáticamente al siguiente periodo.
              </p>
            )}
          </div>

          {error && <div className="rounded-md bg-error-container px-3 py-2 text-body-sm text-error-on">{error}</div>}

          <div className="flex items-center justify-between gap-2 pt-1">
            {entry && onDeleted ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-md px-3 py-2 text-body-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
              >
                {deleting ? "Eliminando…" : "Eliminar"}
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-4 py-2 text-body-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-on-primary shadow-e2 transition-colors hover:bg-primary-container disabled:opacity-60"
              >
                {saving ? "Guardando…" : entry ? "Guardar" : "Crear movimiento"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
    {showCategories && (
      <FinanceCategoryManager onClose={() => setShowCategories(false)} onChanged={loadCategories} />
    )}
    </>
  );
}
