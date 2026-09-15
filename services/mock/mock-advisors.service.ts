import type { Advisor } from "@/types/complaint";
import { mockAdvisors } from "@/data/mock-advisors";
import { AdvisorsService } from "@/services/contracts/advisors.service";

/** Mock de asesores.
 * Quien lo usa: /quejas/[id], advisor-selector.
 * Nota: la asignacion de una queja en particular se gestiona en ComplaintsService, no aqui. */
export class MockAdvisorsService implements AdvisorsService {
  async getAdvisors(): Promise<Advisor[]> {
    return [...mockAdvisors];
  }
}
