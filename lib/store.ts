"use client";

import { create } from "zustand";
import { mockComplaints } from "@/data/mock-complaints";
import { currentAdvisor } from "@/data/mock-advisors";
import { mockNotifications } from "@/data/mock-notifications";
import { canTransition } from "@/constants/complaint-flow";
import { complaintStatusLabels } from "@/constants/complaints";
import type { Advisor, Complaint, ComplaintHistoryEvent, ComplaintNote, ComplaintStatus, Evidence, Notification } from "@/types/complaint";

/** Resultado estandarizado de toda operación de negocio del store. */
export interface ActionResult {
  ok: boolean;
  /** Código de error para que la UI muestre mensajes específicos. */
  error?: "NOT_FOUND" | "INVALID_TRANSITION" | "MISSING_DATA" | "READ_ONLY" | "DUPLICATE" | "BUSY";
  /** Mensaje legible para mostrar al usuario. */
  message?: string;
}

const OK: ActionResult = { ok: true };
function fail(error: NonNullable<ActionResult["error"]>, message: string): ActionResult {
  return { ok: false, error, message };
}

/* ---------------------------------------------------------------------------
 * Mutex por queja: evita que dos operaciones (p. ej. Aprobar y Rechazar)
 * se ejecuten en paralelo sobre la misma queja, incluso desde UI distintos.
 * ------------------------------------------------------------------------- */
const busyComplaintIds = new Set<string>();

/** Intenta reservar la queja para una operación. Devuelve false si ya hay una en curso. */
export function beginComplaintOperation(id: string): boolean {
  const normalized = normalizeComplaintId(id);
  if (busyComplaintIds.has(normalized)) return false;
  busyComplaintIds.add(normalized);
  return true;
}

/** Libera la reserva de la queja (llamar siempre en `finally`). */
export function endComplaintOperation(id: string): void {
  busyComplaintIds.delete(normalizeComplaintId(id));
}

/** Indica si la queja tiene una operación en curso. */
export function isComplaintOperationInProgress(id: string): boolean {
  return busyComplaintIds.has(normalizeComplaintId(id));
}

/* ---------------------------------------------------------------------------
 * Utilidades internas
 * ------------------------------------------------------------------------- */
function normalizeComplaintId(id: string): string {
  return id.startsWith("CL-") ? id.replace("CL-", "Q-") : id;
}

function findComplaintIn(state: { complaints: Complaint[] }, id: string): Complaint | undefined {
  const normalized = normalizeComplaintId(id);
  return state.complaints.find((c) => c.id === normalized);
}

/** IDs únicos aunque dos acciones ocurran en el mismo milisegundo. */
function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Estados en los que la investigación es editable. */
const INVESTIGATION_EDITABLE: ComplaintStatus[] = ["investigando", "manejando"];
/** Estados en los que se pueden agregar evidencias. */
const EVIDENCE_EDITABLE: ComplaintStatus[] = ["investigando", "manejando"];
/** Estados en los que se pueden agregar notas internas. */
const NOTES_EDITABLE: ComplaintStatus[] = ["recibido", "investigando", "manejando"];
/** Transiciones "simples" manejadas por updateComplaintStatus (inicio de etapas). */
const SIMPLE_TARGETS: ComplaintStatus[] = ["investigando", "manejando"];

/** Salida discriminada del motor de operaciones de negocio. */
type OpOutcome =
  | { kind: "complaint"; complaint: Complaint; notification?: Notification }
  | { kind: "error"; result: ActionResult };

function opError(error: NonNullable<ActionResult["error"]>, message: string): OpOutcome {
  return { kind: "error", result: fail(error, message) };
}

export interface ComplaintStore {
  complaints: Complaint[];
  notifications: Notification[];
  currentAdvisor: Advisor;

  // Selectors
  getComplaintById: (id: string) => Complaint | undefined;
  getUnreadNotificationCount: () => number;

  // Status transitions (solo transiciones simples; aprobado/rechazado/completado usan acciones dedicadas)
  updateComplaintStatus: (id: string, to: ComplaintStatus) => ActionResult;

  // Assignment operations (no cambian el estado de la queja)
  assignComplaint: (id: string, advisor: Advisor) => ActionResult;
  unassignComplaint: (id: string) => ActionResult;
  reassignComplaint: (id: string, advisor: Advisor) => ActionResult;

  // Investigation (no cambia el estado de la queja)
  updateInvestigation: (id: string, investigation: NonNullable<Complaint["investigation"]>) => ActionResult;

