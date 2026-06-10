"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useApiCounter } from "@/lib/api-counter";
import { toast } from "@/lib/toast";
import { BUSINESS_CATEGORIES, prettifyType } from "@/lib/constants";
import type { LatLng } from "@/lib/geo";
import type { SearchCandidate, SearchStats } from "@/lib/types";
import StarRating from "@/components/StarRating";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center bg-surface-container-high text-on-surface-variant">
      Cargando mapa…
    </div>
  ),
});

export default function MapPage() {
  const { addApiCalls } = useApiCounter();

  const [polygon, setPolygon] = useState<LatLng[] | null>(null);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchCandidate[]>([]);
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [searchCircle, setSearchCircle] = useState<{ center: LatLng; radiusMeters: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focusPlaceId, setFocusPlaceId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // selección para importar
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);

  const selectableIds = useMemo(
    () => results.filter((r) => !r.alreadyImported).map((r) => r.placeId),
    [results]
  );
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  // estado indeterminado del "seleccionar todos"
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
  }, [someSelected]);

  function toggleOne(placeId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(selectableIds));
  }

  async function handleSearch() {
    if (!polygon || polygon.length < 3) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/places/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ polygon, includedTypes: category ? [category] : undefined }),
      });
      const data = await res.json();
      if (data?.stats?.apiCalls) addApiCalls(data.stats.apiCalls);
      if (!res.ok) {
        setError(data.error || "Error en la búsqueda.");
        toast.error("Error en la búsqueda", { description: data.error });
        return;
      }
      const candidates: SearchCandidate[] = data.candidates;
      setResults(candidates);
      setStats(data.stats);
      setSearchCircle({ center: data.stats.center, radiusMeters: data.stats.radiusMeters });
      // por defecto, todos los nuevos quedan seleccionados
      setSelectedIds(new Set(candidates.filter((c) => !c.alreadyImported).map((c) => c.placeId)));
      if (candidates.length === 0) {
        setMessage("No se encontraron negocios sin sitio web en esta área.");
        toast.info("Sin negocios sin web en esta área");
      } else {
        toast.success(`${candidates.length} negocio(s) sin web encontrados`);
      }
    } catch {
      setError("Error de red al buscar.");
      toast.error("Error de red al buscar");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    const chosen = results.filter((r) => !r.alreadyImported && selectedIds.has(r.placeId));
    if (chosen.length === 0) return;
    setImporting(true);
    setError(null);
    try {
      const res = await fetch("/api/prospects/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates: chosen }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al importar.");
        toast.error("Error al importar", { description: data.error });
        return;
      }
      const importedSet = new Set(chosen.map((c) => c.placeId));
      setResults((prev) =>
        prev.map((r) => (importedSet.has(r.placeId) ? { ...r, alreadyImported: true } : r))
      );
      setSelectedIds(new Set());
      setMessage(
        `Importados ${data.imported} prospecto(s)${data.skipped ? `, ${data.skipped} ya existían` : ""}.`
      );
      toast.success(`Importados ${data.imported} prospecto(s)`);
    } catch {
      setError("Error de red al importar.");
      toast.error("Error de red al importar");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* Panel de búsqueda */}
      <aside className="flex w-full flex-col border-b border-line bg-surface-container-lowest md:w-[400px] md:border-b-0 md:border-r">
        <div className="space-y-3 border-b border-line p-4">
          <div>
            <h1 className="text-headline-md text-on-surface">Buscar prospectos</h1>
            <p className="text-body-sm text-on-surface-variant">
              Dibuja un área en el mapa y encuentra negocios sin sitio web.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-label-md uppercase text-on-surface-variant">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Todas las categorías</option>
              {BUSINESS_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {polygon ? (
            <div className="flex items-center gap-1.5 text-body-sm text-success">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
              </svg>
              Área lista ({polygon.length} puntos)
            </div>
          ) : (
            <p className="rounded-md bg-surface-container-low px-3 py-2 text-label-md text-on-surface-variant">
              Usa la herramienta de polígono (arriba a la derecha del mapa) para dibujar el área.
            </p>
          )}

          <button
            onClick={handleSearch}
            disabled={!polygon || loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-body-sm font-semibold text-on-primary shadow-e2 transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/40 border-t-on-primary" />
                Buscando…
              </>
            ) : (
              "Buscar en el área"
            )}
          </button>

          {error && (
            <div className="rounded-md bg-error-container px-3 py-2 text-body-sm text-error-on">{error}</div>
          )}
          {message && (
            <div className="rounded-md bg-success/20 px-3 py-2 text-body-sm text-success">
              {message}{" "}
              <Link href="/crm" className="font-semibold underline">Ir al CRM</Link>
            </div>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-px border-b border-line bg-line text-center">
            {[
              { label: "Encontrados", value: stats.found },
              { label: "En el área", value: stats.insidePolygon },
              { label: "Sin web", value: stats.withoutWebsite },
            ].map((s) => (
              <div key={s.label} className="bg-surface-container-lowest px-2 py-2.5">
                <div className="text-headline-md font-bold tabular-nums text-on-surface">{s.value}</div>
                <div className="text-label-md text-on-surface-variant">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Barra de selección */}
        {selectableIds.length > 0 && (
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2">
            <label className="flex cursor-pointer items-center gap-2 text-body-sm text-on-surface">
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 cursor-pointer rounded accent-primary"
              />
              Seleccionar todos
            </label>
            <span className="text-label-md tabular-nums text-on-surface-variant">
              {selectedIds.size} de {selectableIds.length}
            </span>
          </div>
        )}

        {/* Resultados */}
        <div className="flex-1 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-6 text-center text-body-sm text-on-surface-variant">
              Los negocios sin web aparecerán aquí tras buscar.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {results.map((c) => {
                const checked = selectedIds.has(c.placeId);
                return (
                  <li
                    key={c.placeId}
                    className={`flex gap-3 px-4 py-3 transition-colors ${
                      checked ? "bg-primary/5" : ""
                    }`}
                  >
                    {c.alreadyImported ? (
                      <span className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    ) : (
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOne(c.placeId)}
                        aria-label={`Seleccionar ${c.name}`}
                        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-primary"
                      />
                    )}
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => setFocusPlaceId(c.placeId)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-on-surface">{c.name}</div>
                          {c.address && (
                            <div className="truncate text-label-md text-on-surface-variant">{c.address}</div>
                          )}
                        </div>
                        {c.alreadyImported && (
                          <span className="shrink-0 rounded-full bg-surface-container-highest px-2 py-0.5 text-label-md font-medium text-on-surface-variant">
                            importado
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-label-md text-on-surface-variant">
                        {c.rating != null && <StarRating rating={c.rating} count={c.userRatingCount} size={12} />}
                        {c.phone && <span>{c.phone}</span>}
                        <span className="rounded bg-surface-container px-1.5 py-0.5 text-on-surface-variant">
                          {prettifyType(c.category)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Importar */}
        {selectableIds.length > 0 && (
          <div className="border-t border-line p-4">
            <button
              onClick={handleImport}
              disabled={importing || selectedIds.size === 0}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-success px-4 py-2.5 text-body-sm font-semibold text-white shadow-e2 transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importing
                ? "Importando…"
                : selectedIds.size === 0
                ? "Selecciona negocios para importar"
                : `Importar ${selectedIds.size} seleccionado(s)`}
            </button>
          </div>
        )}
      </aside>

      {/* Mapa */}
      <div className="relative min-h-[320px] flex-1">
        <MapView
          onAreaChange={setPolygon}
          results={results}
          searchCircle={searchCircle}
          focusPlaceId={focusPlaceId}
        />
      </div>
    </div>
  );
}
