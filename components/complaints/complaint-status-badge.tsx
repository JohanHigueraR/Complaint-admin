import { complaintStatusLabels } from "@/constants/complaints";
import type { ComplaintStatus } from "@/types/complaint";

const styles: Record<ComplaintStatus, string> = { recibido: "bg-slate-700 text-slate-200", investigando: "bg-sky-500/15 text-sky-300", manejando: "bg-violet-500/15 text-violet-300", aprobado: "bg-emerald-500/15 text-emerald-300", rechazado: "bg-rose-500/15 text-rose-300", completado: "bg-teal-500/15 text-teal-300" };

export function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${styles[status]}`}>{complaintStatusLabels[status]}</span>;
}