  // Evidence
  addEvidence: (id: string, evidence: Evidence) => ActionResult;

  // Internal notes
  addInternalNote: (id: string, note: ComplaintNote) => ActionResult;

  // Resolution
  approveComplaint: (id: string) => ActionResult;
  rejectComplaint: (id: string, reason: string) => ActionResult;
  completeComplaint: (id: string) => ActionResult;

  // History
  addHistoryEvent: (id: string, event: ComplaintHistoryEvent) => ActionResult;

  // Notifications
  addNotification: (notification: Omit<Notification, "id">) => ActionResult;
  markNotificationAsRead: (id: string) => ActionResult;
  markAllNotificationsAsRead: () => ActionResult;

  /**
   * Actualización parcial genérica. Por seguridad NO permite cambiar
   * `status` ni `resolution`; usa las acciones dedicadas para eso.
   */
  updateComplaint: (id: string, partial: Partial<Complaint>) => ActionResult;
}

export const useComplaintStore = create<ComplaintStore>((set, get) => {
  /** Prependa un evento al historial y devuelve la queja actualizada. */
  function withHistory(complaint: Complaint, event: ComplaintHistoryEvent): Complaint {
    return { ...complaint, history: [event, ...(complaint.history ?? [])] };
  }

  function makeEvent(
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

  function makeNotification(input: Omit<Notification, "id" | "read">): Notification {
    return { ...input, id: uniqueId("NOTIF"), read: false };
  }

  /**
   * Aplica una operación de negocio como unidad transaccional:
   * valida → construye queja + evento + notificación → un único `set`.
   * Si algo falla, no se modifica nada del estado.
   */
  function runBusinessOperation(
    validate: (state: { complaints: Complaint[]; notifications: Notification[]; currentAdvisor: Advisor }) => OpOutcome,
    build: (complaint: Complaint, state: { complaints: Complaint[]; notifications: Notification[]; currentAdvisor: Advisor }) => OpOutcome,
  ): ActionResult {
    const state = get();
    const found = validate(state);
    if (found.kind === "error") return found.result;

    const built = build(found.complaint, state);
    if (built.kind === "error") return built.result;

    set((current) => ({
      complaints: current.complaints.map((c) => (c.id === built.complaint.id ? built.complaint : c)),
      notifications: built.notification ? [built.notification, ...current.notifications] : current.notifications,
    }));
    return OK;
  }

  /** Localiza la queja o devuelve error. */
  function locate(id: string) {
    return (state: { complaints: Complaint[] }): OpOutcome => {
      const complaint = findComplaintIn(state, id);
      return complaint ? { kind: "complaint", complaint } : opError("NOT_FOUND", "La queja no existe.");
    };
  }

  return {
    complaints: JSON.parse(JSON.stringify(mockComplaints)), // Deep copy to avoid mutating original mocks
    notifications: JSON.parse(JSON.stringify(mockNotifications)), // Deep copy to avoid mutating original mocks
    currentAdvisor,

    getComplaintById: (id) => {
      const normalized = normalizeComplaintId(id);
      return get().complaints.find((c) => c.id === normalized);
    },

    getUnreadNotificationCount: () => get().notifications.filter((n) => !n.read).length,

    updateComplaintStatus: (id, to) =>
      runBusinessOperation(
        locate(id),
        (complaint, state) => {
          if (!canTransition(complaint.status, to)) {
            return opError("INVALID_TRANSITION", `Transición inválida: ${complaintStatusLabels[complaint.status]} → ${complaintStatusLabels[to]}.`);
          }
          // Las transiciones hacia aprobado/rechazado/completado deben pasar por sus acciones dedicadas.
          if (!SIMPLE_TARGETS.includes(to)) {
            return opError("INVALID_TRANSITION", `Usa el módulo de Resolución para marcar ${complaintStatusLabels[to]}.`);
          }
          const now = new Date().toISOString();
          const event = makeEvent(complaint.id, `status-${to}`, "status_change", "Estado actualizado", `${complaintStatusLabels[complaint.status]} → ${complaintStatusLabels[to]}`, state.currentAdvisor.name, { from: complaint.status, to });
          const notification = makeNotification({ type: "status_change", title: "Cambio de estado", description: `La queja ${complaint.complaintType} cambió a estado “${complaintStatusLabels[to]}”.`, complaintId: complaint.id, createdAt: now });
          const updated = withHistory({ ...complaint, status: to, updatedAt: now }, event);
          return { kind: "complaint", complaint: updated, notification };
        },
      ),

    assignComplaint: (id, advisor) =>
      runBusinessOperation(
        locate(id),
        (complaint, state) => {
          if (!advisor || !advisor.id || !advisor.name?.trim()) {
            return opError("MISSING_DATA", "Selecciona un asesor válido.");
          }
          // Idempotente: asignar al mismo asesor no duplica eventos ni notificaciones.
          if (complaint.assignedAdvisor?.id === advisor.id) return { kind: "complaint", complaint };
          const now = new Date().toISOString();
          const event = makeEvent(complaint.id, "assigned", "assignment", "Queja asignada", `La queja fue asignada a ${advisor.name}.`, state.currentAdvisor.name, { to: advisor });
          const notification = makeNotification({ type: "assignment", title: "Queja asignada", description: `Se asignó la queja ${complaint.complaintType} a ${advisor.name}.`, complaintId: complaint.id, createdAt: now });
          const updated = withHistory({ ...complaint, assignedAdvisor: advisor, updatedAt: now }, event);
          return { kind: "complaint", complaint: updated, notification };
        },
      ),

    unassignComplaint: (id) =>
      runBusinessOperation(
        locate(id),
        (complaint, state) => {
          // Idempotente: si ya está sin asignar, no se duplican eventos.
          if (!complaint.assignedAdvisor) return { kind: "complaint", complaint };
          const now = new Date().toISOString();
          const event = makeEvent(complaint.id, "unassigned", "assignment", "Asignación eliminada", "La queja quedó sin asesor asignado.", state.currentAdvisor.name, { from: complaint.assignedAdvisor });
          const notification = makeNotification({ type: "assignment", title: "Asignación eliminada", description: `Se eliminó la asignación de la queja ${complaint.complaintType}.`, complaintId: complaint.id, createdAt: now });
          const updated = withHistory({ ...complaint, assignedAdvisor: null, updatedAt: now }, event);
          return { kind: "complaint", complaint: updated, notification };
        },
      ),

    reassignComplaint: (id, advisor) =>
      runBusinessOperation(
        locate(id),
        (complaint, state) => {
          if (!advisor || !advisor.id || !advisor.name?.trim()) {
            return opError("MISSING_DATA", "Selecciona un asesor válido.");
          }
          if (!complaint.assignedAdvisor) {
            // Si no tenía asesor, reasignar equivale a asignar.
            const now = new Date().toISOString();
            const event = makeEvent(complaint.id, "assigned", "assignment", "Queja asignada", `La queja fue asignada a ${advisor.name}.`, state.currentAdvisor.name, { to: advisor });
            const notification = makeNotification({ type: "assignment", title: "Queja asignada", description: `Se asignó la queja ${complaint.complaintType} a ${advisor.name}.`, complaintId: complaint.id, createdAt: now });
            const updated = withHistory({ ...complaint, assignedAdvisor: advisor, updatedAt: now }, event);
            return { kind: "complaint", complaint: updated, notification };
          }
          if (complaint.assignedAdvisor.id === advisor.id) return { kind: "complaint", complaint }; // idempotente
          const previous = complaint.assignedAdvisor;
          const now = new Date().toISOString();
          const event = makeEvent(complaint.id, "reassigned", "assignment", "Asignación actualizada", `La queja fue reasignada de ${previous.name} a ${advisor.name}.`, state.currentAdvisor.name, { from: previous, to: advisor });
          const notification = makeNotification({ type: "assignment", title: "Queja reasignada", description: `La queja ${complaint.complaintType} fue reasignada a ${advisor.name}.`, complaintId: complaint.id, createdAt: now });
          const updated = withHistory({ ...complaint, assignedAdvisor: advisor, updatedAt: now }, event);
          return { kind: "complaint", complaint: updated, notification };
        },
      ),

    updateInvestigation: (id, investigation) =>
      runBusinessOperation(
        locate(id),
        (complaint, state) => {
          if (!INVESTIGATION_EDITABLE.includes(complaint.status)) {
            return opError("READ_ONLY", "La investigación solo es editable en Investigando o Manejando.");
          }
          if (!investigation) {
            return opError("MISSING_DATA", "Datos de investigación inválidos.");
          }
          const now = new Date().toISOString();
          const merged: NonNullable<Complaint["investigation"]> = {
            startedAt: investigation.startedAt ?? complaint.investigation?.startedAt ?? now,
            investigator: investigation.investigator ?? complaint.investigation?.investigator ?? state.currentAdvisor.name,
            findings: investigation.findings ?? "",
            transactionVerified: Boolean(investigation.transactionVerified),
            customerDataVerified: Boolean(investigation.customerDataVerified),
            merchantDataVerified: Boolean(investigation.merchantDataVerified),
            paymentVerified: Boolean(investigation.paymentVerified),
            conclusion: investigation.conclusion ?? "",
          };
          const event = makeEvent(complaint.id, "inv-update", "investigation_updated", "Investigación actualizada", merged.findings?.trim() || "Actualización de investigación.", state.currentAdvisor.name);
          const notification = makeNotification({ type: "investigation", title: "Investigación actualizada", description: `Se guardó la investigación para la queja ${complaint.complaintType}.`, complaintId: complaint.id, createdAt: now });
          const updated = withHistory({ ...complaint, investigation: merged, updatedAt: now }, event);
          return { kind: "complaint", complaint: updated, notification };
        },
      ),

    addEvidence: (id, evidence) =>
      runBusinessOperation(
        locate(id),
        (complaint, state) => {
          if (!EVIDENCE_EDITABLE.includes(complaint.status)) {
            return opError("READ_ONLY", "Solo puedes agregar evidencias en Investigando o Manejando.");
          }
          if (!evidence || !evidence.id || !evidence.name?.trim()) {
            return opError("MISSING_DATA", "La evidencia debe tener un nombre válido.");
          }
          const existing = complaint.evidences ?? [];
          if (existing.some((e) => e.id === evidence.id)) {
            return opError("DUPLICATE", "Esta evidencia ya fue agregada.");
          }
          const now = new Date().toISOString();
          const event = makeEvent(complaint.id, "evidence", "evidence_added", "Nueva evidencia", evidence.name.trim(), evidence.uploadedBy?.trim() || state.currentAdvisor.name, { size: evidence.size ?? 0, type: evidence.type ?? "" });
          const notification = makeNotification({ type: "evidence", title: "Nueva evidencia", description: `Se agregó evidencia a la queja ${complaint.complaintType} (${evidence.name.trim()}).`, complaintId: complaint.id, createdAt: now });
          const updated = withHistory({ ...complaint, evidences: [evidence, ...existing], updatedAt: now }, event);
          return { kind: "complaint", complaint: updated, notification };
        },
      ),

    addInternalNote: (id, note) =>
      runBusinessOperation(
        locate(id),
        (complaint, state) => {
          if (!NOTES_EDITABLE.includes(complaint.status)) {
            return opError("READ_ONLY", "No puedes agregar notas en este estado.");
          }
          const content = note?.content?.trim();
          if (!content) {
            return opError("MISSING_DATA", "La nota no puede estar vacía.");
          }
          const now = new Date().toISOString();
          const author = note.author?.trim() || state.currentAdvisor.name;
          const safeNote: ComplaintNote = { ...note, id: note.id || uniqueId("N"), complaintId: complaint.id, content, author, createdAt: note.createdAt || now };
          const event = makeEvent(complaint.id, "note", "internal_note_added", "Nota interna agregada", `${author} agregó una nota interna al caso.`, author);
          const notification = makeNotification({ type: "note", title: "Nota interna agregada", description: `Se agregó una nota interna a la queja ${complaint.complaintType}.`, complaintId: complaint.id, createdAt: now });
          const updated = withHistory({ ...complaint, notes: [safeNote, ...(complaint.notes ?? [])], updatedAt: now }, event);
          return { kind: "complaint", complaint: updated, notification };
        },
      ),

    approveComplaint: (id) =>
      runBusinessOperation(
        locate(id),
        (complaint, state) => {
          if (!canTransition(complaint.status, "aprobado")) {
            return opError("INVALID_TRANSITION", `No se puede aprobar desde ${complaintStatusLabels[complaint.status]}.`);
          }
          const now = new Date().toISOString();
          const resolution = { decision: "aprobado" as const, decidedAt: now, decidedBy: state.currentAdvisor.name, rejectionReason: null, completedAt: null };
          const event = makeEvent(complaint.id, "approved", "approved", "Queja aprobada", "Manejando → Aprobado", state.currentAdvisor.name, { from: complaint.status, to: "aprobado" });
          const notification = makeNotification({ type: "resolution", title: "Queja aprobada", description: `La queja ${complaint.complaintType} fue aprobada por ${state.currentAdvisor.name}.`, complaintId: complaint.id, createdAt: now });
          const updated = withHistory({ ...complaint, status: "aprobado" as const, updatedAt: now, resolution }, event);
          return { kind: "complaint", complaint: updated, notification };
        },
      ),

    rejectComplaint: (id, reason) =>
      runBusinessOperation(
        locate(id),
        (complaint, state) => {
          if (!canTransition(complaint.status, "rechazado")) {
            return opError("INVALID_TRANSITION", `No se puede rechazar desde ${complaintStatusLabels[complaint.status]}.`);
          }
          const trimmed = reason?.trim();
          if (!trimmed) {
            return opError("MISSING_DATA", "El motivo del rechazo es obligatorio.");
          }
          const now = new Date().toISOString();
          const resolution = { decision: "rechazado" as const, decidedAt: now, decidedBy: state.currentAdvisor.name, rejectionReason: trimmed, completedAt: null };
          const event = makeEvent(complaint.id, "rejected", "rejected", "Queja rechazada", `El caso fue rechazado. Motivo: ${trimmed}`, state.currentAdvisor.name, { reason: trimmed });
          const notification = makeNotification({ type: "resolution", title: "Queja rechazada", description: `La queja ${complaint.complaintType} fue rechazada por ${state.currentAdvisor.name}.`, complaintId: complaint.id, createdAt: now });
          const updated = withHistory({ ...complaint, status: "rechazado" as const, updatedAt: now, resolution }, event);
          return { kind: "complaint", complaint: updated, notification };
        },
      ),

    completeComplaint: (id) =>
      runBusinessOperation(
        locate(id),
        (complaint, state) => {
          if (!canTransition(complaint.status, "completado")) {
            return opError("INVALID_TRANSITION", `No se puede completar desde ${complaintStatusLabels[complaint.status]}.`);
          }
          const now = new Date().toISOString();
          const resolution = complaint.resolution ? { ...complaint.resolution, completedAt: now } : null;
          const event = makeEvent(complaint.id, "completed", "completed", "Queja completada", "Caso marcado como completado.", state.currentAdvisor.name, { from: complaint.status, to: "completado" });
          const notification = makeNotification({ type: "status_change", title: "Queja completada", description: `La queja ${complaint.complaintType} fue marcada como completada.`, complaintId: complaint.id, createdAt: now });
          const updated = withHistory({ ...complaint, status: "completado" as const, updatedAt: now, resolution }, event);
          return { kind: "complaint", complaint: updated, notification };
        },
      ),

    addHistoryEvent: (id, event) => {
      const state = get();
      const complaint = findComplaintIn(state, id);
      if (!complaint) return fail("NOT_FOUND", "La queja no existe.");
      const safeEvent: ComplaintHistoryEvent = { ...event, id: event.id || uniqueId(`H-${complaint.id}`), createdAt: new Date().toISOString() };
      set((current) => ({
        complaints: current.complaints.map((c) => (c.id === complaint.id ? withHistory(c, safeEvent) : c)),
      }));
      return OK;
    },

    updateComplaint: (id, partial) => {
      const state = get();
      const complaint = findComplaintIn(state, id);
      if (!complaint) return fail("NOT_FOUND", "La queja no existe.");
      // Protección: el estado y la resolución solo cambian por acciones dedicadas.
      const safePartial: Partial<Complaint> = { ...partial };
      delete safePartial.status;
      delete safePartial.resolution;
      set((current) => ({
        complaints: current.complaints.map((c) => (c.id === complaint.id ? { ...c, ...safePartial, updatedAt: new Date().toISOString() } : c)),
      }));
      return OK;
    },

    addNotification: (notification) => {
      set((state) => ({
        notifications: [makeNotification(notification), ...state.notifications],
      }));
      return OK;
    },

    markNotificationAsRead: (id) => {
      // Idempotente: marcar dos veces no produce cambios adicionales.
      set((state) => ({
        notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      }));
      return OK;
    },

    markAllNotificationsAsRead: () => {
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      }));
      return OK;
    },
  };
});
/* ---------------------------------------------------------------------------
 * Hooks de persistencia (servicios)
 * ------------------------------------------------------------------------- */

const PersistHooks: PersistHooksIface = {
  async loadComplaints() {
    return complaintService
      .getComplaints()
      .then((list) => ({ ok: true as const, list }))
      .catch((err) => {
        console.error("[Store] loadComplaints:", err);
        return { ok: false as const, error: "LOAD_COMPLAINTS" };
      });
  },

  async loadComplaintById(id: string) {
    return complaintService.getComplaintById(id).catch((err) => {
      console.error("[Store] loadComplaintById:", err, id);
      return null;
    });
  },

  async refreshComplaint(id: string) {
    return complaintService.getComplaintById(id).catch((err) => {
      console.error("[Store] refreshComplaint:", err, id);
      return null;
    });
  },
};