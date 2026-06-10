"use client";

import { useState } from "react";
import type { Task, TaskType } from "@/lib/types";
import { TASK_PRIORITY, TASK_STATUS, TASK_RECURRENCE } from "@/lib/constants";
import { toDateInputValue } from "@/lib/format";
import { toast } from "@/lib/toast";

type Props = {
  task?: Task; // si viene, es edición
  clientId?: string | null; // cliente por defecto (ficha de cliente)
  defaultDueDate?: string; // "YYYY-MM-DD" para precargar la fecha al crear
  types: TaskType[];
  clients?: { id: string; name: string }[]; // si viene, muestra selector de cliente
  onSaved: (task: Task) => void;
  onClose: () => void;
  onDeleted?: (id: string) => void; // si viene (y es edición), muestra Eliminar
};

const inputCls =
  "w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelCls = "mb-1 block text-label-md uppercase text-on-surface-variant";

export default function TaskFormModal({
  task,
  clientId,
  defaultDueDate,
  types,
  clients,
  onSaved,
  onClose,
  onDeleted,
}: Props) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [typeId, setTypeId] = useState(task?.typeId ?? "");
  const [priority, setPriority] = useState(task?.priority ?? "MEDIA");
  const [status, setStatus] = useState(task?.status ?? "PENDIENTE");
  const [dueDate, setDueDate] = useState(task ? toDateInputValue(task.dueDate) : (defaultDueDate ?? ""));
  const [recurrence, setRecurrence] = useState(task?.recurrence ?? "NONE");
  const [description, setDescription] = useState(task?.description ?? "");
  const [clientIdState, setClientIdState] = useState((task?.clientId ?? clientId) ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      title,
      typeId: typeId || null,
      priority,
      status,
      recurrence,
      dueDate: dueDate || null,
      description,
      clientId: clientIdState || null,
    };
    try {
      const res = await fetch(task ? `/api/tasks/${task.id}` : "/api/tasks", {
        method: task ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo guardar.");
        toast.error("No se pudo guardar la tarea", { description: data.error });
        return;
      }
      toast.success(task ? "Tarea actualizada" : "Tarea creada");
      onSaved(data.task);
      if (data.nextTask) {
        onSaved(data.nextTask); // siguiente ocurrencia de la tarea recurrente
        toast.info("Próxima ocurrencia creada");
      }
    } catch {
      setError("Error de red al guardar.");
      toast.error("Error de red al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task || !onDeleted) return;
    if (!confirm("¿Eliminar esta tarea?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Tarea eliminada");
        onDeleted(task.id);
      } else {
        setError("No se pudo eliminar.");
        toast.error("No se pudo eliminar la tarea");
      }
    } catch {
      setError("Error de red al eliminar.");
      toast.error("Error de red al eliminar");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[2100] flex animate-fade-in items-center justify-center bg-on-surface/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-lg bg-surface-container-lowest shadow-e3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-surface-subtle px-5 py-4">
          <h2 className="text-headline-md text-on-surface">{task ? "Editar tarea" : "Nueva tarea"}</h2>
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
          <div>
            <label className={labelCls}>Título *</label>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>

          {clients && (
            <div>
              <label className={labelCls}>Cliente</label>
              <select className={inputCls} value={clientIdState} onChange={(e) => setClientIdState(e.target.value)}>
                <option value="">Sin cliente (general)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Tipo</label>
              <select className={inputCls} value={typeId} onChange={(e) => setTypeId(e.target.value)}>
                <option value="">Sin tipo</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Prioridad</label>
              <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
                {TASK_PRIORITY.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Estado</label>
              <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                {TASK_STATUS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Vence</label>
              <input type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Repetir</label>
            <select className={inputCls} value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
              {TASK_RECURRENCE.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {recurrence !== "NONE" && (
              <p className="mt-1 text-label-md text-on-surface-variant">
                Al completarla se creará la siguiente automáticamente.
              </p>
            )}
          </div>

          <div>
            <label className={labelCls}>Descripción</label>
            <textarea
              className={`${inputCls} min-h-[80px] resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalle de la tarea…"
            />
          </div>

          {error && <div className="rounded-md bg-error-container px-3 py-2 text-body-sm text-error-on">{error}</div>}

          <div className="flex items-center justify-between gap-2 pt-1">
            {task && onDeleted ? (
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
                {saving ? "Guardando…" : task ? "Guardar" : "Crear tarea"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
