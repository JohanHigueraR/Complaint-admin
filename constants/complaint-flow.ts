import type { ComplaintStatus } from "@/types/complaint";

export interface StatusAction {
  label: string;
  targetStatus: ComplaintStatus;
  requiresConfirmation: boolean;
  tone: "primary" | "danger";
}

export const statusTransitions: Record<ComplaintStatus, ComplaintStatus[]> = {
  recibido: ["investigando"],
  investigando: ["manejando"],
  manejando: ["aprobado", "rechazado"],
  aprobado: ["completado"],
  rechazado: ["completado"],
  completado: [],
};

const actions: Record<ComplaintStatus, StatusAction[]> = {
  recibido: [{ label: "Iniciar investigación", targetStatus: "investigando", requiresConfirmation: false, tone: "primary" }],
  investigando: [{ label: "Iniciar manejo", targetStatus: "manejando", requiresConfirmation: false, tone: "primary" }],
  manejando: [{ label: "Aprobar", targetStatus: "aprobado", requiresConfirmation: true, tone: "primary" }, { label: "Rechazar", targetStatus: "rechazado", requiresConfirmation: true, tone: "danger" }],
  aprobado: [{ label: "Completar", targetStatus: "completado", requiresConfirmation: true, tone: "primary" }],
  rechazado: [{ label: "Completar", targetStatus: "completado", requiresConfirmation: true, tone: "primary" }],
  completado: [],
};

const descriptions: Record<ComplaintStatus, string> = {
  recibido: "El caso fue recibido y está pendiente de iniciar la investigación.",
  investigando: "El caso está siendo investigado para determinar cómo proceder.",
  manejando: "La investigación está completa y el caso está listo para ser gestionado.",
  aprobado: "La queja fue aprobada y está pendiente de completar.",
  rechazado: "La queja fue rechazada y está pendiente de completar.",
  completado: "El proceso de gestión de esta queja ha finalizado.",
};

export function getAvailableActions(status: ComplaintStatus) { return actions[status]; }
export function getNextStatuses(status: ComplaintStatus) { return statusTransitions[status]; }
export function canTransition(from: ComplaintStatus, to: ComplaintStatus) { return statusTransitions[from].includes(to); }
export function getStatusDescription(status: ComplaintStatus) { return descriptions[status]; }
