"use client";

import { useMemo, useState } from "react";
import type { Task } from "@/lib/types";
import { TASK_PRIORITY, findOption } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { toast } from "@/lib/toast";
import { useTasks } from "./TasksProvider";

export default function UpcomingTasks() {
  const { tasks, loading, upsert, remove } = useTasks();
  const [busy, setBusy] = useState<string | null>(null);

  // Próximas 5 tareas pendientes con vencimiento, ordenadas por fecha.
  const items = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== "COMPLETADA" && t.dueDate)
        .sort((a, b) => new Date(a.dueDate as string).getTime() - new Date(b.dueDate as string).getTime())
        .slice(0, 5),
    [tasks]
  );

  async function complete(task: Task) {
    if (busy) return;
    setBusy(task.id);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETADA" }),
      });
      const data = await res.json();
      if (res.ok) {
        // Sincroniza el estado compartido: la tarea pasa a COMPLETADA (sale de
        // esta lista y se ve tachada en el calendario) y, si es recurrente,
        // aparece la siguiente ocurrencia.
        if (data.task) upsert(data.task);
        else remove(task.id);
        if (data.nextTask) {
          upsert(data.nextTask);
          toast.info("Próxima ocurrencia creada");
        }
        toast.success("Tarea completada");
      } else {
        toast.error("No se pudo completar la tarea");
      }
    } catch {
      toast.error("No se pudo completar la tarea");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-[72px] w-full rounded-3xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-6 text-center text-sm text-[#6f827b] shadow-[0_1px_2px_rgba(31,74,68,0.06)]">
        No tienes tareas con vencimiento próximo.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((t) => {
        const prio = findOption(TASK_PRIORITY, t.priority);
        const dot = t.type?.color ?? "#2f6f63";
        const isBusy = busy === t.id;
        return (
          <li
            key={t.id}
            className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-[0_1px_2px_rgba(31,74,68,0.06)]"
          >
            <button
              onClick={() => complete(t)}
              disabled={isBusy}
              aria-label="Marcar completada"
              title="Marcar completada"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border-2 border-[#cfe0d9] text-transparent transition-colors hover:border-[#2f6f63] hover:bg-[#e2efe9] hover:text-[#2f6f63] disabled:opacity-50"
            >
              {isBusy ? (
                <svg className="h-4 w-4 animate-spin text-[#2f6f63]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                </svg>
              )}
            </button>

            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl"
              style={{ backgroundColor: `${dot}1f` }}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dot }} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-[#21322f]">{t.title}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#6f827b]">
                {t.dueDate && <span>{formatDate(t.dueDate)}</span>}
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
  );
}
