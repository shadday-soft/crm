"use client";

import { useEffect, useState } from "react";
import type { FinanceCategory } from "@/lib/types";
import { TASK_TYPE_COLORS } from "@/lib/constants";
import { toast } from "@/lib/toast";

type Props = {
  onClose: () => void;
  onChanged?: () => void; // notifica al padre para refrescar su lista
};

export default function FinanceCategoryManager({ onClose, onChanged }: Props) {
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TASK_TYPE_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/finance-categories", { cache: "no-store" });
      const data = res.ok ? await res.json() : { categories: [] };
      setCategories(data.categories ?? []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const byName = (a: FinanceCategory, b: FinanceCategory) => a.name.localeCompare(b.name);

  async function addCategory() {
    if (!newName.trim()) return;
    setError(null);
    const res = await fetch("/api/finance-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "No se pudo crear.");
      toast.error("No se pudo crear la categoría", { description: data.error });
      return;
    }
    setCategories((prev) => [...prev, data.category].sort(byName));
    setNewName("");
    toast.success("Categoría creada");
    onChanged?.();
  }

  async function patchCategory(id: string, patch: Partial<Pick<FinanceCategory, "name" | "color">>) {
    const res = await fetch(`/api/finance-categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (res.ok) {
      setCategories((prev) => prev.map((t) => (t.id === id ? data.category : t)).sort(byName));
      toast.success("Categoría actualizada");
      onChanged?.();
    } else {
      toast.error("No se pudo actualizar la categoría");
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("¿Eliminar esta categoría? Los movimientos que la usan quedarán sin categoría.")) return;
    const res = await fetch(`/api/finance-categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCategories((prev) => prev.filter((t) => t.id !== id));
      toast.success("Categoría eliminada");
      onChanged?.();
    } else {
      toast.error("No se pudo eliminar la categoría");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[2200] flex animate-fade-in items-center justify-center bg-on-surface/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-lg bg-surface-container-lowest shadow-e3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-surface-subtle px-5 py-4">
          <h2 className="text-headline-md text-on-surface">Categorías de cartera</h2>
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

        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-5">
          {loading ? (
            <p className="text-body-sm text-on-surface-variant">Cargando…</p>
          ) : categories.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">Aún no hay categorías. Crea la primera abajo.</p>
          ) : (
            <ul className="space-y-2">
              {categories.map((t) => (
                <li key={t.id} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={t.color}
                    onChange={(e) => patchCategory(t.id, { color: e.target.value })}
                    className="h-8 w-9 cursor-pointer rounded border border-outline-variant bg-transparent p-0.5"
                    title="Color"
                  />
                  <input
                    defaultValue={t.name}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== t.name) patchCategory(t.id, { name: v });
                    }}
                    className="flex-1 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-body-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    onClick={() => deleteCategory(t.id)}
                    className="rounded-md p-1.5 text-on-surface-variant transition-colors hover:bg-danger/10 hover:text-danger"
                    aria-label="Eliminar categoría"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5h6v2M10 11v6M14 11v6M7 7l1 12h8l1-12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center gap-2 border-t border-line pt-4">
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="h-8 w-9 cursor-pointer rounded border border-outline-variant bg-transparent p-0.5"
              title="Color"
            />
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
              placeholder="Nueva categoría (p. ej. Nómina, Hosting, Comisión)"
              className="flex-1 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-body-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={addCategory}
              className="rounded-md bg-primary px-3 py-1.5 text-body-sm font-semibold text-on-primary transition-colors hover:bg-primary-container"
            >
              Agregar
            </button>
          </div>

          {error && <p className="text-body-sm text-danger">{error}</p>}
        </div>
      </div>
    </div>
  );
}
