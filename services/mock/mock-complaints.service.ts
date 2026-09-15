import { mockComplaints } from "@/data/mock-complaints";
import { mockNotifications } from "@/data/mock-notifications";
import { canTransition, isSimpleTransition } from "@/constants/complaint-flow";
import { complaintStatusLabels } from "@/constants/complaints";
import { currentAdvisor } from "@/data/mock-advisors";
import { normalizeComplaintId } from "@/lib/normalize-complaint-id";
import { ServiceError } from "@/services/service-error";
import type { ComplaintsService } from "@/services/contracts/complaints.service";
import type {
  Advisor,
  Complaint,
  ComplaintHistoryEvent,
  ComplaintNote,
  ComplaintStatus,
  Evidence,
  Investigation,
  MerchantEscalation,
  Notification,
} from "@/types/complaint";

/** Estados en los que la investigación es editable. */
const INVESTIGATION_EDITABLE: ComplaintStatus[] = ["investigando", "manejando", "escalado_merchant"];
/** Estados en los que se pueden agregar evidencias. */
const EVIDENCE_EDITABLE: ComplaintStatus[] = ["investigando", "manejando", "escalado_merchant"];
/** Estados en los que se pueden agregar notas internas. */
const NOTES_EDITABLE: ComplaintStatus[] = ["recibido", "investigando", "manejando", "escalado_merchant"];

/** IDs únicos aunque dos acciones ocurran en el mismo milisegundo. */
function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function deepCopy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

type NotificationDraft = Omit<Notification, "id" | "read">;

/**
 * Implementación mock de ComplaintsService: la misma lógica de negocio que antes vivía
 * inline en lib/store.ts (transiciones válidas, generación de historial/notificaciones),
 * ahora detrás del contrato. Mantiene su propio "storage" en memoria, separado del arreglo
 * que exporta data/mock-complaints.ts (así esa fuente sigue sirviendo intacta para la carga
 * inicial de app/quejas/[id]/page.tsx). Ver services/mock/README.md.
 */
export class MockComplaintsService implements ComplaintsService {
  private complaints: Complaint[] = deepCopy(mockComplaints);

  // ---------------------------------------------------------------------------
  // Utilidades internas
  // ---------------------------------------------------------------------------

  private find(id: string): Complaint {
    const normalized = normalizeComplaintId(id);
    const complaint = this.complaints.find((c) => c.id === normalized);
    if (!complaint) throw new ServiceError("NOT_FOUND", "La queja no existe.");
    return complaint;
  }

  private withHistory(complaint: Complaint, event: ComplaintHistoryEvent): Complaint {
    return { ...complaint, history: [event, ...(complaint.history ?? [])] };
  }

  private makeEvent(
    complaintId: string,
    suffix: string,
    type: string,
    title: string,
    description: string,
    actor: string,
    metadata: Record<string, unknown> | null = null,
  ): ComplaintHistoryEvent {
    return { id: uniqueId(`H-${complaintId}-${suffix}`), type, title, description, createdAt: new Date().toISOString(), actor, metadata };
  }

  /** Crea la notificación y la agrega al mismo storage que usa MockNotificationsService, para que quede visible desde ahí. */
  private notify(draft: NotificationDraft): void {
    const notification: Notification = { ...draft, id: uniqueId("NOTIF"), read: false };
    mockNotifications.unshift(notification);
  }

  /** Reemplaza la queja en el storage, la devuelve, y opcionalmente registra la notificación asociada. */
  private commit(updated: Complaint, notification?: NotificationDraft): Complaint {
    this.complaints = this.complaints.map((c) => (c.id === updated.id ? updated : c));
    if (notification) this.notify(notification);
    return deepCopy(updated);
  }

  // ---------------------------------------------------------------------------
  // Lectura
  // ---------------------------------------------------------------------------

  async getComplaints(): Promise<Complaint[]> {
    return deepCopy(this.complaints);
  }

  async getComplaintById(id: string): Promise<Complaint | null> {
    const normalized = normalizeComplaintId(id);
    const complaint = this.complaints.find((c) => c.id === normalized);
    return complaint ? deepCopy(complaint) : null;
  }

  // ---------------------------------------------------------------------------
  // Transición simple de estado
  // ---------------------------------------------------------------------------

