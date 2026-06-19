"use client";

import { useEffect, useState } from "react";
import type { AppUser } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { toast } from "@/lib/toast";

const inputCls =
  "w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelCls = "mb-1 block text-label-md uppercase text-on-surface-variant";

export default function UserManager({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      const data = res.ok ? await res.json() : { users: [] };
      setUsers(data.users ?? []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  function upsert(user: AppUser) {
    setUsers((prev) => {
      const i = prev.findIndex((u) => u.id === user.id);
      if (i === -1) return [...prev, user];
      const copy = [...prev];
      copy[i] = user;
      return copy;
    });
    setShowForm(false);
    setEditing(null);
  }

  async function remove(user: AppUser) {
    if (!confirm(`¿Eliminar a ${user.name || user.email}?`)) return;
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast.success("Usuario eliminado");
    } else {
      toast.error("No se pudo eliminar", { description: data?.error });
    }
  }

  return (
    <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(31,74,68,0.06)]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#21322f]">Cuentas con acceso</h2>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#1f4a44] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#173a35]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          Añadir usuario
        </button>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="skeleton h-14 w-full" />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-[#e7eeeb]">
            {users.map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-on-primary">
                  {(u.name || u.email).charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-[#21322f]">{u.name || "Sin nombre"}</span>
                    {u.role === "ADMIN" && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-label-md font-medium text-primary">
                        Administrador
                      </span>
                    )}
                    {u.id === currentUserId && (
                      <span className="rounded-full bg-[#e2efe9] px-2 py-0.5 text-label-md font-medium text-[#2f6f63]">Tú</span>
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-[#6f827b]">
                    {u.email} · desde {formatDate(u.createdAt)}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditing(u);
                    setShowForm(true);
                  }}
                  className="shrink-0 rounded-full p-1.5 text-[#6f827b] transition-colors hover:bg-[#f1f7f4] hover:text-[#21322f]"
                  aria-label="Editar"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3M13.5 6.5l3 3" />
                  </svg>
                </button>
                {u.id !== currentUserId && (
                  <button
                    onClick={() => remove(u)}
                    className="shrink-0 rounded-full p-1.5 text-[#6f827b] transition-colors hover:bg-danger/10 hover:text-danger"
                    aria-label="Eliminar"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-7 0 .7 12a1 1 0 0 0 1 1h4.6a1 1 0 0 0 1-1L17 7" />
                    </svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {showForm && (
        <UserFormModal user={editing ?? undefined} onSaved={upsert} onClose={() => { setShowForm(false); setEditing(null); }} />
      )}
    </section>
  );
}

function UserFormModal({
  user,
  onSaved,
  onClose,
}: {
  user?: AppUser;
  onSaved: (u: AppUser) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(user?.role ?? "USER");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { name, role };
      if (!user) {
        payload.email = email;
        payload.password = password;
      } else if (password) {
        payload.password = password; // opcional al editar (restablecer)
      }
      const res = await fetch(user ? `/api/users/${user.id}` : "/api/users", {
        method: user ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "No se pudo guardar.");
        return;
      }
      toast.success(user ? "Usuario actualizado" : "Usuario creado");
      onSaved(data.user);
    } catch {
      setError("Error de red al guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[2100] flex animate-fade-in items-center justify-center bg-on-surface/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-surface-container-lowest shadow-e3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between bg-surface-subtle px-5 py-4">
          <h2 className="text-headline-md text-on-surface">{user ? "Editar usuario" : "Nuevo usuario"}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface" aria-label="Cerrar">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className={labelCls}>Nombre</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellido" />
          </div>
          <div>
            <label className={labelCls}>Correo</label>
            <input
              type="email"
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@correo.com"
              disabled={!!user}
              required={!user}
            />
            {user && <p className="mt-1 text-label-md text-on-surface-variant">El correo no se puede cambiar.</p>}
          </div>
          <div>
            <label className={labelCls}>{user ? "Nueva contraseña (opcional)" : "Contraseña"}</label>
            <input
              type="password"
              className={inputCls}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={user ? "Dejar en blanco para no cambiar" : "Mínimo 6 caracteres"}
              required={!user}
              minLength={6}
            />
          </div>
          <div>
            <label className={labelCls}>Rol</label>
            <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="USER">Usuario</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          {error && <div className="rounded-md bg-error-container px-3 py-2 text-body-sm text-error-on">{error}</div>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-body-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-on-primary shadow-e2 transition-colors hover:bg-primary-container disabled:opacity-60">
              {saving ? "Guardando…" : user ? "Guardar" : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
