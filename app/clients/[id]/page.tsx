"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Client } from "@/lib/types";
import { CLIENT_STATUS, findOption, prettifyType } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { toast } from "@/lib/toast";
import StatusBadge from "@/components/StatusBadge";
import ClientForm from "@/components/ClientForm";
import TasksPanel from "@/components/TasksPanel";
import FinancePanel from "@/components/FinancePanel";

const TABS = [
  { k: "info", label: "Información" },
  { k: "tasks", label: "Tareas" },
  { k: "finance", label: "Cartera" },
] as const;
type TabKey = (typeof TABS)[number]["k"];

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState<TabKey>("info");

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/clients/${id}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "No se encontró el cliente.");
        setClient(data.client);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleDelete() {
    if (!client) return;
    if (!confirm(`¿Eliminar el cliente "${client.name}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "No se pudo eliminar.");
        toast.error("No se pudo eliminar el cliente", { description: data.error });
        return;
      }
      toast.success("Cliente eliminado");
      router.push("/clients");
    } catch {
      setError("Error de red al eliminar.");
      toast.error("Error de red al eliminar");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Link
          href="/clients"
          className="inline-flex items-center gap-1 text-body-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18 9 12l6-6" />
          </svg>
          Clientes
        </Link>

        {loading ? (
          <div className="mt-4 space-y-3">
            <div className="skeleton h-9 w-1/2" />
            <div className="skeleton h-64 w-full" />
          </div>
        ) : error ? (
          <div className="mt-4 rounded-md bg-error-container px-4 py-3 text-body-sm text-error-on">{error}</div>
        ) : !client ? null : (
          <>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-headline-lg text-on-surface">{client.name}</h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <StatusBadge option={findOption(CLIENT_STATUS, client.status)} />
                  {client.category && (
                    <span className="rounded bg-surface-container px-1.5 py-0.5 text-label-md text-on-surface-variant">
                      {prettifyType(client.category)}
                    </span>
                  )}
                  {client.prospectId && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-label-md font-medium text-primary">
                      Convertido de prospecto
                    </span>
                  )}
                  <span className="text-label-md text-on-surface-variant">
                    Cliente desde {formatDate(client.createdAt)}
                  </span>
                </div>
              </div>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="shrink-0 rounded-md px-3 py-2 text-body-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
              >
                {deleting ? "Eliminando…" : "Eliminar"}
              </button>
            </div>

            {/* Pestañas */}
            <div className="mt-6 flex gap-1 border-b border-line">
              {TABS.map((t) => (
                <button
                  key={t.k}
                  onClick={() => setTab(t.k)}
                  className={`-mb-px border-b-2 px-4 py-2.5 text-body-sm font-medium transition-colors ${
                    tab === t.k
                      ? "border-primary text-primary"
                      : "border-transparent text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-5">
              {tab === "info" && (
                <section className="rounded-lg border border-line bg-surface-container-lowest p-5">
                  <ClientForm client={client} onSaved={(c) => setClient(c)} />
                </section>
              )}
              {tab === "tasks" && <TasksPanel clientId={client.id} />}
              {tab === "finance" && <FinancePanel clientId={client.id} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