  async updateStatus(id: string, to: ComplaintStatus): Promise<Complaint> {
    const complaint = this.find(id);
    if (!canTransition(complaint.status, to)) {
      throw new ServiceError("INVALID_TRANSITION", `Transición inválida: ${complaintStatusLabels[complaint.status]} → ${complaintStatusLabels[to]}.`);
    }
    // Las transiciones que requieren datos adicionales (resolución, escalar/cerrar seguimiento merchant) usan sus propias acciones.
    if (!isSimpleTransition(complaint.status, to)) {
      throw new ServiceError("INVALID_TRANSITION", `Esta transición requiere información adicional; usa la acción dedicada para marcar ${complaintStatusLabels[to]}.`);
    }
    const now = new Date().toISOString();
    const event = this.makeEvent(complaint.id, `status-${to}`, "status_change", "Estado actualizado", `${complaintStatusLabels[complaint.status]} → ${complaintStatusLabels[to]}`, currentAdvisor.name, { from: complaint.status, to });
    const notification: NotificationDraft = { type: "status_change", title: "Cambio de estado", description: `La queja ${complaint.complaintType} cambió a estado “${complaintStatusLabels[to]}”.`, complaintId: complaint.id, createdAt: now };
    return this.commit(this.withHistory({ ...complaint, status: to, updatedAt: now }, event), notification);
  }

  // ---------------------------------------------------------------------------
  // Asignación
  // ---------------------------------------------------------------------------

  async assign(id: string, advisor: Advisor): Promise<Complaint> {
    const complaint = this.find(id);
    if (!advisor || !advisor.id || !advisor.name?.trim()) {
      throw new ServiceError("MISSING_DATA", "Selecciona un asesor válido.");
    }
    // Idempotente: asignar al mismo asesor no duplica eventos ni notificaciones.
    if (complaint.assignedAdvisor?.id === advisor.id) return deepCopy(complaint);
    const now = new Date().toISOString();
    const event = this.makeEvent(complaint.id, "assigned", "assignment", "Queja asignada", `La queja fue asignada a ${advisor.name}.`, currentAdvisor.name, { to: advisor });
    const notification: NotificationDraft = { type: "assignment", title: "Queja asignada", description: `Se asignó la queja ${complaint.complaintType} a ${advisor.name}.`, complaintId: complaint.id, createdAt: now };
    return this.commit(this.withHistory({ ...complaint, assignedAdvisor: advisor, updatedAt: now }, event), notification);
  }

  async unassign(id: string): Promise<Complaint> {
    const complaint = this.find(id);
    // Idempotente: si ya está sin asignar, no se duplican eventos.
    if (!complaint.assignedAdvisor) return deepCopy(complaint);
    const now = new Date().toISOString();
    const event = this.makeEvent(complaint.id, "unassigned", "assignment", "Asignación eliminada", "La queja quedó sin asesor asignado.", currentAdvisor.name, { from: complaint.assignedAdvisor });
    const notification: NotificationDraft = { type: "assignment", title: "Asignación eliminada", description: `Se eliminó la asignación de la queja ${complaint.complaintType}.`, complaintId: complaint.id, createdAt: now };
    return this.commit(this.withHistory({ ...complaint, assignedAdvisor: null, updatedAt: now }, event), notification);
  }

  async reassign(id: string, advisor: Advisor): Promise<Complaint> {
    const complaint = this.find(id);
    if (!advisor || !advisor.id || !advisor.name?.trim()) {
      throw new ServiceError("MISSING_DATA", "Selecciona un asesor válido.");
    }
    if (!complaint.assignedAdvisor) {
      // Si no tenía asesor, reasignar equivale a asignar.
      const now = new Date().toISOString();
      const event = this.makeEvent(complaint.id, "assigned", "assignment", "Queja asignada", `La queja fue asignada a ${advisor.name}.`, currentAdvisor.name, { to: advisor });
      const notification: NotificationDraft = { type: "assignment", title: "Queja asignada", description: `Se asignó la queja ${complaint.complaintType} a ${advisor.name}.`, complaintId: complaint.id, createdAt: now };
      return this.commit(this.withHistory({ ...complaint, assignedAdvisor: advisor, updatedAt: now }, event), notification);
    }
    if (complaint.assignedAdvisor.id === advisor.id) return deepCopy(complaint); // idempotente
    const previous = complaint.assignedAdvisor;
    const now = new Date().toISOString();
    const event = this.makeEvent(complaint.id, "reassigned", "assignment", "Asignación actualizada", `La queja fue reasignada de ${previous.name} a ${advisor.name}.`, currentAdvisor.name, { from: previous, to: advisor });
    const notification: NotificationDraft = { type: "assignment", title: "Queja reasignada", description: `La queja ${complaint.complaintType} fue reasignada a ${advisor.name}.`, complaintId: complaint.id, createdAt: now };
    return this.commit(this.withHistory({ ...complaint, assignedAdvisor: advisor, updatedAt: now }, event), notification);
  }

