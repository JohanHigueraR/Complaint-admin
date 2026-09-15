import type { Advisor } from "@/types/complaint";

/** Servicio de operaciones sobre asesores.
 * Actualmente el frontend solo carga los mock y los selecciona en el selector.
 * Contrato preparado para cuando backend tenga los datos reales. */
export interface AdvisorsService {
  /** Usado por:
   * - /quejas/[id], advisor-selector (para cargar la lista)
   * - el store y/o el componente de asignacion
   */
  getAdvisors(): Promise<Advisor[]>;
}
