"use client";

import { useApiCounter } from "@/lib/api-counter";

// Indicador de llamadas a la Google Places API en la sesión.
export default function ApiCounter() {
  const { apiCalls, resetApiCalls } = useApiCounter();

  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-line bg-surface-container-low px-2.5 py-1 text-body-sm"
      title="Llamadas a Google Places en esta sesión. La capa gratuita (USD $200/mes) cubre varios miles de llamadas."
    >
      <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
      </svg>
      <span className="font-semibold tabular-nums text-on-surface">{apiCalls}</span>
      <span className="hidden text-on-surface-variant sm:inline">llamadas API</span>
      <button
        onClick={() => {
          if (confirm("¿Reiniciar el contador de llamadas de la sesión?")) resetApiCalls();
        }}
        title="Reiniciar contador"
        className="ml-0.5 rounded p-0.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 14a7 7 0 0 0 12.9 2.5M19 10A7 7 0 0 0 6.1 7.5" />
        </svg>
      </button>
    </div>
  );
}
