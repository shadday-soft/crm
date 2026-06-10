"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Prospect } from "@/lib/types";
import { CONTACT_STATUS, prettifyType } from "@/lib/constants";
import ProspectTable from "@/components/ProspectTable";
import ProspectEditor from "@/components/ProspectEditor";

const PAGE_SIZES = [10, 25, 50, 100];

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      <div className="skeleton h-9 w-full" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton h-14 w-full" style={{ opacity: 1 - i * 0.08 }} />
      ))}
    </div>
  );
}

export default function CrmPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [fZone, setFZone] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [selected, setSelected] = useState<Prospect | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/prospects", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar.");
      setProspects(data.prospects);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    prospects.forEach((p) => p.category && set.add(p.category));
    return Array.from(set).sort();
  }, [prospects]);

  const zones = useMemo(() => {
    const set = new Set<string>();
    prospects.forEach((p) => p.zone && set.add(p.zone));
    return Array.from(set).sort();
  }, [prospects]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return prospects.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (fStatus && p.contactStatus !== fStatus) return false;
      if (fCategory && p.category !== fCategory) return false;
      if (fZone && p.zone !== fZone) return false;
      return true;
    });
  }, [prospects, search, fStatus, fCategory, fZone]);

  // --- Paginación (cliente) ---
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  // volver a la página 1 cuando cambian filtros, búsqueda o tamaño
  useEffect(() => {
    setPage(1);
  }, [search, fStatus, fCategory, fZone, pageSize]);

  // volver arriba al cambiar de página
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [currentPage]);

  const goTo = (p: number) => setPage(Math.min(Math.max(1, p), pageCount));

  const hasFilters = search || fStatus || fCategory || fZone;

  function clearFilters() {
    setSearch("");
    setFStatus("");
    setFCategory("");
    setFZone("");
  }

  function handleSaved(updated: Prospect) {
    setProspects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelected((s) => (s && s.id === updated.id ? updated : s));
  }

  function handleDeleted(id: string) {
    setProspects((prev) => prev.filter((p) => p.id !== id));
  }

  const selectCls =
    "rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
  const pagerBtn =
    "grid h-8 w-8 place-items-center rounded-md border border-line text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant";

  return (
    <div className="flex h-full flex-col">
      {/* Filtros */}
      <div className="border-b border-line bg-surface-container-lowest px-4 py-3">
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
            {CONTACT_STATUS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select value={fCategory} onChange={(e) => setFCategory(e.target.value)} className={selectCls}>
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{prettifyType(cat)}</option>
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
              onClick={clearFilters}
              className="rounded-md px-3 py-2 text-body-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
            >
              Limpiar
            </button>
          )}

          <button
            onClick={load}
            title="Recargar"
            className="grid h-9 w-9 place-items-center rounded-md border border-line bg-surface-container-lowest text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 14a7 7 0 0 0 12.9 2.5M19 10A7 7 0 0 0 6.1 7.5" />
            </svg>
          </button>
        </div>
        <div className="mt-2 text-label-md text-on-surface-variant">
          {loading ? "Cargando…" : `${total} de ${prospects.length} prospectos`}
        </div>
      </div>

      {/* Contenido + paginación */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div ref={scrollRef} className="flex-1 overflow-auto">
          {error ? (
            <div className="m-4 rounded-md bg-error-container px-4 py-3 text-body-sm text-error-on">{error}</div>
          ) : loading ? (
            <TableSkeleton />
          ) : prospects.length === 0 ? (
            <div className="grid h-full place-items-center px-4 text-center">
              <div className="max-w-sm">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-fixed text-primary-on-fixed">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-5.2-7-11a7 7 0 1 1 14 0c0 5.8-7 11-7 11Z" />
                    <circle cx="12" cy="10" r="2.4" />
                  </svg>
                </div>
                <h2 className="mt-4 text-headline-md text-on-surface">Aún no tienes prospectos</h2>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  Dibuja un área en el mapa, busca negocios sin sitio web e impórtalos aquí.
                </p>
                <Link
                  href="/map"
                  className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-on-primary shadow-e2 transition-colors hover:bg-primary-container"
                >
                  Buscar en el mapa
                </Link>
              </div>
            </div>
          ) : total === 0 ? (
            <div className="grid h-full place-items-center text-body-sm text-on-surface-variant">
              Ningún prospecto coincide con los filtros.
            </div>
          ) : (
            <ProspectTable prospects={paged} onSelect={setSelected} selectedId={selected?.id} />
          )}
        </div>

        {/* Barra de paginación */}
        {!loading && !error && total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-container-lowest px-4 py-2.5 text-body-sm text-on-surface-variant">
            <div>
              Mostrando{" "}
              <span className="font-medium tabular-nums text-on-surface">
                {start + 1}–{Math.min(start + pageSize, total)}
              </span>{" "}
              de <span className="font-medium tabular-nums text-on-surface">{total}</span>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5">
                <span className="text-label-md">Por página</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded-md border border-outline-variant bg-surface-container-lowest px-2 py-1 text-body-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => goTo(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className={pagerBtn}
                  aria-label="Página anterior"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 18 9 12l6-6" />
                  </svg>
                </button>
                <span className="px-1 tabular-nums">
                  Página {currentPage} de {pageCount}
                </span>
                <button
                  onClick={() => goTo(currentPage + 1)}
                  disabled={currentPage >= pageCount}
                  className={pagerBtn}
                  aria-label="Página siguiente"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <ProspectEditor
          key={selected.id}
          prospect={selected}
          onClose={() => setSelected(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
