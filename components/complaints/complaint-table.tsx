import Link from "next/link";
import { ArrowUpRight, UserRound } from "lucide-react";

import { ComplaintPriorityBadge } from "@/components/complaints/complaint-priority-badge";
import { ComplaintStatusBadge } from "@/components/complaints/complaint-status-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { getAvailableActions } from "@/constants/complaint-flow";
import type { Complaint } from "@/types/complaint";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Bogota" }).format(new Date(value));
}

function displayId(id: string) {
  return `#${id.replace("Q-", "CL-")}`;
}

/** Siguiente acción disponible según el estado (solo lectura, sin ejecutar). */
function nextActionLabel(complaint: Complaint): string | null {
  const actions = getAvailableActions(complaint.status);
  if (!actions.length) return null;
  return actions.map((a) => a.label).join(" · ");
}

function AdvisorCell({ complaint, currentAdvisorId }: { complaint: Complaint; currentAdvisorId?: string }) {
  const assigned = complaint.assignedAdvisor;
  const isMine = !!assigned && !!currentAdvisorId && assigned.id === currentAdvisorId;
  if (!assigned) return <span className="text-slate-600">Sin asignar</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      {isMine && <UserRound size={13} className="shrink-0 text-blue-300" aria-label="Asignada a ti" />}
      <span className={isMine ? "font-medium text-blue-200" : undefined}>{assigned.name}</span>
    </span>
  );
}

export function ComplaintTable({ complaints, currentAdvisorId }: { complaints: Complaint[]; currentAdvisorId?: string }) {
  if (!complaints.length) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900">
        <EmptyState
          title="No encontramos quejas"
          description="No hay quejas que coincidan con los criterios seleccionados. Ajusta la búsqueda o limpia los filtros."
        />
      </div>
    );
  }

  return (
    <>
      {/* Vista desktop: tabla optimizada para lectura rápida */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 md:block">
        <table className="w-full min-w-[1080px] text-left">
          <thead className="border-b border-slate-800 bg-slate-900/80">
            <tr className="text-xs font-medium uppercase tracking-wider text-slate-500">
              {["Caso", "Cliente", "Merchant", "Fecha", "Prioridad", "Estado", "Asesor", "Siguiente paso"].map((label) => (
                <th className="whitespace-nowrap px-4 py-3.5 first:pl-5 last:pr-5" key={label} scope="col">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {complaints.map((complaint) => {
              const isMine = !!complaint.assignedAdvisor && !!currentAdvisorId && complaint.assignedAdvisor.id === currentAdvisorId;
              const next = nextActionLabel(complaint);
              return (
                <tr className={`group transition-colors hover:bg-slate-800/60 ${isMine ? "bg-blue-500/[0.04]" : ""}`} key={complaint.id}>
                  <td className="whitespace-nowrap px-4 py-3.5 first:pl-5">
                    <Link
                      className="rounded-md font-mono text-sm font-medium text-blue-300 underline-offset-4 hover:text-blue-200 hover:underline focus-visible:outline-2 focus-visible:outline-blue-400"
                      href={`/quejas/${complaint.id}`}
                    >
                      {displayId(complaint.id)}
                    </Link>
                    <p className="mt-0.5 max-w-56 truncate text-xs text-slate-500">{complaint.complaintType}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <p className="text-sm font-medium text-slate-200">{complaint.customer.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-slate-500">{complaint.transaction.id}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-400">{complaint.merchant}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm tabular-nums text-slate-400">{formatDate(complaint.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3.5"><ComplaintPriorityBadge priority={complaint.priority} /></td>
                  <td className="whitespace-nowrap px-4 py-3.5"><ComplaintStatusBadge status={complaint.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-400">
                    <AdvisorCell complaint={complaint} currentAdvisorId={currentAdvisorId} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 last:pr-5">
                    {next ? (
                      <span className="text-xs text-slate-500">{next}</span>
                    ) : (
                      <span className="text-xs text-slate-600">Sin acciones</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Vista móvil/tablet pequeña: tarjetas compactas */}
      <ul className="space-y-2.5 md:hidden">
        {complaints.map((complaint) => {
          const isMine = !!complaint.assignedAdvisor && !!currentAdvisorId && complaint.assignedAdvisor.id === currentAdvisorId;
          const next = nextActionLabel(complaint);
          return (
            <li key={complaint.id}>
              <Link
                href={`/quejas/${complaint.id}`}
                className={`block rounded-xl border bg-slate-900 p-4 transition-colors active:bg-slate-800/70 ${
                  isMine ? "border-blue-400/30" : "border-slate-800"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium text-blue-300">{displayId(complaint.id)}</p>
                    <p className="mt-0.5 truncate text-sm font-medium text-slate-200">{complaint.complaintType}</p>
                  </div>
                  <ComplaintStatusBadge status={complaint.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                  <span className="font-medium text-slate-300">{complaint.customer.name}</span>
                  <span aria-hidden="true" className="text-slate-700">•</span>
                  <span>{complaint.merchant}</span>
                  <span aria-hidden="true" className="text-slate-700">•</span>
                  <span className="tabular-nums">{formatDate(complaint.createdAt)}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
                  <span className="flex items-center gap-2 text-xs">
                    <ComplaintPriorityBadge priority={complaint.priority} />
                    <span className="text-slate-500">·</span>
                    <AdvisorCell complaint={complaint} currentAdvisorId={currentAdvisorId} />
                  </span>
                  {next ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                      {next} <ArrowUpRight size={13} aria-hidden="true" />
                    </span>
                  ) : (
                    <span className="text-xs text-slate-600">Sin acciones</span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}