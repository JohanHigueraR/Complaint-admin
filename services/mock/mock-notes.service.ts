import type { ComplaintNote } from "@/types/complaint";
import { mockComplaints } from "@/data/mock-complaints";
import { NotesService } from "@/services/contracts/notes.service";

/** Mock de notas internas.
 * Quien lo usa: /quejas/[id], internal-notes-section.
 * Nota: como las notas forman parte de Complaint.notes, este servicio es un contrato separado
 * por si el backend decide que las notas son un recurso independiente. */
export class MockNotesService implements NotesService {
  async getNotes(complaintId: string): Promise<ComplaintNote[]> {
    const normalized = complaintId.startsWith("CL-") ? complaintId.replace("CL-", "Q-") : complaintId;
    const complaint = mockComplaints.find((c) => c.id === normalized);
    return complaint?.notes ?? [];
  }

  async addNote(complaintId: string, note: ComplaintNote): Promise<ComplaintNote> {
    const normalized = complaintId.startsWith("CL-") ? complaintId.replace("CL-", "Q-") : complaintId;
    const complaint = mockComplaints.find((c) => c.id === normalized);
    if (!complaint) throw new Error("NOT_FOUND");

    const created: ComplaintNote = {
      ...note,
      id: note.id || crypto.randomUUID(),
      complaintId: normalized,
      createdAt: note.createdAt || new Date().toISOString(),
      updatedAt: note.updatedAt ?? null,
    };

    // Actualizamos localmente para mantener coherencia del mock
    (complaint as typeof complaint & { notes: ComplaintNote[] }).notes = [
      ...(complaint.notes ?? []),
      created,
    ];

    return created;
  }
}
