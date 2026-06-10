import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/format";
import DashboardCalendar from "@/components/DashboardCalendar";

export const dynamic = "force-dynamic";

const CONTACT_PIPE = [
  { value: "SIN_CONTACTAR", label: "Sin contactar", bar: "bg-outline-variant", dot: "bg-outline-variant" },
  { value: "CONTACTADO", label: "Contactado", bar: "bg-primary", dot: "bg-primary" },
  { value: "EN_NEGOCIACION", label: "En negociación", bar: "bg-warning", dot: "bg-warning" },
  { value: "CERRADO", label: "Cerrado", bar: "bg-success", dot: "bg-success" },
  { value: "DESCARTADO", label: "Descartado", bar: "bg-danger", dot: "bg-danger" },
];

const PROPOSAL_PIPE = [
  { value: "SIN_ENVIAR", label: "Sin enviar", bar: "bg-outline-variant" },
  { value: "ENVIADA", label: "Enviada", bar: "bg-primary" },
  { value: "VISTA", label: "Vista", bar: "bg-tertiary" },
  { value: "ACEPTADA", label: "Aceptada", bar: "bg-success" },
  { value: "RECHAZADA", label: "Rechazada", bar: "bg-danger" },
];

export default async function Home() {
  const [total, byContact, byProposal, acceptedAgg] = await Promise.all([
    prisma.prospect.count(),
    prisma.prospect.groupBy({ by: ["contactStatus"], _count: true }),
    prisma.prospect.groupBy({ by: ["proposalStatus"], _count: true }),
    prisma.prospect.aggregate({ _sum: { proposalValue: true }, where: { proposalStatus: "ACEPTADA" } }),
  ]);

  const contactCounts: Record<string, number> = {};
  for (const g of byContact) contactCounts[g.contactStatus] = g._count;
  const proposalCounts: Record<string, number> = {};
  for (const g of byProposal) proposalCounts[g.proposalStatus] = g._count;

  const acceptedValue = acceptedAgg._sum.proposalValue ?? 0;
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <header>
          <h1 className="text-headline-lg text-on-surface">Panel de prospección</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Encuentra negocios sin sitio web y conviértelos en clientes.
          </p>
        </header>

        {/* Pipeline de contacto */}
        <section className="mt-8 rounded-lg border border-line bg-surface-container-lowest p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-label-md uppercase text-on-surface-variant">Pipeline de contacto</h2>
            <span className="text-body-sm text-on-surface-variant">
              <span className="text-headline-md font-bold text-on-surface">{formatNumber(total)}</span> en total
            </span>
          </div>

          {total === 0 ? (
            <p className="mt-6 text-body-sm text-on-surface-variant">
              Sin prospectos todavía. Empieza buscando un área en el mapa.
            </p>
          ) : (
            <>
              <div className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-surface-container">
                {CONTACT_PIPE.map((s) => {
                  const n = contactCounts[s.value] ?? 0;
                  if (n === 0) return null;
                  return <div key={s.value} className={s.bar} style={{ width: `${pct(n)}%` }} title={`${s.label}: ${n}`} />;
                })}
              </div>
              <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
                {CONTACT_PIPE.map((s) => {
                  const n = contactCounts[s.value] ?? 0;
                  return (
                    <li key={s.value}>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                        <span className="text-label-md text-on-surface-variant">{s.label}</span>
                      </div>
                      <div className="mt-1 text-headline-md font-bold tabular-nums text-on-surface">
                        {formatNumber(n)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        {/* Calendario de actividades */}
        <section className="mt-6">
          <DashboardCalendar />
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Propuestas */}
          <section className="rounded-lg border border-line bg-surface-container-lowest p-6 lg:col-span-2">
            <h2 className="text-label-md uppercase text-on-surface-variant">Propuestas</h2>
            <div className="mt-4 space-y-3">
              {PROPOSAL_PIPE.map((s) => {
                const n = proposalCounts[s.value] ?? 0;
                return (
                  <div key={s.value} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-body-sm text-on-surface-variant">{s.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container">
                      <div className={`h-full ${s.bar}`} style={{ width: `${pct(n)}%` }} />
                    </div>
                    <span className="w-8 shrink-0 text-right text-body-sm font-semibold tabular-nums text-on-surface">
                      {formatNumber(n)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex items-baseline gap-2 border-t border-line pt-4">
              <span className="text-body-sm text-on-surface-variant">Valor de propuestas aceptadas</span>
              <span className="ml-auto text-headline-md font-bold tabular-nums text-success">
                {formatNumber(acceptedValue)}
              </span>
            </div>
          </section>

          {/* Acciones */}
          <section className="rounded-lg border border-line bg-surface-container-lowest p-6">
            <h2 className="text-label-md uppercase text-on-surface-variant">Acciones</h2>
            <div className="mt-4 space-y-3">
              <Link
                href="/map"
                className="group flex items-center gap-3 rounded-md border border-line bg-surface-container-lowest p-3 transition-colors hover:bg-surface-subtle"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary-fixed text-primary-on-fixed">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.5 3.5 4.8v12.7L9 19.2m0-12.7 6 1.7m-6-1.7v12.7m6-11 5.5-1.7v12.7L15 17.5m0-11v11" />
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className="block text-label-lg text-on-surface">Buscar en el mapa</span>
                  <span className="block text-label-md text-on-surface-variant">Negocios sin sitio web</span>
                </span>
                <span className="ml-auto text-on-surface-variant transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
              <Link
                href="/crm"
                className="group flex items-center gap-3 rounded-md border border-line bg-surface-container-lowest p-3 transition-colors hover:bg-surface-subtle"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary-fixed text-primary-on-fixed">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6.5h16M4 12h16M4 17.5h16" />
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className="block text-label-lg text-on-surface">Gestionar prospectos</span>
                  <span className="block text-label-md text-on-surface-variant">Seguimiento en el CRM</span>
                </span>
                <span className="ml-auto text-on-surface-variant transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
