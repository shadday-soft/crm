"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Task, TaskType } from "@/lib/types";

// Estado de tareas compartido por el dashboard (calendario + próximas tareas),
// para que crear, editar o completar una actividad se refleje al instante en todos los paneles.
type TasksContextValue = {
  tasks: Task[];
  clients: { id: string; name: string }[];
  types: TaskType[];
  loading: boolean;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  upsert: (task: Task) => void;
  remove: (id: string) => void;
  reload: () => Promise<void>;
};

const TasksContext = createContext<TasksContextValue | null>(null);

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks debe usarse dentro de <TasksProvider>");
  return ctx;
}

export default function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [types, setTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [t, c, ty] = await Promise.all([
        fetch("/api/tasks", { cache: "no-store" }).then((r) => (r.ok ? r.json() : { tasks: [] })),
        fetch("/api/clients", { cache: "no-store" }).then((r) => (r.ok ? r.json() : { clients: [] })),
        fetch("/api/task-types", { cache: "no-store" }).then((r) => (r.ok ? r.json() : { types: [] })),
      ]);
      setTasks(t.tasks ?? []);
      setClients((c.clients ?? []).map((x: { id: string; name: string }) => ({ id: x.id, name: x.name })));
      setTypes(ty.types ?? []);
    } catch {
      setTasks([]);
      setClients([]);
      setTypes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const upsert = useCallback((task: Task) => {
    setTasks((prev) => {
      const i = prev.findIndex((t) => t.id === task.id);
      if (i === -1) return [task, ...prev];
      const copy = [...prev];
      copy[i] = task;
      return copy;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <TasksContext.Provider value={{ tasks, clients, types, loading, setTasks, upsert, remove, reload }}>
      {children}
    </TasksContext.Provider>
  );
}