  // ---------------------------------------------------------------------------
  // Investigación
  // ---------------------------------------------------------------------------

  async updateInvestigation(id: string, investigation: NonNullable<Investigation>): Promise<Complaint> {
    const complaint = this.find(id);
    if (!INVESTIGATION_EDITABLE.includes(complaint.status)) {
      throw new ServiceError("READ_ONLY", "La investigación solo es editable en Investigando o Manejando.");
    }
    if (!investigation) {
      throw new ServiceError("MISSING_DATA", "Datos de investigación inválidos.");
    }
    const now = new Date().toISOString();
    const merged: NonNullable<Complaint["investigation"]> = {
      startedAt: investigation.startedAt ?? complaint.investigation?.startedAt ?? now,
      investigator: investigation.investigator ?? complaint.investigation?.investigator ?? currentAdvisor.name,
      findings: investigation.findings ?? "",
      transactionVerified: Boolean(investigation.transactionVerified),
      customerDataVerified: Boolean(investigation.customerDataVerified),
      merchantDataVerified: Boolean(investigation.merchantDataVerified),
      paymentVerified: Boolean(investigation.paymentVerified),
      conclusion: investigation.conclusion ?? "",
    };
    const event = this.makeEvent(complaint.id, "inv-update", "investigation_updated", "Investigación actualizada", merged.findings?.trim() || "Actualización de investigación.", currentAdvisor.name);
    const notification: NotificationDraft = { type: "investigation", title: "Investigación actualizada", description: `Se guardó la investigación para la queja ${complaint.complaintType}.`, complaintId: complaint.id, createdAt: now };
    return this.commit(this.withHistory({ ...complaint, investigation: merged, updatedAt: now }, event), notification);
  }

  // ---------------------------------------------------------------------------
  // Seguimiento con el merchant
  // ---------------------------------------------------------------------------

  async escalateToMerchant(id: string, note: string): Promise<Complaint> {
    const complaint = this.find(id);
    // Chequeo explícito (no canTransition): "investigando" es el único origen válido para esta acción dedicada.
    if (complaint.status !== "investigando") {
      throw new ServiceError("INVALID_TRANSITION", "Solo puedes enviar el caso al merchant mientras está en Investigando.");
    }
    const trimmed = note?.trim();
    if (!trimmed) {
      throw new ServiceError("MISSING_DATA", "Describe qué necesitas del merchant antes de enviar el caso.");
    }
    const now = new Date().toISOString();
    const escalation: MerchantEscalation = { escalatedAt: now, escalatedBy: currentAdvisor.name, note: trimmed, respondedAt: null, response: null, closedBy: null };
    const event = this.makeEvent(complaint.id, "merchant-escalated", "merchant_escalated", "Caso enviado al merchant", trimmed, currentAdvisor.name, { note: trimmed });
    const notification: NotificationDraft = { type: "merchant", title: "Caso enviado al merchant", description: `La queja ${complaint.complaintType} fue enviada al merchant y queda en espera de respuesta.`, complaintId: complaint.id, createdAt: now };
    return this.commit(this.withHistory({ ...complaint, status: "escalado_merchant", merchantEscalation: escalation, updatedAt: now }, event), notification);
  }

