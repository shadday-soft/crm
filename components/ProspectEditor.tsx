"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Prospect } from "@/lib/types";
import {
  CONTACT_STATUS,
  PROPOSAL_STATUS,
  CONTACT_CHANNEL,
  prettifyType,
} from "@/lib/constants";
import { useApiCounter } from "@/lib/api-counter";
import { toast } from "@/lib/toast";
import StarRating from "./StarRating";
import { formatDate, toDateInputValue } from "@/lib/format";

type Props = {
  prospect: Prospect;
  onClose: () => void;
  onSaved: (updated: Prospect) => void;
  onDeleted: (id: string) => void;
};

const inputCls =
  "w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelCls = "mb-1 block text-label-md uppercase text-on-surface-variant";

type FormState = {
  name: string;
  address: string;
  phone: string;
  category: string;
  zone: string;
  contactStatus: string;
  contactChannel: string;
  lastContactDate: string;
  notes: string;
  proposalStatus: string;
  proposalValue: string;
  proposalSentDate: string;
};

function initForm(p: Prospect): FormState {
  return {
    name: p.name ?? "",
    address: p.address ?? "",
    phone: p.phone ?? "",
    category: p.category ?? "",
    zone: p.zone ?? "",
    contactStatus: p.contactStatus,
    contactChannel: p.contactChannel ?? "",
    lastContactDate: toDateInputValue(p.lastContactDate),
    notes: p.notes ?? "",
    proposalStatus: p.proposalStatus,
    proposalValue: p.proposalValue != null ? String(p.proposalValue) : "",
    proposalSentDate: toDateInputValue(p.proposalSentDate),
  };
}

