"use client";

import { create } from "zustand";
import { mockComplaints } from "@/data/mock-complaints";
import { currentAdvisor } from "@/data/mock-advisors";
import { mockNotifications } from "@/data/mock-notifications";
import { normalizeComplaintId } from "@/lib/normalize-complaint-id";
import { DATA_SOURCE } from "@/services/config";
import { complaintsService, notificationsService } from "@/services/service-provider";
import { ServiceError } from "@/services/service-error";
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

/**
 * Ejecuta una llamada a `complaintsService`/`notificationsService` (mock o api, según
 * services/service-provider.ts) y la traduce a `ActionResult`: éxito con el valor resuelto,
 * o fallo con el código/mensaje si se lanzó un `ServiceError`. Cualquier otro error se trata
 * como inesperado — así ninguna acción del store necesita saber si detrás hay memoria o una
 * API real, ver services/README.md.
 */
async function callService<T>(action: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false; result: ActionResult }> {
  try {
    return { ok: true, value: await action() };
  } catch (err) {
    if (err instanceof ServiceError) return { ok: false, result: fail(err.code, err.message) };
    console.error("[Store] Error inesperado:", err);
    return { ok: false, result: fail("MISSING_DATA", "Ocurrió un error inesperado.") };
  }
}

export interface ComplaintStore {
  complaints: Complaint[];
  notifications: Notification[];
  currentAdvisor: Advisor;

  // Selectors
  getComplaintById: (id: string) => Complaint | undefined;
  getUnreadNotificationCount: () => number;

  // Status transitions (solo transiciones simples; aprobado/rechazado/completado usan acciones dedicadas)
  updateComplaintStatus: (id: string, to: ComplaintStatus) => Promise<ActionResult>;

  // Assignment operations (no cambian el estado de la queja)
  assignComplaint: (id: string, advisor: Advisor) => Promise<ActionResult>;
  unassignComplaint: (id: string) => Promise<ActionResult>;
  reassignComplaint: (id: string, advisor: Advisor) => Promise<ActionResult>;

  // Investigation (no cambia el estado de la queja)
  updateInvestigation: (id: string, investigation: NonNullable<Complaint["investigation"]>) => Promise<ActionResult>;

  // Seguimiento con el merchant (solo desde Investigando; cerrar vuelve a Investigando).
  escalateToMerchant: (id: string, note: string) => Promise<ActionResult>;
  closeMerchantEscalation: (id: string, response: string) => Promise<ActionResult>;

  // Evidence
  addEvidence: (id: string, evidence: Evidence) => Promise<ActionResult>;

  // Internal notes
  addInternalNote: (id: string, note: ComplaintNote) => Promise<ActionResult>;

  // Resolution
  approveComplaint: (id: string) => Promise<ActionResult>;
  rejectComplaint: (id: string, reason: string) => Promise<ActionResult>;
  completeComplaint: (id: string) => Promise<ActionResult>;

  // History
  addHistoryEvent: (id: string, event: ComplaintHistoryEvent) => Promise<ActionResult>;

  // Notifications
  addNotification: (notification: Omit<Notification, "id" | "read">) => ActionResult;
  markNotificationAsRead: (id: string) => Promise<ActionResult>;
  markAllNotificationsAsRead: () => Promise<ActionResult>;

  /**
   * Actualización parcial genérica. Por seguridad NO permite cambiar
   * `status` ni `resolution`; usa las acciones dedicadas para eso.
   */
  updateComplaint: (id: string, partial: Partial<Complaint>) => Promise<ActionResult>;
}

