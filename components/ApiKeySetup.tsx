"use client";

import { useEffect, useState } from "react";
import { useApiCounter } from "@/lib/api-counter";
import { toast } from "@/lib/toast";

type Props = {
  dismissable: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export default function ApiKeySetup({ dismissable, onClose, onSaved }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [validate, setValidate] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addApiCalls } = useApiCounter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissable) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismissable, onClose]);

  async function handleSave() {
    if (!apiKey.trim()) {
      setError("Ingresa tu clave.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim(), validate }),
      });
      const data = await res.json();
      if (data.apiCalls) addApiCalls(data.apiCalls);
      if (!res.ok || !data.ok) {
        setError(data.error || "No se pudo guardar la clave.");
        toast.error("No se pudo guardar la clave", { description: data.error });
        return;
      }
      toast.success("API key guardada");
      onSaved();
    } catch {
      setError("Error de red al guardar la clave.");
      toast.error("Error de red al guardar la clave");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[2000] flex animate-fade-in items-center justify-center bg-on-surface/40 p-4"
      onClick={() => dismissable && onClose()}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-lg bg-surface-container-lowest shadow-e3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 bg-surface-subtle px-5 py-4">
          <div>
            <h2 className="text-headline-md text-on-surface">
              {dismissable ? "Cambiar API key" : "Configura tu Google Places API key"}
            </h2>
            <p className="mt-0.5 text-body-sm text-on-surface-variant">
              Se guarda localmente en <code className="rounded bg-surface-container px-1">.env.local</code>.
            </p>
          </div>
          {dismissable && (
            <button
              onClick={onClose}
              className="rounded-md p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              aria-label="Cerrar"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="space-y-4 p-5">
          <ol className="space-y-1.5 rounded-md bg-surface-container-low p-4 text-body-sm text-on-surface-variant">
            <li>
              1. Entra a{" "}
              <a
                href="https://console.cloud.google.com/"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Google Cloud Console
              </a>{" "}
              y crea (o elige) un proyecto.
            </li>
            <li>
              2. Habilita <strong className="font-semibold text-on-surface">Places API (New)</strong> en la biblioteca de APIs.
            </li>
            <li>
              3. En <em>Credenciales</em>, crea una <strong className="font-semibold text-on-surface">Clave de API</strong>.
            </li>
            <li>4. Pégala aquí abajo. Recomendado: restringe la clave a Places API.</li>
          </ol>

          <div>
            <label className="mb-1 block text-label-md uppercase text-on-surface-variant">API key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="AIza..."
              autoFocus
              className="w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <label className="flex items-center gap-2 text-body-sm text-on-surface-variant">
            <input
              type="checkbox"
              checked={validate}
              onChange={(e) => setValidate(e.target.checked)}
              className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
            />
            Validar la clave con Google (consume 1 llamada a la API)
          </label>

          {error && (
            <div className="rounded-md bg-error-container px-3 py-2 text-body-sm text-error-on">{error}</div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-line p-5">
          {dismissable && (
            <button
              onClick={onClose}
              className="rounded-md px-4 py-2 text-body-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-on-primary shadow-e2 transition-colors hover:bg-primary-container disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar clave"}
          </button>
        </div>
      </div>
    </div>
  );
}
