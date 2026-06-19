"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

const inputCls =
  "w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError("Correo o contraseña incorrectos.");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("No se pudo iniciar sesión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e7f1ee] p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-[0_8px_30px_rgba(31,74,68,0.12)]">
        <div className="flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1f4a44] text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-5.2-7-11a7 7 0 1 1 14 0c0 5.8-7 11-7 11Z" />
              <circle cx="12" cy="10" r="2.4" />
            </svg>
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#21322f]">Prospecta</h1>
          <p className="mt-1 text-sm text-[#6f827b]">Inicia sesión para continuar.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-label-md uppercase text-on-surface-variant">Correo</label>
            <input
              type="email"
              autoComplete="email"
              required
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-label-md uppercase text-on-surface-variant">Contraseña</label>
            <input
              type="password"
              autoComplete="current-password"
              required
              className={inputCls}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-md bg-danger/10 px-3 py-2 text-body-sm text-danger">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#1f4a44] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#173a35] disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
