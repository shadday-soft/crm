// Tipos compartidos entre frontend y backend (JSON, fechas como string ISO).
import type { LatLng } from "./geo";

export type Prospect = {
  id: string;
  placeId: string;
  name: string;
  address: string | null;
  phone: string | null;
  rating: number | null;
  userRatingCount: number | null;
  category: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUri: string | null;
  openingHours: string | null; // JSON string (string[])
  zone: string | null;
  contactStatus: string;
  contactChannel: string | null;
  lastContactDate: string | null;
  notes: string | null;
  proposalStatus: string;
  proposalValue: number | null;
  proposalSentDate: string | null;
  clientId: string | null; // si ya se convirtió en cliente
  createdAt: string;
  updatedAt: string;
};

export type TaskType = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  recurrence: string;
  dueDate: string | null;
  completedAt: string | null;
  typeId: string | null;
  type: { id: string; name: string; color: string } | null;
  clientId: string | null;
  client: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type FinanceEntry = {
  id: string;
  kind: string; // COBRO | POR_PAGAR | GASTO
  status: string; // PENDIENTE | PAGADO
  amount: number;
  concept: string | null;
  date: string;
  dueDate: string | null;
  paidDate: string | null;
  clientId: string;
  createdAt: string;
  updatedAt: string;
};

export type Client = {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxId: string | null;
  category: string | null;
  zone: string | null;
  notes: string | null;
  rating: number | null;
  googleMapsUri: string | null;
  status: string;
  prospectId: string | null;
  createdAt: string;
  updatedAt: string;
};

// Un negocio encontrado en el mapa, candidato a importar (aún no guardado).
export type SearchCandidate = {
  placeId: string;
  name: string;
  address?: string;
  phone?: string;
  rating?: number;
  userRatingCount?: number;
  category?: string;
  location: LatLng;
  googleMapsUri?: string;
  openingHours?: string[];
  zone?: string;
  alreadyImported: boolean; // ya existe en la BD
};

export type SearchStats = {
  found: number; // total que devolvió Google
  insidePolygon: number; // cuántos cayeron dentro del polígono real
  withoutWebsite: number; // de esos, cuántos sin website
  apiCalls: number; // llamadas facturables de esta búsqueda
  radiusMeters: number;
  center: LatLng;
};

export type SearchResponse = {
  candidates: SearchCandidate[];
  stats: SearchStats;
};
