import { complaintStatusLabels } from "@/constants/complaints";
import type { ComplaintStatus } from "@/types/complaint";
import styles from "./complaint-status-badge.module.scss";

const STATUS_CLASS: Record<ComplaintStatus, string> = {
  recibido: styles.recibido,
  investigando: styles.investigando,
  escalado_merchant: styles.escalado_merchant,
  manejando: styles.manejando,
  aprobado: styles.aprobado,
  rechazado: styles.rechazado,
  completado: styles.completado,
};

export function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  return <span className={`${styles.badge} ${STATUS_CLASS[status]}`}>{complaintStatusLabels[status]}</span>;
}
