// Valores controlados para los campos tipo "enum" (SQLite no tiene enums).
// Cada uno trae su etiqueta en español y un color para el badge.

export type StatusOption = {
  value: string;
  label: string;
  /** clases tailwind para el badge */
  badge: string;
};

// --- Estado de contacto --- (chips: fondo de color a baja opacidad + texto contrastado)
export const CONTACT_STATUS: StatusOption[] = [
  { value: "SIN_CONTACTAR", label: "Sin contactar", badge: "bg-surface-container-highest text-on-surface-variant" },
  { value: "CONTACTADO", label: "Contactado", badge: "bg-primary/10 text-primary" },
  { value: "EN_NEGOCIACION", label: "En negociación", badge: "bg-warning/20 text-tertiary" },
  { value: "CERRADO", label: "Cerrado", badge: "bg-success/20 text-success" },
  { value: "DESCARTADO", label: "Descartado", badge: "bg-danger/10 text-danger" },
];

// --- Estado de propuesta ---
export const PROPOSAL_STATUS: StatusOption[] = [
  { value: "SIN_ENVIAR", label: "Sin enviar", badge: "bg-surface-container-highest text-on-surface-variant" },
  { value: "ENVIADA", label: "Enviada", badge: "bg-primary/10 text-primary" },
  { value: "VISTA", label: "Vista", badge: "bg-tertiary/10 text-tertiary" },
  { value: "ACEPTADA", label: "Aceptada", badge: "bg-success/20 text-success" },
  { value: "RECHAZADA", label: "Rechazada", badge: "bg-danger/10 text-danger" },
];

// --- Canal de contacto ---
export const CONTACT_CHANNEL: StatusOption[] = [
  { value: "LLAMADA", label: "Llamada", badge: "bg-primary/10 text-primary" },
  { value: "WHATSAPP", label: "WhatsApp", badge: "bg-success/20 text-success" },
  { value: "EMAIL", label: "Email", badge: "bg-tertiary/10 text-tertiary" },
];

// --- Estado del cliente ---
export const CLIENT_STATUS: StatusOption[] = [
  { value: "ACTIVO", label: "Activo", badge: "bg-success/20 text-success" },
  { value: "PAUSADO", label: "Pausado", badge: "bg-warning/20 text-tertiary" },
  { value: "INACTIVO", label: "Inactivo", badge: "bg-surface-container-highest text-on-surface-variant" },
];

// --- Prioridad de tarea ---
export const TASK_PRIORITY: StatusOption[] = [
  { value: "ALTA", label: "Alta", badge: "bg-danger/10 text-danger" },
  { value: "MEDIA", label: "Media", badge: "bg-warning/20 text-tertiary" },
  { value: "BAJA", label: "Baja", badge: "bg-primary/10 text-primary" },
];

// --- Estado de tarea ---
export const TASK_STATUS: StatusOption[] = [
  { value: "PENDIENTE", label: "Pendiente", badge: "bg-surface-container-highest text-on-surface-variant" },
  { value: "EN_PROGRESO", label: "En progreso", badge: "bg-primary/10 text-primary" },
  { value: "COMPLETADA", label: "Completada", badge: "bg-success/20 text-success" },
];

// --- Recurrencia de tarea ---
export const TASK_RECURRENCE: { value: string; label: string }[] = [
  { value: "NONE", label: "No se repite" },
  { value: "DAILY", label: "Diaria" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "BIWEEKLY", label: "Quincenal" },
  { value: "MONTHLY", label: "Mensual" },
];

// Paleta sugerida para los tipos de tarea (color del chip).
export const TASK_TYPE_COLORS = [
  "#1a73e8", "#1E8E3E", "#F9AB00", "#D93025",
  "#9334e6", "#e8710a", "#129eaf", "#727785",
];

// --- Cartera: tipo de movimiento ---
export const FINANCE_KIND: StatusOption[] = [
  { value: "COBRO", label: "Por cobrar", badge: "bg-primary/10 text-primary" },
  { value: "POR_PAGAR", label: "Por pagar", badge: "bg-tertiary/10 text-tertiary" },
  { value: "GASTO", label: "Gasto", badge: "bg-danger/10 text-danger" },
];

// --- Cartera: estado del movimiento ---
export const FINANCE_STATUS: StatusOption[] = [
  { value: "PENDIENTE", label: "Pendiente", badge: "bg-warning/20 text-tertiary" },
  { value: "PAGADO", label: "Pagado", badge: "bg-success/20 text-success" },
];

// --- Cartera: recurrencia de un pago ---
export const FINANCE_RECURRENCE: { value: string; label: string }[] = [
  { value: "NONE", label: "No se repite" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "BIWEEKLY", label: "Quincenal" },
  { value: "MONTHLY", label: "Mensual" },
  { value: "YEARLY", label: "Anual" },
];

/** Etiqueta corta para el chip de recurrencia (sin "No se repite"). */
export function recurrenceLabel(value?: string | null): string | null {
  if (!value || value === "NONE") return null;
  return FINANCE_RECURRENCE.find((o) => o.value === value)?.label ?? null;
}

export function findOption(list: StatusOption[], value?: string | null): StatusOption | undefined {
  if (!value) return undefined;
  return list.find((o) => o.value === value);
}

// --- Categorías de negocio (tipos de Google Places API "New", tabla A) ---
// value = includedType que se manda a Google; label = etiqueta en español.
export type Category = { value: string; label: string };

export const BUSINESS_CATEGORIES: Category[] = [
  { value: "restaurant", label: "Restaurantes" },
  { value: "cafe", label: "Cafeterías" },
  { value: "bar", label: "Bares" },
  { value: "bakery", label: "Panaderías" },
  { value: "store", label: "Tiendas (general)" },
  { value: "clothing_store", label: "Tiendas de ropa" },
  { value: "shoe_store", label: "Zapaterías" },
  { value: "jewelry_store", label: "Joyerías" },
  { value: "furniture_store", label: "Mueblerías" },
  { value: "hardware_store", label: "Ferreterías" },
  { value: "supermarket", label: "Supermercados" },
  { value: "convenience_store", label: "Tiendas de conveniencia" },
  { value: "beauty_salon", label: "Salones de belleza" },
  { value: "hair_salon", label: "Peluquerías" },
  { value: "spa", label: "Spas" },
  { value: "gym", label: "Gimnasios" },
  { value: "dental_clinic", label: "Clínicas dentales" },
  { value: "doctor", label: "Consultorios médicos" },
  { value: "pharmacy", label: "Farmacias" },
  { value: "veterinary_care", label: "Veterinarias" },
  { value: "car_repair", label: "Talleres mecánicos" },
  { value: "car_dealer", label: "Concesionarios" },
  { value: "real_estate_agency", label: "Inmobiliarias" },
  { value: "lawyer", label: "Abogados / Bufetes" },
  { value: "accounting", label: "Contadores" },
  { value: "insurance_agency", label: "Agencias de seguros" },
  { value: "travel_agency", label: "Agencias de viajes" },
  { value: "school", label: "Escuelas / Academias" },
  { value: "lodging", label: "Hoteles / Hospedaje" },
];

/** Convierte un tipo de Google (snake_case) a una etiqueta legible. */
export function prettifyType(type?: string | null): string {
  if (!type) return "—";
  const known = BUSINESS_CATEGORIES.find((c) => c.value === type);
  if (known) return known.label;
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
