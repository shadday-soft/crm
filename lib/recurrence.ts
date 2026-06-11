// Lógica de pagos recurrentes (compartida cliente/servidor).

/** Avanza una fecha al siguiente vencimiento según la recurrencia. */
export function nextDueDate(from: Date, recurrence: string): Date {
  const d = new Date(from);
  switch (recurrence) {
    case "WEEKLY":
      d.setDate(d.getDate() + 7);
      break;
    case "BIWEEKLY":
      d.setDate(d.getDate() + 14);
      break;
    case "MONTHLY": {
      // Conserva el día del mes; si no existe (p. ej. 31), cae al último día.
      const day = d.getDate();
      d.setDate(1);
      d.setMonth(d.getMonth() + 1);
      const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(day, last));
      break;
    }
    case "YEARLY":
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      break; // NONE: no cambia
  }
  return d;
}