  async closeMerchantEscalation(id: string, response: string): Promise<Complaint> {
    const complaint = this.find(id);
    // Chequeo explícito: solo se cierra un seguimiento que esté realmente activo.
    if (complaint.status !== "escalado_merchant" || !complaint.merchantEscalation) {
      throw new ServiceError("INVALID_TRANSITION", "No hay un seguimiento con el merchant activo para cerrar.");
    }
    const trimmed = response?.trim();
    if (!trimmed) {
      throw new ServiceError("MISSING_DATA", "Registra la respuesta del merchant antes de cerrar el seguimiento.");
    }
    const now = new Date().toISOString();
    const escalation: MerchantEscalation = { ...complaint.merchantEscalation, respondedAt: now, response: trimmed, closedBy: currentAdvisor.name };
    const event = this.makeEvent(complaint.id, "merchant-responded", "merchant_response_received", "Respuesta del merchant registrada", trimmed, currentAdvisor.name, { response: trimmed });
    const notification: NotificationDraft = { type: "merchant", title: "El merchant respondió", description: `Se registró la respuesta del merchant para la queja ${complaint.complaintType}.`, complaintId: complaint.id, createdAt: now };
    return this.commit(this.withHistory({ ...complaint, status: "investigando", merchantEscalation: escalation, updatedAt: now }, event), notification);
  }

  // ---------------------------------------------------------------------------
  // Evidencias y notas
  // ---------------------------------------------------------------------------

  async addEvidence(id: string, evidence: Evidence): Promise<Complaint> {
    const complaint = this.find(id);
    if (!EVIDENCE_EDITABLE.includes(complaint.status)) {
      throw new ServiceError("READ_ONLY", "Solo puedes agregar evidencias en Investigando o Manejando.");
    }
    if (!evidence || !evidence.id || !evidence.name?.trim()) {
      throw new ServiceError("MISSING_DATA", "La evidencia debe tener un nombre válido.");
    }
    const existing = complaint.evidences ?? [];
    if (existing.some((e) => e.id === evidence.id)) {
      throw new ServiceError("DUPLICATE", "Esta evidencia ya fue agregada.");
    }
    const now = new Date().toISOString();
    const event = this.makeEvent(complaint.id, "evidence", "evidence_added", "Nueva evidencia", evidence.name.trim(), evidence.uploadedBy?.trim() || currentAdvisor.name, { size: evidence.size ?? 0, type: evidence.type ?? "" });
    const notification: NotificationDraft = { type: "evidence", title: "Nueva evidencia", description: `Se agregó evidencia a la queja ${complaint.complaintType} (${evidence.name.trim()}).`, complaintId: complaint.id, createdAt: now };
    return this.commit(this.withHistory({ ...complaint, evidences: [evidence, ...existing], updatedAt: now }, event), notification);
  }

  async addInternalNote(id: string, note: ComplaintNote): Promise<Complaint> {
    const complaint = this.find(id);
    if (!NOTES_EDITABLE.includes(complaint.status)) {
      throw new ServiceError("READ_ONLY", "No puedes agregar notas en este estado.");
    }
    const content = note?.content?.trim();
    if (!content) {
      throw new ServiceError("MISSING_DATA", "La nota no puede estar vacía.");
    }
    const now = new Date().toISOString();
    const author = note.author?.trim() || currentAdvisor.name;
    const safeNote: ComplaintNote = { ...note, id: note.id || uniqueId("N"), complaintId: complaint.id, content, author, createdAt: note.createdAt || now };
    const event = this.makeEvent(complaint.id, "note", "internal_note_added", "Nota interna agregada", `${author} agregó una nota interna al caso.`, author);
    const notification: NotificationDraft = { type: "note", title: "Nota interna agregada", description: `Se agregó una nota interna a la queja ${complaint.complaintType}.`, complaintId: complaint.id, createdAt: now };
    return this.commit(this.withHistory({ ...complaint, notes: [safeNote, ...(complaint.notes ?? [])], updatedAt: now }, event), notification);
  }

  // ---------------------------------------------------------------------------
  // Resolución
  // ---------------------------------------------------------------------------

  async approve(id: string): Promise<Complaint> {
    const complaint = this.find(id);
    if (!canTransition(complaint.status, "aprobado")) {
      throw new ServiceError("INVALID_TRANSITION", `No se puede aprobar desde ${complaintStatusLabels[complaint.status]}.`);
    }
    const now = new Date().toISOString();
    const resolution = { decision: "aprobado" as const, decidedAt: now, decidedBy: currentAdvisor.name, rejectionReason: null, completedAt: null };
    const event = this.makeEvent(complaint.id, "approved", "approved", "Queja aprobada", "Manejando → Aprobado", currentAdvisor.name, { from: complaint.status, to: "aprobado" });
    const notification: NotificationDraft = { type: "resolution", title: "Queja aprobada", description: `La queja ${complaint.complaintType} fue aprobada por ${currentAdvisor.name}.`, complaintId: complaint.id, createdAt: now };
    return this.commit(this.withHistory({ ...complaint, status: "aprobado", updatedAt: now, resolution }, event), notification);
  }

