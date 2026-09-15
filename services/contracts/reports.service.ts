import type { Complaint } from "@/types/complaint";

export interface ReportsService {
  /**
   * Agregaciones usadas en graficos de dashboard de quejas.
   * POR DEFINIR: se implementa cuando la UI empezar a consumir agregados en lugar de calcularlos localmente.
   */
  getComplaintsByStatus(): Promise<Array<{ status: string; count: number }>>;
  getComplaintsByPriority(): Promise<Array<{ priority: string; count: number }>>;
  getComplaintsByType(): Promise<Array<{ type: string; count: number }>>;
}