export default function ProspectEditor({ prospect, onClose, onSaved, onDeleted }: Props) {
  const [form, setForm] = useState<FormState>(() => initForm(prospect));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [converting, setConverting] = useState(false);
  const { addApiCalls } = useApiCounter();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    setMounted(false);
    setTimeout(onClose, 200);
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const openingHours: string[] = (() => {
    if (!prospect.openingHours) return [];
    try {
      const parsed = JSON.parse(prospect.openingHours);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/prospects/${prospect.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          proposalValue: form.proposalValue === "" ? null : Number(form.proposalValue),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo guardar.");
        toast.error("No se pudo guardar el prospecto", { description: data.error });
        return;
      }
      onSaved(data.prospect);
      toast.success("Prospecto actualizado");
      handleClose();
    } catch {
      setError("Error de red al guardar.");
      toast.error("Error de red al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${prospect.name}" del CRM? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/prospects/${prospect.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "No se pudo eliminar.");
        toast.error("No se pudo eliminar", { description: data.error });
        return;
      }
      onDeleted(prospect.id);
      toast.success("Prospecto eliminado");
      handleClose();
    } catch {
      setError("Error de red al eliminar.");
      toast.error("Error de red al eliminar");
    } finally {
      setDeleting(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`/api/prospects/${prospect.id}/refresh`, { method: "POST" });
      const data = await res.json();
      if (data?.apiCalls) addApiCalls(data.apiCalls);
      if (!res.ok) {
        setError(data.error || "No se pudo actualizar desde Google.");
        toast.error("No se pudo actualizar desde Google", { description: data.error });
        return;
      }
      toast.success("Datos actualizados desde Google");
      const p: Prospect = data.prospect;
      setForm((f) => ({
        ...f,
        name: p.name ?? f.name,
        address: p.address ?? "",
        phone: p.phone ?? "",
        category: p.category ?? f.category,
      }));
      onSaved(p);
    } catch {
      setError("Error de red al actualizar.");
      toast.error("Error de red al actualizar");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleConvert() {
    setConverting(true);
    setError(null);
    try {
      const res = await fetch("/api/clients/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: prospect.id }),
      });
      const data = await res.json();
      if (res.status === 409 && data.clientId) {
        toast.info("Este prospecto ya era cliente");
        router.push(`/clients/${data.clientId}`);
        return;
      }
      if (!res.ok) {
        setError(data.error || "No se pudo convertir a cliente.");
        toast.error("No se pudo convertir a cliente", { description: data.error });
        return;
      }
      onSaved(data.prospect); // refleja clientId + estado CERRADO
      toast.success("Convertido a cliente");
      router.push(`/clients/${data.client.id}`);
    } catch {
      setError("Error de red al convertir.");
      toast.error("Error de red al convertir");
    } finally {
      setConverting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] flex justify-end">
      <div
        className={`absolute inset-0 bg-on-surface/40 transition-opacity duration-200 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />
      <div
        className={`relative flex h-full w-full max-w-md flex-col bg-surface-container-lowest shadow-e3 transition-transform duration-200 ease-out ${
          mounted ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 bg-surface-subtle px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-headline-md text-on-surface">{prospect.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StarRating rating={prospect.rating} count={prospect.userRatingCount} size={13} />
              <span className="rounded bg-surface-container px-1.5 py-0.5 text-label-md text-on-surface-variant">
                {prettifyType(prospect.category)}
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-md p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {prospect.clientId ? (
            <Link
              href={`/clients/${prospect.clientId}`}
              className="flex items-center justify-between gap-2 rounded-md bg-success/10 px-3 py-2.5 text-body-sm font-semibold text-success transition-colors hover:bg-success/20"
            >
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                </svg>
                Ya es cliente
              </span>
              <span>Ver ficha →</span>
            </Link>
          ) : (
            <button
              onClick={handleConvert}
              disabled={converting}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-4 py-2.5 text-body-sm font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-60"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-4A3.5 3.5 0 0 0 4 17.5V19M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm10-3v6m3-3h-6" />
              </svg>
              {converting ? "Convirtiendo…" : "Convertir a cliente"}
            </button>
          )}
          {prospect.website && (
            <div className="rounded-md bg-warning/20 px-3 py-2 text-body-sm text-tertiary">
              ⚠ Google ahora reporta un sitio web:{" "}
              <a href={prospect.website} target="_blank" rel="noreferrer" className="font-semibold underline">
                {prospect.website}
              </a>
            </div>
          )}

          {/* Datos del negocio */}
          <section className="space-y-3">
            <h3 className="text-label-md uppercase text-on-surface-variant">Datos del negocio</h3>
            <div>
              <label className={labelCls}>Nombre</label>
              <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Dirección</label>
              <input className={inputCls} value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Teléfono</label>
                <input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Zona</label>
                <input className={inputCls} value={form.zone} onChange={(e) => set("zone", e.target.value)} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-body-sm">
              {prospect.googleMapsUri && (
                <a href={prospect.googleMapsUri} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
                  Ver en Google Maps ↗
                </a>
              )}
              {prospect.phone && (
                <a href={`tel:${prospect.phone}`} className="font-medium text-primary hover:underline">
                  Llamar
                </a>
              )}
              {prospect.phone && (
                <a
                  href={`https://wa.me/${prospect.phone.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-success hover:underline"
                >
                  WhatsApp
                </a>
              )}
            </div>
            {openingHours.length > 0 && (
              <details className="rounded-md bg-surface-container-low px-3 py-2 text-body-sm text-on-surface-variant">
                <summary className="cursor-pointer font-medium text-on-surface">Horarios</summary>
                <ul className="mt-2 space-y-0.5">
                  {openingHours.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </details>
            )}
          </section>

          {/* Seguimiento de contacto */}
          <section className="space-y-3">
            <h3 className="text-label-md uppercase text-on-surface-variant">Seguimiento de contacto</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Estado</label>
                <select className={inputCls} value={form.contactStatus} onChange={(e) => set("contactStatus", e.target.value)}>
                  {CONTACT_STATUS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Canal</label>
                <select className={inputCls} value={form.contactChannel} onChange={(e) => set("contactChannel", e.target.value)}>
                  <option value="">—</option>
                  {CONTACT_CHANNEL.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Fecha de último contacto</label>
              <input type="date" className={inputCls} value={form.lastContactDate} onChange={(e) => set("lastContactDate", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Notas</label>
              <textarea
                className={`${inputCls} min-h-[90px] resize-y`}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Detalles de la conversación, objeciones, próximos pasos…"
              />
            </div>
          </section>

          {/* Propuesta */}
          <section className="space-y-3">
            <h3 className="text-label-md uppercase text-on-surface-variant">Propuesta</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Estado</label>
                <select className={inputCls} value={form.proposalStatus} onChange={(e) => set("proposalStatus", e.target.value)}>
                  {PROPOSAL_STATUS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Valor</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className={inputCls}
                  value={form.proposalValue}
                  onChange={(e) => set("proposalValue", e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Fecha de envío de propuesta</label>
              <input type="date" className={inputCls} value={form.proposalSentDate} onChange={(e) => set("proposalSentDate", e.target.value)} />
            </div>
          </section>

          <div className="space-y-2 border-t border-line pt-3 text-label-md text-on-surface-variant">
            <div>Importado: {formatDate(prospect.createdAt)}</div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="font-medium text-primary hover:underline disabled:opacity-50"
            >
              {refreshing ? "Actualizando…" : "↻ Actualizar datos desde Google (1 llamada API)"}
            </button>
          </div>

          {error && (
            <div className="rounded-md bg-error-container px-3 py-2 text-body-sm text-error-on">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-line p-4">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md px-3 py-2 text-body-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
          >
            {deleting ? "Eliminando…" : "Eliminar"}
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="rounded-md px-4 py-2 text-body-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-on-primary shadow-e2 transition-colors hover:bg-primary-container disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
