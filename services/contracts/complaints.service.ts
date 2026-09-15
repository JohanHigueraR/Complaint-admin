import type { Complaint, ComplaintStatus, Advisor, Investigation, Evidence, ComplaintNote, ComplaintHistoryEvent, Notification } from "@/types/complaint";

/** Operaciones de negocio que hoy son local/mock. Futuro contrato API sin tocar UI/store. */
export interface ComplaintsService {
  /** Listado base que consume /quejas, /quejas/mis, /quejas/pendientes, /quejas/completadas. 
   * IMPORTANTE: los filtros y segmentos (mis/pendientes/completadas) se resuelven en el servicio, no en el componente. */
  getComplaints(): Promise<Complaint[]>;

  /** Detalle de una queja: /quejas/[id], resolución, investigación, evidencias, notas, timeline. */
  getComplaintById(id: string): Promise<Complaint | null>;

  /** Actualización de metadatos no criticos (p. ej. campos editables del resumen). 
   * No se usa actualmente en la UI; está preparada para casos futuros y para la implementación API. 
   * STATUS y RESOLUTION NUNCA se modifican aqui; cada uno tiene su propia acción. */
  updateComplaint(id: string, partial: Partial<Complaint>): Promise<Complaint>;

  /** Transición simple de estado Regulares: recibido→investigando, investigando→manejando. */
  updateStatus(id: string, to: ComplaintStatus): Promise<Complaint>;

  /** Quien lo usa: /quejas/[id], panel de asignación. */
  assign(id: string, advisor: Advisor): Promise<Complaint>;

  /** Quien lo usa: /quejas/[id], panel de asignación. */
  unassign(id: string): Promise<Complaint>;

  /** Quien lo usa: /quejas/[id], panel de asignación. */
  reassign(id: string, advisor: Advisor): Promise<Complaint>;

  /** Quien lo usa: /quejas/[id], sección de investigación. */
  updateInvestigation(id: string, investigation: NonNullable<Investigation>): Promise<Complaint>;

  /** Quien lo usa: /quejas/[id], sección de evidencias. */
  addEvidence(id: string, evidence: Evidence): Promise<Complaint>;

  /** Quien lo usa: /quejas/[id], sección de notas internas. */
  addInternalNote(id: string, note: ComplaintNote): Promise<Complaint>;

  /** Quien lo usa: /quejas/[id], sección de resolución. */
  approve(id: string): Promise<Complaint>;

  /** Quien lo usa: /quejas/[id], sección de resolución. */
  reject(id: string, reason: string): Promise<Complaint>;

  /** Quien lo usa: /quejas/[id], sección de resolución / timeline. */
  complete(id: string): Promise<Complaint>;

  /** Quien lo usa: /quejas/[id], timeline. POR DEFINIR si esto va separado o embebido en getComplaintById. */
  addHistoryEvent(id: string, event: ComplaintHistoryEvent): Promise<Complaint>;

  /** Quien lo usa: centro de notificaciones. */
  getNotifications(): Promise<Notification[]>;

  /** Quien lo usa: centro de notificaciones. */
  markNotificationAsRead(id: string): Promise<Notification[]>;

  /** Quien lo usa: centro de notificaciones. */
  markAllNotificationsAsRead(): Promise<Notification[]>;

  /** TOTALMENTE POR DEFINIR. Quien lo usa: header, centro de notificaciones (contador).
   * La UI actual calcula el contador sobre notificaciones en memoria; si el backend decide
   * que el contador debe venir por separado, este método lo expone (evita hacer un GET completo
   * de notificaciones solo por el badge). */
  getUnreadNotificationCount(): Promise<number>;
}
