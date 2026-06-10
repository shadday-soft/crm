// Helpers de formato (cliente y servidor).

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** ISO -> "YYYY-MM-DD" para <input type="date">. */
export function toDateInputValue(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function formatNumber(n?: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-ES").format(n);
}
