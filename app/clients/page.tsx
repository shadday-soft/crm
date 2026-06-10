"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Client } from "@/lib/types";
import { CLIENT_STATUS, findOption, prettifyType } from "@/lib/constants";
import StatusBadge from "@/components/StatusBadge";
import ClientForm from "@/components/ClientForm";

function Skeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton h-14 w-full" style={{ opacity: 1 - i * 0.1 }} />
      ))}
    </div>
  );
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fZone, setFZone] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/clients", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar.");
      setClients(data.clients);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const zones = useMemo(() => {
    const set = new Set<string>();
    clients.forEach((c) => c.zone && set.add(c.zone));
    return Array.from(set).sort();
  }, [clients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q)) return false;
      if (fStatus && c.status !== fStatus) return false;
      if (fZone && c.zone !== fZone) return false;
      return true;
    });
  }, [clients, search, fStatus, fZone]);

  const hasFilters = search || fStatus || fZone;
  const selectCls =
    "rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="flex h-full flex-col">
      {/* Cabecera + filtros */}
      <div className="space-y-3 border-b border-line bg-surface-container-lowest px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-label-md text-on-surface-variant">
            {loading ? "Cargando…" : `${filtered.length} de ${clients.length} clientes`}
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-body-sm font-semibold text-on-primary shadow-e2 transition-colors hover:bg-primary-container"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            Nuevo cliente
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
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
              placeholder="Buscar por nombre…"
              className={`${selectCls} w-full pl-9`}
            />
          </div>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={selectCls}>
            <option value="">Todos los estados</option>
            {CLIENT_STATUS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select value={fZone} onChange={(e) => setFZone(e.target.value)} className={selectCls}>
            <option value="">Todas las zonas</option>
            {zones.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={() => {
                setSearch("");
                setFStatus("");
                setFZone("");
              }}
              className="rounded-md px-3 py-2 text-body-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-auto">
        {error ? (
          <div className="m-4 rounded-md bg-error-container px-4 py-3 text-body-sm text-error-on">{error}</div>
        ) : loading ? (
          <Skeleton />
        ) : clients.length === 0 ? (
          <div className="grid h-full place-items-center px-4 text-center">
            <div className="max-w-sm">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-fixed text-primary-on-fixed">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
                </svg>
              </div>
              <h2 className="mt-4 text-headline-md text-on-surface">Aún no tienes clientes</h2>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Convierte un prospecto desde el CRM o crea un cliente desde cero.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-on-primary shadow-e2 transition-colors hover:bg-primary-container"
              >
                Nuevo cliente
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="grid h-full place-items-center text-body-sm text-on-surface-variant">
            Ningún cliente coincide con los filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-line bg-surface-subtle text-left text-label-md uppercase text-on-surface-variant">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Teléfono</th>
                  <th className="px-4 py-3 font-medium">Correo</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium">Zona</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/clients/${c.id}`)}
                    className="cursor-pointer transition-colors hover:bg-surface-subtle"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-on-surface">{c.name}</div>
                      {c.contactName && (
                        <div className="text-label-md text-on-surface-variant">{c.contactName}</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">
                      {c.phone || <span className="text-on-surface-variant/50">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">
                      {c.email || <span className="text-on-surface-variant/50">—</span>}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {c.category ? prettifyType(c.category) : <span className="text-on-surface-variant/50">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">
                      {c.zone || <span className="text-on-surface-variant/50">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge option={findOption(CLIENT_STATUS, c.status)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal crear */}
      {showCreate && (
        <div
          className="fixed inset-0 z-[2000] flex animate-fade-in items-center justify-center bg-on-surface/40 p-4"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-lg bg-surface-container-lowest shadow-e3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between bg-surface-subtle px-5 py-4">
              <h2 className="text-headline-md text-on-surface">Nuevo cliente</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-md p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                aria-label="Cerrar"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-5">
              <ClientForm
                onSaved={(c) => {
                  setClients((prev) => [c, ...prev]);
                  setShowCreate(false);
                  router.push(`/clients/${c.id}`);
                }}
                onCancel={() => setShowCreate(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
