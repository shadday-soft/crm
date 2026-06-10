"use client";

import { useEffect, useMemo, useState } from "react";
import type { Task, TaskType } from "@/lib/types";
import { TASK_PRIORITY, TASK_STATUS, TASK_RECURRENCE, findOption } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { toast } from "@/lib/toast";
import StatusBadge from "./StatusBadge";
import TaskFormModal from "./TaskFormModal";
import TaskTypeManager from "./TaskTypeManager";

export default function TasksPanel({ clientId }: { clientId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [types, setTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [showTypes, setShowTypes] = useState(false);

  async function loadTasks() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?clientId=${clientId}`, { cache: "no-store" });
      const data = await res.json();
      setTasks(data.tasks ?? []);
    } finally {
      setLoading(false);
    }
  }
  async function loadTypes() {
    const res = await fetch("/api/task-types", { cache: "no-store" });
    const data = await res.json();
    setTypes(data.types ?? []);
  }
  useEffect(() => {
    loadTasks();
    loadTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function toggleComplete(task: Task) {
    const status = task.status === "COMPLETADA" ? "PENDIENTE" : "COMPLETADA";
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (res.ok) {
      setTasks((prev) => {
        const replaced = prev.map((t) => (t.id === task.id ? data.task : t));
        return data.nextTask ? [data.nextTask, ...replaced] : replaced;
      });
      toast.success(status === "COMPLETADA" ? "Tarea completada" : "Tarea reabierta");
      if (data.nextTask) toast.info("Próxima ocurrencia creada");
    } else {
      toast.error("No se pudo actualizar la tarea");
    }
  }

  async function deleteTask(id: string) {
    if (!confirm("¿Eliminar esta tarea?")) return;
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success("Tarea eliminada");
    } else {
      toast.error("No se pudo eliminar la tarea");
    }
  }

  function onSavedTask(task: Task) {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === task.id);
      return exists ? prev.map((t) => (t.id === task.id ? task : t)) : [task, ...prev];
    });
    setShowForm(false);
    setEditing(null);
  }

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const sorted = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const ac = a.status === "COMPLETADA" ? 1 : 0;
      const bc = b.status === "COMPLETADA" ? 1 : 0;
      if (ac !== bc) return ac - bc; // pendientes primero
      const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      if (ad !== bd) return ad - bd; // vencimiento más cercano primero
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tasks]);

  const pendingCount = tasks.filter((t) => t.status !== "COMPLETADA").length;

  return (
    <section className="rounded-lg border border-line bg-surface-container-lowest">
      <div className="flex items-center justify-between gap-2 border-b border-line px-5 py-3">
        <span className="text-label-md uppercase text-on-surface-variant">
          {pendingCount} pendiente(s) · {tasks.length} total
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTypes(true)}
            className="rounded-md px-2.5 py-1.5 text-body-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            Tipos
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-body-sm font-semibold text-on-primary transition-colors hover:bg-primary-container"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            Nueva tarea
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 p-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-12 w-full" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <p className="p-8 text-center text-body-sm text-on-surface-variant">
          Sin tareas todavía. Crea la primera para dar seguimiento.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {sorted.map((t) => {
            const done = t.status === "COMPLETADA";
            const overdue = !done && t.dueDate && new Date(t.dueDate).getTime() < startOfToday;
            return (
              <li key={t.id} className="flex items-start gap-3 px-5 py-3">
                <button
                  onClick={() => toggleComplete(t)}
                  aria-label={done ? "Marcar pendiente" : "Marcar completada"}
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${
                    done
                      ? "border-success bg-success text-white"
                      : "border-outline-variant text-transparent hover:border-primary"
                  }`}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                  </svg>
                </button>

                <div className="min-w-0 flex-1">
                  <div className={`font-medium ${done ? "text-on-surface-variant line-through" : "text-on-surface"}`}>
                    {t.title}
                  </div>
                  {t.description && (
                    <p className="mt-0.5 line-clamp-2 text-body-sm text-on-surface-variant">{t.description}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {t.type && (
                      <span
                        className="rounded-full px-2 py-0.5 text-label-md font-medium"
                        style={{ backgroundColor: `${t.type.color}1A`, color: t.type.color }}
                      >
                        {t.type.name}
                      </span>
                    )}
                    <StatusBadge option={findOption(TASK_PRIORITY, t.priority)} />
                    {t.status !== "COMPLETADA" && t.status !== "PENDIENTE" && (
                      <StatusBadge option={findOption(TASK_STATUS, t.status)} />
                    )}
                    {t.dueDate && (
                      <span className={`text-label-md ${overdue ? "font-semibold text-danger" : "text-on-surface-variant"}`}>
                        {overdue ? "Venció " : "Vence "}
                        {formatDate(t.dueDate)}
                      </span>
                    )}
                    {t.recurrence !== "NONE" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-highest px-2 py-0.5 text-label-md text-on-surface-variant">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5v5h5M20 19v-5h-5" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 14a7 7 0 0 0 12.9 2.5M19 10A7 7 0 0 0 6.1 7.5" />
                        </svg>
                        {TASK_RECURRENCE.find((o) => o.value === t.recurrence)?.label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => {
                      setEditing(t);
                      setShowForm(true);
                    }}
                    className="rounded-md p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                    aria-label="Editar"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3M13.5 6.5l3 3" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteTask(t.id)}
                    className="rounded-md p-1.5 text-on-surface-variant transition-colors hover:bg-danger/10 hover:text-danger"
                    aria-label="Eliminar"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5h6v2M10 11v6M14 11v6M7 7l1 12h8l1-12" />
                    </svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showForm && (
        <TaskFormModal
          task={editing ?? undefined}
          clientId={clientId}
          types={types}
          onSaved={onSavedTask}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
      {showTypes && <TaskTypeManager onClose={() => setShowTypes(false)} onChanged={loadTypes} />}
    </section>
  );
}
