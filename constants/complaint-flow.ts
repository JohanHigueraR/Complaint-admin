import type { ComplaintStatus } from "@/types/complaint";

export interface StatusAction {
  label: string;
  targetStatus: ComplaintStatus;
  requiresConfirmation: boolean;
  tone: "primary" | "danger";
  /**
   * "simple": sin datos adicionales, se ejecuta vía `updateComplaintStatus` genérico.
   * "dedicated": requiere datos propios (motivo, nota, respuesta…) y su propia acción del store.
   */
  kind: "simple" | "dedicated";
}

export const statusTransitions: Record<ComplaintStatus, ComplaintStatus[]> = {
  recibido: ["investigando"],
  investigando: ["manejando", "escalado_merchant"],
  escalado_merchant: ["investigando"],
  manejando: ["aprobado", "rechazado"],
  aprobado: ["completado"],
  rechazado: ["completado"],
  completado: [],
};

const actions: Record<ComplaintStatus, StatusAction[]> = {
  recibido: [{ label: "Iniciar investigación", targetStatus: "investigando", requiresConfirmation: false, tone: "primary", kind: "simple" }],
  investigando: [
    { label: "Iniciar manejo", targetStatus: "manejando", requiresConfirmation: false, tone: "primary", kind: "simple" },
    { label: "Enviar al merchant", targetStatus: "escalado_merchant", requiresConfirmation: true, tone: "primary", kind: "dedicated" },
  ],
  escalado_merchant: [{ label: "Cerrar seguimiento (respuesta recibida)", targetStatus: "investigando", requiresConfirmation: true, tone: "primary", kind: "dedicated" }],
  manejando: [{ label: "Aprobar", targetStatus: "aprobado", requiresConfirmation: true, tone: "primary", kind: "dedicated" }, { label: "Rechazar", targetStatus: "rechazado", requiresConfirmation: true, tone: "danger", kind: "dedicated" }],
  aprobado: [{ label: "Completar", targetStatus: "completado", requiresConfirmation: true, tone: "primary", kind: "dedicated" }],
  rechazado: [{ label: "Completar", targetStatus: "completado", requiresConfirmation: true, tone: "primary", kind: "dedicated" }],
  completado: [],
};

const descriptions: Record<ComplaintStatus, string> = {
  recibido: "El caso fue recibido y está pendiente de iniciar la investigación.",
  investigando: "El caso está siendo investigado para determinar cómo proceder.",
  escalado_merchant: "El caso fue enviado al merchant y está en espera de su respuesta.",
  manejando: "La investigación está completa y el caso está listo para ser gestionado.",
  aprobado: "La queja fue aprobada y está pendiente de completar.",
  rechazado: "La queja fue rechazada y está pendiente de completar.",
  completado: "El proceso de gestión de esta queja ha finalizado.",
};

export function getAvailableActions(status: ComplaintStatus) { return actions[status]; }
export function getNextStatuses(status: ComplaintStatus) { return statusTransitions[status]; }
export function canTransition(from: ComplaintStatus, to: ComplaintStatus) { return statusTransitions[from].includes(to); }
export function getStatusDescription(status: ComplaintStatus) { return descriptions[status]; }
/** true si (from → to) se puede ejecutar sin datos adicionales, vía la acción genérica de estado. */
export function isSimpleTransition(from: ComplaintStatus, to: ComplaintStatus) {
  return actions[from].some((action) => action.kind === "simple" && action.targetStatus === to);
}
