"use client";

import { useEffect, useMemo, useState } from "react";
import type { Task, TaskType } from "@/lib/types";
import TaskFormModal from "./TaskFormModal";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

type Cell = { date: Date; key: string; day: number; inMonth: boolean };

function buildMonth(year: number, month: number): Cell[] {
  const first = new Date(year, month, 1);
  const lead = first.getDay(); // domingo = 0
  const cells: Cell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - lead + i);
    cells.push({ date: d, key: keyOf(d), day: d.getDate(), inMonth: d.getMonth() === month });
  }
  return cells;
}

// Color por prioridad (para puntos y tintes de la agenda).
const priDot = (p: string) => (p === "ALTA" ? "#e0785b" : p === "MEDIA" ? "#f2c14e" : "#2f6f63");
const priTint = (p: string) => (p === "ALTA" ? "#f8e3da" : p === "MEDIA" ? "#fbf0d3" : "#e2efe9");

export default function DashboardCalendar() {
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState(keyOf(now));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [types, setTypes] = useState<TaskType[]>([]);
  const [creating, setCreating] = useState(false);
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

  const monthLabel = (() => {
    const raw = new Date(cursor.y, cursor.m, 1).toLocaleDateString("es", { month: "long", year: "numeric" });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  })();

  const selectedTasks = byDay.get(selected) ?? [];
  const selectedDate = new Date(selected + "T00:00:00");
  const selectedLabel = selectedDate.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });

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
    setCreating(false);
    setEditing(null);
  }
  function removeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setEditing(null);
  }

  return (
    <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(31,74,68,0.06)]">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#21322f]">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => shift(-1)}
            className="grid h-8 w-8 place-items-center rounded-full text-[#6f827b] transition-colors hover:bg-[#eef4f1]"
            aria-label="Mes anterior"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18 9 12l6-6" />
            </svg>
          </button>
          <button
            onClick={() => {
              setCursor({ y: now.getFullYear(), m: now.getMonth() });
              setSelected(todayKey);
            }}
            className="rounded-full px-2.5 py-1 text-xs font-medium text-[#2f6f63] transition-colors hover:bg-[#eef4f1]"
          >
            Hoy
          </button>
          <button
            onClick={() => shift(1)}
            className="grid h-8 w-8 place-items-center rounded-full text-[#6f827b] transition-colors hover:bg-[#eef4f1]"
            aria-label="Mes siguiente"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="mt-4 grid grid-cols-7">
        {WEEKDAYS.map((w) => (
          <div key={w} className="pb-2 text-center text-xs font-medium text-[#9fb3ad]">{w}</div>
        ))}
      </div>

      {/* Cuadrícula de fechas */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((cell, i) => {
          const dayTasks = byDay.get(cell.key) ?? [];
          const isToday = cell.key === todayKey;
          const isSel = cell.key === selected;
          const hasAlta = dayTasks.some((t) => t.priority === "ALTA");
          const hasMedia = dayTasks.some((t) => t.priority === "MEDIA");
          const dotColor = dayTasks.length ? (hasAlta ? "#e0785b" : hasMedia ? "#f2c14e" : "#2f6f63") : null;
          return (
            <button
              key={cell.key + i}
              onClick={() => setSelected(cell.key)}
              className="relative grid place-items-center py-0.5"
              aria-label={cell.key}
            >
              <span
                className={`grid h-9 w-9 place-items-center rounded-full text-sm transition-colors ${
                  isSel
                    ? "bg-[#1f4a44] font-semibold text-white"
                    : isToday
                    ? "font-semibold text-[#1f4a44] ring-1 ring-[#1f4a44]"
                    : cell.inMonth
                    ? "text-[#21322f] hover:bg-[#eef4f1]"
                    : "text-[#bcccc6]"
                }`}
              >
                {cell.day}
              </span>
              {dotColor && !isSel && (
                <span className="absolute bottom-0 h-1 w-1 rounded-full" style={{ backgroundColor: dotColor }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Agenda del día */}
      <div className="mt-5 border-t border-[#e7eeeb] pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold capitalize text-[#21322f]">{selectedLabel}</span>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1 rounded-full bg-[#1f4a44] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#173a35]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            Actividad
          </button>
        </div>

        <div className="mt-3 max-h-[300px] space-y-2.5 overflow-y-auto">
          {selectedTasks.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#9fb3ad]">Sin actividades este día.</p>
          ) : (
            selectedTasks.map((t) => {
              const done = t.status === "COMPLETADA";
              const accent = t.type?.color ?? priDot(t.priority);
              return (
                <button
                  key={t.id}
                  onClick={() => setEditing(t)}
                  className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-opacity hover:opacity-90"
                  style={{ backgroundColor: priTint(t.priority) }}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/70">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-sm font-semibold ${done ? "text-[#6f827b] line-through" : "text-[#21322f]"}`}>
                      {t.title}
                    </div>
                    <div className="truncate text-xs text-[#6f827b]">
                      {t.client?.name ? t.client.name : "General"}
                      {t.type?.name ? ` · ${t.type.name}` : ""}
                    </div>
                  </div>
                  {done && (
                    <svg className="h-4 w-4 shrink-0 text-[#2f6f63]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {(creating || editing) && (
        <TaskFormModal
          task={editing ?? undefined}
          defaultDueDate={creating ? selected : undefined}
          clientId={null}
          clients={clients}
          types={types}
          onSaved={upsertTask}
          onDeleted={removeTask}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}
