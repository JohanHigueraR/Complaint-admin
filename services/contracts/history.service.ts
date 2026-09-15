import type { ComplaintHistoryEvent } from "@/types/complaint";

/** SERVICE: Historial/timeline.
 * Quien lo usa: /quejas/[id], complaint-timeline.
 * Aclaracion de diseño:
 * - Si se considera que el historial es parte de la queja cargada en detalle, puede no ser necesario un servicio separado:
 *   obtener mediante getComplaintById y agregar mediante una accion sobre la queja.
 * - Si se prefiere acoplamiento bajo demanda (ej. volumen grande de eventos), este servicio se usa.
 * 
 * Estado actual: la UI agrega eventos en memoria y el mock los genera automaticamente.
 * Este contrato es POR DEFINIR si backend lo expone aparte. */
export interface HistoryService {
  getHistory(complaintId: string): Promise<ComplaintHistoryEvent[]>;

  /** Agrega un evento al historial de una queja.
   * Quien lo usa: puede ser usado por cualquiera de las acciones del detalle si backend decide
   * que cada accion de negocio tambien genera un evento via este servicio. */
  addEvent(complaintId: string, event: ComplaintHistoryEvent): Promise<ComplaintHistoryEvent>;
}
