import { complaintPriorityLabels } from "@/constants/complaints";
import type { ComplaintPriority } from "@/types/complaint";
import styles from "./complaint-priority-badge.module.scss";

const PRIORITY_CLASS: Record<ComplaintPriority, string> = {
  alta: styles.alta,
  media: styles.media,
  baja: styles.baja,
};

export function ComplaintPriorityBadge({ priority }: { priority: ComplaintPriority }) {
  return <span className={`${styles.label} ${PRIORITY_CLASS[priority]}`}>{complaintPriorityLabels[priority]}</span>;
}
