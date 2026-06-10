import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatNumber, formatMoney, formatDate } from "@/lib/format";
import { TASK_PRIORITY, findOption } from "@/lib/constants";
import DashboardCalendar from "@/components/DashboardCalendar";
import DashboardFinance from "@/components/DashboardFinance";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [total, byContact, acceptedAgg, clientCount, upcoming] = await Promise.all([
    prisma.prospect.count(),
    prisma.prospect.groupBy({ by: ["contactStatus"], _count: true }),
    prisma.prospect.aggregate({ _sum: { proposalValue: true }, where: { proposalStatus: "ACEPTADA" } }),
    prisma.client.count(),
    prisma.task.findMany({
      where: { status: { not: "COMPLETADA" }, dueDate: { not: null } },
      include: { type: { select: { name: true, color: true } }, client: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
  ]);

  const cc: Record<string, number> = {};
  for (const g of byContact) cc[g.contactStatus] = g._count;
  const accepted = acceptedAgg._sum.proposalValue ?? 0;
  const sinContactar = cc["SIN_CONTACTAR"] ?? 0;
  const negociacion = cc["EN_NEGOCIACION"] ?? 0;
  const cerrados = cc["CERRADO"] ?? 0;

  const PIPE = [
    { label: "Sin contactar", value: sinContactar, color: "#9fb3ad" },
    { label: "En negociación", value: negociacion, color: "#f2c14e" },
    { label: "Cerrados", value: cerrados, color: "#2f6f63" },
  ];
  const pipeTotal = Math.max(1, sinContactar + negociacion + cerrados);

  return (
    <div className="h-full overflow-y-auto bg-[#e7f1ee]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[#21322f]">Panel principal</h1>
          <p className="mt-0.5 text-[#6f827b]">Tu prospección y agenda de un vistazo.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* ---------------- Columna izquierda ---------------- */}
          <div className="space-y-5">
            {/* Tarjetas de métricas */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {/* Prospectos + sparkline */}
              <div className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(31,74,68,0.06)]">
                <div className="text-sm text-[#6f827b]">Prospectos</div>
                <div className="mt-1 text-3xl font-bold tabular-nums text-[#21322f]">{formatNumber(total)}</div>
                <svg viewBox="0 0 100 32" className="mt-2 h-8 w-full" preserveAspectRatio="none">
                  <polyline
                    points="0,26 16,22 32,24 48,14 64,18 80,8 100,5"
                    fill="none"
                    stroke="#2f6f63"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Clientes (ámbar) */}
              <div className="rounded-3xl bg-[#f2c14e] p-5">
                <div className="text-sm font-medium text-[#7a611a]">Clientes</div>
                <div className="mt-1 text-4xl font-bold tabular-nums text-[#3d3008]">{formatNumber(clientCount)}</div>
              </div>

              {/* Valor aceptado (verde profundo) */}
              <div className="col-span-2 rounded-3xl bg-[#1f4a44] p-5 text-white sm:col-span-1">
                <div className="text-sm text-white/70">Propuestas aceptadas</div>
                <div className="mt-1 text-3xl font-bold tabular-nums">{formatMoney(accepted)}</div>
                <div className="mt-1 text-xs text-white/50">valor total ganado</div>
              </div>
            </div>

            {/* CTA + pipeline */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href="/map"
                className="group flex flex-col justify-between rounded-3xl bg-[#1f4a44] p-5 text-white transition-colors hover:bg-[#173a35]"
              >
                <div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.5 3.5 4.8v12.7L9 19.2m0-12.7 6 1.7m-6-1.7v12.7m6-11 5.5-1.7v12.7L15 17.5m0-11v11" />
                    </svg>
                  </div>
                  <h2 className="mt-4 text-lg font-semibold">Buscar prospectos</h2>
                  <p className="mt-0.5 text-sm text-white/70">Negocios sin sitio web en el mapa.</p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#f2c14e]">
                  Abrir mapa
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </span>
              </Link>

              <div className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(31,74,68,0.06)]">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-[#21322f]">Pipeline</span>
                  <Link href="/crm" className="text-xs font-medium text-[#2f6f63] hover:underline">Ver CRM →</Link>
                </div>
                <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-[#eef4f1]">
                  {PIPE.map((p) =>
                    p.value > 0 ? (
                      <div key={p.label} style={{ width: `${(p.value / pipeTotal) * 100}%`, backgroundColor: p.color }} />
                    ) : null
                  )}
                </div>
                <ul className="mt-3 space-y-1.5">
                  {PIPE.map((p) => (
                    <li key={p.label} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-[#6f827b]">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.label}
                      </span>
                      <span className="font-semibold tabular-nums text-[#21322f]">{formatNumber(p.value)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Próximas tareas */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#21322f]">Próximas tareas</h2>
                <Link href="/clients" className="text-sm font-medium text-[#2f6f63] hover:underline">Clientes →</Link>
              </div>
              {upcoming.length === 0 ? (
                <div className="rounded-3xl bg-white p-6 text-center text-sm text-[#6f827b] shadow-[0_1px_2px_rgba(31,74,68,0.06)]">
                  No tienes tareas con vencimiento próximo.
                </div>
              ) : (
                <ul className="space-y-3">
                  {upcoming.map((t) => {
                    const prio = findOption(TASK_PRIORITY, t.priority);
                    const dot = t.type?.color ?? "#2f6f63";
                    return (
                      <li
                        key={t.id}
                        className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-[0_1px_2px_rgba(31,74,68,0.06)]"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl" style={{ backgroundColor: `${dot}1f` }}>
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dot }} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium text-[#21322f]">{t.title}</div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#6f827b]">
                            {t.dueDate && <span>{formatDate(t.dueDate.toISOString())}</span>}
                            {t.client?.name && <span>· {t.client.name}</span>}
                            {t.type?.name && <span>· {t.type.name}</span>}
                          </div>
                        </div>
                        {prio && (
                          <span
                            className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={
                              t.priority === "ALTA"
                                ? { backgroundColor: "#f8e3da", color: "#b8512f" }
                                : t.priority === "MEDIA"
                                ? { backgroundColor: "#fbf0d3", color: "#8a6a16" }
                                : { backgroundColor: "#e2efe9", color: "#2f6f63" }
                            }
                          >
                            {prio.label}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* ---------------- Columna derecha: calendario ---------------- */}
          <div>
            <DashboardCalendar />
          </div>
        </div>

        {/* Costos y gastos (cartera general) */}
        <section className="mt-6">
          <DashboardFinance />
        </section>
      </div>
    </div>
  );
}
