"use client";

import { useEffect, useMemo, useState } from "react";
import type { Task, TaskType } from "@/lib/types";
import TaskFormModal from "./TaskFormModal";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const PRIORITY_COLOR: Record<string, string> = { ALTA: "#D93025", MEDIA: "#F9AB00", BAJA: "#1a73e8" };

const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

type Cell = { date: Date; key: string; day: number; inMonth: boolean };

function buildMonth(year: number, month: number): Cell[] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // lunes = 0
  const cells: Cell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - lead + i);
    cells.push({ date: d, key: keyOf(d), day: d.getDate(), inMonth: d.getMonth() === month });
  }
  return cells;
}

export default function DashboardCalendar() {
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [types, setTypes] = useState<TaskType[]>([]);
  const [creating, setCreating] = useState<string | null>(null); // dueDate (key) al crear
  const [editing, setEditing] = useState<Task | null>(null);

  useEffect(() => {
    (async () => {
      const [t, c, ty] = await Promise.all([
        fetch("/api/tasks", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/clients", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/task-types", { cache: "no-store" }).then((r) => r.json()),
      ]);
      setTasks(t.tasks ?? []);
      setClients((c.clients ?? []).map((x: { id: string; name: string }) => ({ id: x.id, name: x.name })));
      setTypes(ty.types ?? []);
    })();
  }, []);

  const cells = useMemo(() => buildMonth(cursor.y, cursor.m), [cursor]);
  const todayKey = keyOf(new Date());

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const k = t.dueDate.slice(0, 10);
      const arr = map.get(k);
      if (arr) arr.push(t);
      else map.set(k, [t]);
    }
    return map;
  }, [tasks]);

  const rawMonth = new Date(cursor.y, cursor.m, 1).toLocaleDateString("es", {
    month: "long",
    year: "numeric",
  });
  const monthLabel = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1);

  function shift(delta: number) {
    setCursor(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  function upsertTask(task: Task) {
    setTasks((prev) => {
      const i = prev.findIndex((t) => t.id === task.id);
      if (i === -1) return [task, ...prev];
      const copy = [...prev];
      copy[i] = task;
      return copy;
    });
    setCreating(null);
    setEditing(null);
  }

  function removeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setEditing(null);
  }

  return (
    <section className="rounded-lg border border-line bg-surface-container-lowest">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-headline-md text-on-surface">{monthLabel}</h2>
          <div className="flex items-center">
            <button
              onClick={() => shift(-1)}
              className="grid h-8 w-8 place-items-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              aria-label="Mes anterior"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 18 9 12l6-6" />
              </svg>
            </button>
            <button
              onClick={() => shift(1)}
              className="grid h-8 w-8 place-items-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              aria-label="Mes siguiente"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => setCursor({ y: now.getFullYear(), m: now.getMonth() })}
            className="rounded-md px-2.5 py-1.5 text-body-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            Hoy
          </button>
        </div>
        <button
          onClick={() => setCreating(todayKey)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-body-sm font-semibold text-on-primary transition-colors hover:bg-primary-container"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          Nueva actividad
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 border-b border-line">
        {WEEKDAYS.map((w) => (
          <div key={w} className="px-2 py-1.5 text-center text-label-md uppercase text-on-surface-variant">
            {w}
          </div>
        ))}
      </div>

      {/* Cuadrícula */}
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const dayTasks = byDay.get(cell.key) ?? [];
          const isToday = cell.key === todayKey;
          return (
            <div
              key={cell.key + i}
              role="button"
              tabIndex={0}
              onClick={() => setCreating(cell.key)}
              className={`flex min-h-[96px] cursor-pointer flex-col gap-1 border-b border-r border-line p-1.5 text-left transition-colors hover:bg-surface-subtle ${
                (i + 1) % 7 === 0 ? "border-r-0" : ""
              } ${cell.inMonth ? "" : "bg-surface-container-low/50"}`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-label-md ${
                  isToday
                    ? "bg-primary font-semibold text-on-primary"
                    : cell.inMonth
                    ? "text-on-surface"
                    : "text-on-surface-variant/50"
                }`}
              >
                {cell.day}
              </span>

              <div className="flex flex-col gap-0.5 overflow-hidden">
                {dayTasks.slice(0, 3).map((t) => {
                  const done = t.status === "COMPLETADA";
                  const dot = t.type?.color ?? PRIORITY_COLOR[t.priority] ?? "#727785";
                  return (
                    <span
                      key={t.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(t);
                      }}
                      title={`${t.title}${t.client ? " · " + t.client.name : ""}`}
                      className={`flex items-center gap-1 rounded bg-surface-container-high px-1.5 py-0.5 text-label-md transition-colors hover:bg-surface-container-highest ${
                        done ? "opacity-60" : ""
                      }`}
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dot }} />
                      <span className={`truncate ${done ? "text-on-surface-variant line-through" : "text-on-surface"}`}>
                        {t.title}
                      </span>
                    </span>
                  );
                })}
                {dayTasks.length > 3 && (
                  <span className="px-1 text-label-md text-on-surface-variant">+{dayTasks.length - 3} más</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(creating !== null || editing) && (
        <TaskFormModal
          task={editing ?? undefined}
          defaultDueDate={creating ?? undefined}
          clientId={null}
          clients={clients}
          types={types}
          onSaved={upsertTask}
          onDeleted={removeTask}
          onClose={() => {
            setCreating(null);
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}
