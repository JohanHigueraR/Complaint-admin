import { ComplaintPriority, ComplaintStatus } from "@/types/complaint";

export const complaintStatusLabels: Record<ComplaintStatus, string> = {
  recibido: "Recibido",
  investigando: "Investigando",
  manejando: "Manejando",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  completado: "Completado",
};

export const complaintPriorityLabels: Record<ComplaintPriority, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};

export const complaintStatuses = Object.keys(complaintStatusLabels) as ComplaintStatus[];
export const complaintPriorities = Object.keys(complaintPriorityLabels) as ComplaintPriority[];
