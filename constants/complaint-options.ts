import type { ComplaintStatus } from "@/types/complaint";

export const pendingStatuses: ComplaintStatus[] = ["recibido", "investigando", "escalado_merchant", "manejando"];
export const completedStatuses: ComplaintStatus[] = ["aprobado", "rechazado", "completado"];

export const complaintTypes = [
  "Transacción no reconocida",
  "Cobro duplicado",
  "Cobro no autorizado",
  "Producto no entregado",
  "Servicio no conforme",
  "Reverso pendiente",
] as const;

export const dateFilterOptions = [
  { value: "all", label: "Cualquier fecha" },
  { value: "today", label: "Hoy" },
  { value: "7d", label: "Últimos 7 días" },
  { value: "30d", label: "Últimos 30 días" },
  { value: "custom", label: "Personalizado" },
] as const;

export const sortOptions = [
  { value: "recent", label: "Más recientes" },
  { value: "oldest", label: "Más antiguas" },
  { value: "priority-high", label: "Mayor prioridad" },
  { value: "priority-low", label: "Menor prioridad" },
] as const;

export type DateFilter = (typeof dateFilterOptions)[number]["value"];
export type SortOption = (typeof sortOptions)[number]["value"];
