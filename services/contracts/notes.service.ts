import type { ComplaintNote } from "@/types/complaint";

/** SERVICE: Notas internas.
 * Quien lo usa: /quejas/[id], internal-notes-section. */
export interface NotesService {
  getNotes(complaintId: string): Promise<ComplaintNote[]>;

  addNote(complaintId: string, note: ComplaintNote): Promise<ComplaintNote>;
}
