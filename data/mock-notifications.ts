import type { Notification } from "@/types/complaint";

export const mockNotifications: Notification[] = [
  // Assignment notifications
  {
    id: "NOTIF-001",
    type: "assignment",
    title: "Queja asignada",
    description: "Se te asignó la queja Q-2026-00148 (Transacción no reconocida).",
    complaintId: "Q-2026-00148",
    createdAt: "2026-09-14T10:28:00-05:00",
    read: false,
  },
  {
    id: "NOTIF-002",
    type: "assignment",
    title: "Queja reasignada",
    description: "Se reasignó la queja Q-2026-00147 a María Gómez.",
    complaintId: "Q-2026-00147",
    createdAt: "2026-09-14T09:15:00-05:00",
    read: true,
  },

  // Status change notifications
  {
    id: "NOTIF-003",
    type: "status_change",
    title: "Cambio de estado",
    description: "La queja Q-2026-00147 cambió a estado 'Investigando'.",
    complaintId: "Q-2026-00147",
    createdAt: "2026-09-14T08:45:00-05:00",
    read: true,
  },
  {
    id: "NOTIF-004",
    type: "status_change",
    title: "Cambio de estado",
    description: "La queja Q-2026-00146 cambió a estado 'Manejando'.",
    complaintId: "Q-2026-00146",
    createdAt: "2026-09-14T07:30:00-05:00",
    read: true,
  },

  // Investigation notifications
  {
    id: "NOTIF-005",
    type: "investigation",
    title: "Investigación actualizada",
    description: "Se guardó la investigación para la queja Q-2026-00147.",
    complaintId: "Q-2026-00147",
    createdAt: "2026-09-14T06:00:00-05:00",
    read: true,
  },

  // Evidence notifications
  {
    id: "NOTIF-006",
    type: "evidence",
    title: "Nueva evidencia",
    description: "Se agregó evidencia a la queja Q-2026-00147 (Transacción bancaria.pdf).",
    complaintId: "Q-2026-00147",
    createdAt: "2026-09-13T17:50:00-05:00",
    read: true,
  },
  {
    id: "NOTIF-007",
    type: "evidence",
    title: "Nueva evidencia",
    description: "Se agregó evidencia a la queja Q-2026-00146 (Comprobante de envío.pdf).",
    complaintId: "Q-2026-00146",
    createdAt: "2026-09-13T15:20:00-05:00",
    read: true,
  },

  // Internal note notifications
  {
    id: "NOTIF-008",
    type: "note",
    title: "Nota interna agregada",
    description: "Se agregó una nota interna a la queja Q-2026-00147.",
    complaintId: "Q-2026-00147",
    createdAt: "2026-09-13T14:10:00-05:00",
    read: true,
  },

  // Resolution notifications
  {
    id: "NOTIF-009",
    type: "resolution",
    title: "Queja aprobada",
    description: "La queja Q-2026-00145 fue aprobada por María Gómez.",
    complaintId: "Q-2026-00145",
    createdAt: "2026-09-12T16:00:00-05:00",
    read: true,
  },
  {
    id: "NOTIF-010",
    type: "status_change",
    title: "Cambio de estado",
    description: "La queja Q-2026-00145 cambió a estado 'Completado'.",
    complaintId: "Q-2026-00145",
    createdAt: "2026-09-12T15:30:00-05:00",
    read: true,
  },

  // More notifications for context
  {
    id: "NOTIF-011",
    type: "resolution",
    title: "Queja rechazada",
    description: "La queja Q-2026-00144 fue rechazada por Nicolás Vega.",
    complaintId: "Q-2026-00144",
    createdAt: "2026-09-11T18:00:00-05:00",
    read: true,
  },
  {
    id: "NOTIF-012",
    type: "status_change",
    title: "Cambio de estado",
    description: "La queja Q-2026-00143 cambió a estado 'Completado'.",
    complaintId: "Q-2026-00143",
    createdAt: "2026-09-10T19:00:00-05:00",
    read: true,
  },
];