  async reject(id: string, reason: string): Promise<Complaint> {
    const complaint = this.find(id);
    if (!canTransition(complaint.status, "rechazado")) {
      throw new ServiceError("INVALID_TRANSITION", `No se puede rechazar desde ${complaintStatusLabels[complaint.status]}.`);
    }
    const trimmed = reason?.trim();
    if (!trimmed) {
      throw new ServiceError("MISSING_DATA", "El motivo del rechazo es obligatorio.");
    }
    const now = new Date().toISOString();
    const resolution = { decision: "rechazado" as const, decidedAt: now, decidedBy: currentAdvisor.name, rejectionReason: trimmed, completedAt: null };
    const event = this.makeEvent(complaint.id, "rejected", "rejected", "Queja rechazada", `El caso fue rechazado. Motivo: ${trimmed}`, currentAdvisor.name, { reason: trimmed });
    const notification: NotificationDraft = { type: "resolution", title: "Queja rechazada", description: `La queja ${complaint.complaintType} fue rechazada por ${currentAdvisor.name}.`, complaintId: complaint.id, createdAt: now };
    return this.commit(this.withHistory({ ...complaint, status: "rechazado", updatedAt: now, resolution }, event), notification);
  }

  async complete(id: string): Promise<Complaint> {
    const complaint = this.find(id);
    if (!canTransition(complaint.status, "completado")) {
      throw new ServiceError("INVALID_TRANSITION", `No se puede completar desde ${complaintStatusLabels[complaint.status]}.`);
    }
    const now = new Date().toISOString();
    const resolution = complaint.resolution ? { ...complaint.resolution, completedAt: now } : null;
    const event = this.makeEvent(complaint.id, "completed", "completed", "Queja completada", "Caso marcado como completado.", currentAdvisor.name, { from: complaint.status, to: "completado" });
    const notification: NotificationDraft = { type: "status_change", title: "Queja completada", description: `La queja ${complaint.complaintType} fue marcada como completada.`, complaintId: complaint.id, createdAt: now };
    return this.commit(this.withHistory({ ...complaint, status: "completado", updatedAt: now, resolution }, event), notification);
  }

  // ---------------------------------------------------------------------------
  // Historial y actualización genérica
  // ---------------------------------------------------------------------------

  async addHistoryEvent(id: string, event: ComplaintHistoryEvent): Promise<Complaint> {
    const complaint = this.find(id);
    const safeEvent: ComplaintHistoryEvent = { ...event, id: event.id || uniqueId(`H-${complaint.id}`), createdAt: new Date().toISOString() };
    return this.commit(this.withHistory(complaint, safeEvent));
  }

  async updateComplaint(id: string, partial: Partial<Complaint>): Promise<Complaint> {
    const complaint = this.find(id);
    // Protección: el estado y la resolución solo cambian por acciones dedicadas.
    const safePartial: Partial<Complaint> = { ...partial };
    delete safePartial.status;
    delete safePartial.resolution;
    return this.commit({ ...complaint, ...safePartial, updatedAt: new Date().toISOString() });
  }

  // ---------------------------------------------------------------------------
  // Notificaciones (redundante a propósito con NotificationsService — ver contracts/README.md)
  // ---------------------------------------------------------------------------

  async getNotifications(): Promise<Notification[]> {
    return deepCopy(mockNotifications);
  }

  async markNotificationAsRead(id: string): Promise<Notification[]> {
    const index = mockNotifications.findIndex((n) => n.id === id);
    if (index !== -1) mockNotifications[index] = { ...mockNotifications[index], read: true };
    return deepCopy(mockNotifications);
  }

  async markAllNotificationsAsRead(): Promise<Notification[]> {
    mockNotifications.forEach((n) => { n.read = true; });
    return deepCopy(mockNotifications);
  }

  async getUnreadNotificationCount(): Promise<number> {
    return mockNotifications.filter((n) => !n.read).length;
  }
}
