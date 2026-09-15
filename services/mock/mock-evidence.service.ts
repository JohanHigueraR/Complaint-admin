import type { Evidence } from "@/types/complaint";
import { mockComplaints } from "@/data/mock-complaints";
import { EvidenceService } from "@/services/contracts/evidence.service";

/**
 * Mock de evidencias.
 * Quien lo usa: /quejas/[id], evidence-section.
 * IMPORTANTE: la evidencia de una queja tambien es parte de Complaint.evidences y se puede
 * gestionar desde el servicio de quejas. Aqui dejamos el contrato separado por si el backend decide
 * que las evidencias son un recurso independiente (con su propio endpoint y posiblemente metadata extra).
 *
 * POR DEFINIR:
 * - si el backend prefiere embeber evidences dentro de getComplaintById, este servicio puede no usarse.
 * - si el backend prefiere un endpoint dedicado (p. ej. /complaints/{id}/evidences), se completa aqui.
 */
export class MockEvidenceService implements EvidenceService {
  async getEvidenceList(complaintId: string): Promise<Evidence[]> {
    const normalized = complaintId.startsWith("CL-") ? complaintId.replace("CL-", "Q-") : complaintId;
    const complaint = mockComplaints.find((c) => c.id === normalized);
    return complaint?.evidences ?? [];
  }

  async addEvidence(complaintId: string, evidence: Evidence): Promise<Evidence> {
    const normalized = complaintId.startsWith("CL-") ? complaintId.replace("CL-", "Q-") : complaintId;
    const complaint = mockComplaints.find((c) => c.id === normalized);
    if (!complaint) throw new Error("NOT_FOUND");

    if (complaint.evidences?.some((e) => e.id === evidence.id)) {
      throw new Error("DUPLICATE");
    }

    const added: Evidence = {
      ...evidence,
      id: evidence.id || crypto.randomUUID(),
      uploadedAt: evidence.uploadedAt || new Date().toISOString(),
    };

    // Actualizamos localmente solo para mantener coherencia del mock (la UI no debe asumir persistencia)
    (complaint as typeof complaint & { evidences: Evidence[] }).evidences = [
      ...(complaint.evidences ?? []),
      added,
    ];

    return added;
  }
}
