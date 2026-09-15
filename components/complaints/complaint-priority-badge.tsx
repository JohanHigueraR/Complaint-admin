import { complaintPriorityLabels } from "@/constants/complaints";
import type { ComplaintPriority } from "@/types/complaint";

const styles: Record<ComplaintPriority, string> = { alta: "text-amber-300", media: "text-sky-300", baja: "text-slate-400" };

export function ComplaintPriorityBadge({ priority }: { priority: ComplaintPriority }) {
  return <span className={`text-xs font-medium ${styles[priority]}`}>{complaintPriorityLabels[priority]}</span>;
}
