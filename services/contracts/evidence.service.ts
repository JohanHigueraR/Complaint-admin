import type { Evidence } from "@/types/complaint";

/** SERVICE: Evidencias.
 * Quien lo usa: /quejas/[id], evidence-section.
 * La UI actual crea evidencias en memoria; el contrato prepara las operaciones que ocuparia el backend. */
export interface EvidenceService {
  /** Cargar evidencias de una queja. 
   * IMPORTANTE: Quien lo usa puede ser el detail, pero si el backend decide getComplaintById con evidences embebidas,
   * este metodo se puede eliminar o quedarse solo para carga bajo demanda. */
  getEvidenceList(complaintId: string): Promise<Evidence[]>;

  /** Agregar evidencia (pseudo-file upload). 
   * POR DEFINIR: si se envia como multipart, como base64, como URL... 
   * y si se puede agregar mas de una por peticion. */
  addEvidence(complaintId: string, evidence: Evidence): Promise<Evidence>;
}
