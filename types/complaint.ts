/** Estados oficiales permitidos para una queja. */
export type ComplaintStatus =
  | "recibido"
  | "investigando"
  | "manejando"
  | "aprobado"
  | "rechazado"
  | "completado";

export type ComplaintPriority = "baja" | "media" | "alta";

export interface ComplaintCustomer {
  id: string;
  name: string;
  document: string;
  phone: string;
  email: string;
}

export interface ComplaintTransaction {
  id: string;
  amount: number;
  currency: "COP";
  date: string;
  paymentMethod: "PSE" | "Tarjeta débito" | "Tarjeta crédito";
  transactionStatus: "Exitosa";
}

export interface ComplaintMerchant {
  name: string;
  type: "Comercio" | "Servicio digital";
  code: string;
}

/** Modelo inicial ampliable al integrarse con el backend. */
export interface Complaint {
  id: string;
  createdAt: string;
  updatedAt: string;
  customer: ComplaintCustomer;
  complaintType: string;
  merchant: string;
  merchantInfo: ComplaintMerchant;
  transaction: ComplaintTransaction;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assignedAdvisor?: Advisor | null;
  description: string;
  /** Información recopilada durante la investigación del caso (opcional, mock/local). */
  investigation?: Investigation | null;
  /** Evidencias y soportes asociados (mock/local). */
  evidences?: Evidence[] | null;
  /** Historial de eventos del caso (cronológico). */
  history?: ComplaintHistoryEvent[] | null;
  /** Notas internas del caso. */
  notes?: ComplaintNote[] | null;
  /**
   * Metadatos de la resolución/decisión del caso.
   * Nota: el estado oficial de la queja continúa siendo `status`.
   * `resolution` sólo almacena metadatos sobre la decisión tomada.
   */
  resolution?: Resolution | null;
}

export interface Investigation {
  startedAt: string | null;
  investigator: string | null;
  findings: string;
  transactionVerified: boolean;
  customerDataVerified: boolean;
  merchantDataVerified: boolean;
  paymentVerified: boolean;
  conclusion: string;
}

export interface Advisor {
  id: string;
  name: string;
  role: string;
}

export interface Evidence {
  id: string;
  name: string;
  type: string;
  size: number; // bytes
  uploadedAt: string;
  uploadedBy: string;
  description?: string;
}

export interface ComplaintHistoryEvent {
  id: string;
  type: string; // e.g., status_change, investigation_started, evidence_added, investigation_updated, approved, rejected, completed
  title: string;
  description?: string;
  createdAt: string;
  actor: string;
  metadata?: Record<string, unknown> | null;
}

export interface Resolution {
  decision: "aprobado" | "rechazado";
  decidedAt: string;
  decidedBy: string;
  rejectionReason?: string | null;
  completedAt?: string | null;
}

export interface ComplaintNote {
  id: string;
  complaintId: string;
  content: string;
  author: string;
  authorRole?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export type NotificationType =
  | "assignment"
  | "status_change"
  | "investigation"
  | "evidence"
  | "note"
  | "resolution";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  complaintId?: string;
  createdAt: string;
  read: boolean;
}
