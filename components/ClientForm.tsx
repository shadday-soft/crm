"use client";

import { useState } from "react";
import type { Client } from "@/lib/types";
import { CLIENT_STATUS } from "@/lib/constants";
import { toast } from "@/lib/toast";

type Props = {
  client?: Client; // si viene, es edición
  onSaved: (client: Client) => void;
  onCancel?: () => void;
};

const inputCls =
  "w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelCls = "mb-1 block text-label-md uppercase text-on-surface-variant";

type FormState = {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  category: string;
  zone: string;
  status: string;
  notes: string;
};

function initForm(c?: Client): FormState {
  return {
    name: c?.name ?? "",
    contactName: c?.contactName ?? "",
    email: c?.email ?? "",
    phone: c?.phone ?? "",
    address: c?.address ?? "",
    taxId: c?.taxId ?? "",
    category: c?.category ?? "",
    zone: c?.zone ?? "",
    status: c?.status ?? "ACTIVO",
    notes: c?.notes ?? "",
  };
}

export default function ClientForm({ client, onSaved, onCancel }: Props) {
  const [form, setForm] = useState<FormState>(() => initForm(client));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(client ? `/api/clients/${client.id}` : "/api/clients", {
        method: client ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo guardar.");
        toast.error("No se pudo guardar el cliente", { description: data.error });
        return;
      }
      toast.success(client ? "Cliente actualizado" : "Cliente creado");
      onSaved(data.client);
    } catch {
      setError("Error de red al guardar.");
      toast.error("Error de red al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Nombre / Razón social *</label>
        <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Persona de contacto</label>
          <input className={inputCls} value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Estado</label>
          <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
            {CLIENT_STATUS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Correo</label>
          <input type="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Teléfono</label>
          <input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>NIT / Identificación</label>
          <input className={inputCls} value={form.taxId} onChange={(e) => set("taxId", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Zona</label>
          <input className={inputCls} value={form.zone} onChange={(e) => set("zone", e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Categoría</label>
        <input className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)} />
      </div>

      <div>
        <label className={labelCls}>Dirección</label>
        <input className={inputCls} value={form.address} onChange={(e) => set("address", e.target.value)} />
      </div>

      <div>
        <label className={labelCls}>Notas</label>
        <textarea
          className={`${inputCls} min-h-[80px] resize-y`}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Información relevante del cliente…"
        />
      </div>

      {error && (
        <div className="rounded-md bg-error-container px-3 py-2 text-body-sm text-error-on">{error}</div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-body-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-on-primary shadow-e2 transition-colors hover:bg-primary-container disabled:opacity-60"
        >
          {saving ? "Guardando…" : client ? "Guardar cambios" : "Crear cliente"}
        </button>
      </div>
    </form>
  );
}