export const useComplaintStore = create<ComplaintStore>((set, get) => {
  /** Reemplaza la queja actualizada en el estado local y refresca notificaciones desde el servicio. */
  async function applyComplaintUpdate(updated: Complaint): Promise<void> {
    set((current) => ({
      complaints: current.complaints.map((c) => (c.id === updated.id ? updated : c)),
    }));
    try {
      const notifications = await notificationsService.getNotifications();
      set({ notifications });
    } catch (err) {
      console.error("[Store] getNotifications:", err);
    }
  }

  // Hidratación inicial desde el servicio. En modo mock el estado ya arranca poblado (más
  // abajo) con los mismos datos que devuelve MockComplaintsService, así que esto no cambia
  // nada visible — es un `set` con contenido idéntico. En modo api, reemplaza el arreglo
  // vacío inicial por la respuesta real apenas llega. Ver services/README.md.
  void complaintsService.getComplaints().then((complaints) => set({ complaints })).catch((err) => console.error("[Store] getComplaints:", err));
  void notificationsService.getNotifications().then((notifications) => set({ notifications })).catch((err) => console.error("[Store] getNotifications:", err));

  return {
    complaints: DATA_SOURCE === "mock" ? JSON.parse(JSON.stringify(mockComplaints)) : [],
    notifications: DATA_SOURCE === "mock" ? JSON.parse(JSON.stringify(mockNotifications)) : [],
    currentAdvisor,

    getComplaintById: (id) => {
      const normalized = normalizeComplaintId(id);
      return get().complaints.find((c) => c.id === normalized);
    },

    getUnreadNotificationCount: () => get().notifications.filter((n) => !n.read).length,

    updateComplaintStatus: async (id, to) => {
      const outcome = await callService(() => complaintsService.updateStatus(id, to));
      if (!outcome.ok) return outcome.result;
      await applyComplaintUpdate(outcome.value);
      return OK;
    },

    assignComplaint: async (id, advisor) => {
      const outcome = await callService(() => complaintsService.assign(id, advisor));
      if (!outcome.ok) return outcome.result;
      await applyComplaintUpdate(outcome.value);
      return OK;
    },

    unassignComplaint: async (id) => {
      const outcome = await callService(() => complaintsService.unassign(id));
      if (!outcome.ok) return outcome.result;
      await applyComplaintUpdate(outcome.value);
      return OK;
    },

    reassignComplaint: async (id, advisor) => {
      const outcome = await callService(() => complaintsService.reassign(id, advisor));
      if (!outcome.ok) return outcome.result;
      await applyComplaintUpdate(outcome.value);
      return OK;
    },

    updateInvestigation: async (id, investigation) => {
      const outcome = await callService(() => complaintsService.updateInvestigation(id, investigation));
      if (!outcome.ok) return outcome.result;
      await applyComplaintUpdate(outcome.value);
      return OK;
    },

    escalateToMerchant: async (id, note) => {
      const outcome = await callService(() => complaintsService.escalateToMerchant(id, note));
      if (!outcome.ok) return outcome.result;
      await applyComplaintUpdate(outcome.value);
      return OK;
    },

    closeMerchantEscalation: async (id, response) => {
      const outcome = await callService(() => complaintsService.closeMerchantEscalation(id, response));
      if (!outcome.ok) return outcome.result;
      await applyComplaintUpdate(outcome.value);
      return OK;
    },

    addEvidence: async (id, evidence) => {
      const outcome = await callService(() => complaintsService.addEvidence(id, evidence));
      if (!outcome.ok) return outcome.result;
      await applyComplaintUpdate(outcome.value);
      return OK;
    },

    addInternalNote: async (id, note) => {
      const outcome = await callService(() => complaintsService.addInternalNote(id, note));
      if (!outcome.ok) return outcome.result;
      await applyComplaintUpdate(outcome.value);
      return OK;
    },

    approveComplaint: async (id) => {
      const outcome = await callService(() => complaintsService.approve(id));
      if (!outcome.ok) return outcome.result;
      await applyComplaintUpdate(outcome.value);
      return OK;
    },

    rejectComplaint: async (id, reason) => {
      const outcome = await callService(() => complaintsService.reject(id, reason));
      if (!outcome.ok) return outcome.result;
      await applyComplaintUpdate(outcome.value);
      return OK;
    },

    completeComplaint: async (id) => {
      const outcome = await callService(() => complaintsService.complete(id));
      if (!outcome.ok) return outcome.result;
      await applyComplaintUpdate(outcome.value);
      return OK;
    },

    addHistoryEvent: async (id, event) => {
      const outcome = await callService(() => complaintsService.addHistoryEvent(id, event));
      if (!outcome.ok) return outcome.result;
      await applyComplaintUpdate(outcome.value);
      return OK;
    },

    updateComplaint: async (id, partial) => {
      const outcome = await callService(() => complaintsService.updateComplaint(id, partial));
      if (!outcome.ok) return outcome.result;
      await applyComplaintUpdate(outcome.value);
      return OK;
    },

    addNotification: (notification) => {
      const created: Notification = { ...notification, id: `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, read: false };
      set((state) => ({ notifications: [created, ...state.notifications] }));
      return OK;
    },

    markNotificationAsRead: async (id) => {
      const outcome = await callService(() => notificationsService.markNotificationAsRead(id));
      if (!outcome.ok) return outcome.result;
      const updated = outcome.value;
      set((state) => ({ notifications: state.notifications.map((n) => (n.id === updated.id ? updated : n)) }));
      return OK;
    },

    markAllNotificationsAsRead: async () => {
      const outcome = await callService(() => notificationsService.markAllNotificationsAsRead());
      if (!outcome.ok) return outcome.result;
      set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) }));
      return OK;
    },
  };
});
