import { Check, Circle } from "lucide-react";

import { complaintStatusLabels } from "@/constants/complaints";
import type { ComplaintStatus } from "@/types/complaint";

const stages: { status: ComplaintStatus; label: string }[] = [{ status: "recibido", label: "Recibido" }, { status: "investigando", label: "Investigando" }, { status: "manejando", label: "Manejando" }, { status: "aprobado", label: "Aprobado" }, { status: "rechazado", label: "Rechazado" }, { status: "completado", label: "Completado" }];
const order: ComplaintStatus[] = ["recibido", "investigando", "manejando", "aprobado", "rechazado", "completado"];

export function ComplaintProgress({ status }: { status: ComplaintStatus }) {
  // "Escalado a merchant" es una rama de la investigación, no una etapa nueva: se refleja como "Investigando" en el stepper.
  const stepStatus: ComplaintStatus = status === "escalado_merchant" ? "investigando" : status;
  const currentIndex = order.indexOf(stepStatus);
  return <section aria-label="Progreso del caso" className="rounded-xl border border-slate-800 bg-slate-900 p-5"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-slate-200">Progreso del caso</h2><span className="text-xs text-slate-500">Estado actual: {complaintStatusLabels[status]}</span></div><div className="mt-5 grid gap-3 md:grid-cols-6">{stages.map((stage, index) => { const isCurrent = stage.status === stepStatus; const isDone = index < currentIndex && !(status === "rechazado" && stage.status === "aprobado"); const isAlternative = (stage.status === "aprobado" || stage.status === "rechazado") && !isCurrent; return <div className="relative flex items-center gap-2 md:flex-col md:items-start" key={stage.status}>{index > 0 && <span className="absolute -left-3 top-1/2 hidden h-px w-3 bg-slate-700 md:block" />}{isDone ? <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500/20 text-emerald-300"><Check size={14} /></span> : <span className={`grid h-6 w-6 place-items-center rounded-full ${isCurrent ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-600"}`}><Circle size={12} fill="currentColor" /></span>}<span className={`text-xs font-medium ${isCurrent ? "text-blue-300" : isAlternative ? "text-slate-500" : "text-slate-400"}`}>{stage.label}{stage.status === "investigando" && status === "escalado_merchant" && <span className="text-orange-400"> · esperando merchant</span>}</span></div>; })}</div><p className="mt-4 text-xs text-slate-500">Aprobado o Rechazado son resultados alternativos antes de completar el caso.</p></section>;
}
