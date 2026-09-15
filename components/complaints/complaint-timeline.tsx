"use client";

import { ArrowRight, Check, CheckCircle2, History, Inbox, Paperclip, Search, StickyNote, UserRound, XCircle } from "lucide-react";
import type { ComplaintHistoryEvent } from "@/types/complaint";
import { formatDateNormalized } from "@/lib/format-date";

function Icon({ type }: { type: string }) {
  switch (type) {
    case "received": return <Inbox size={15} className="text-blue-300" aria-hidden="true" />;
    case "investigation_started": return <Search size={15} className="text-amber-300" aria-hidden="true" />;
    case "investigation_updated": return <CheckCircle2 size={15} className="text-emerald-300" aria-hidden="true" />;
    case "evidence_added": return <Paperclip size={15} className="text-slate-300" aria-hidden="true" />;
    case "internal_note_added": return <StickyNote size={15} className="text-violet-300" aria-hidden="true" />;
    case "assignment": return <UserRound size={15} className="text-sky-300" aria-hidden="true" />;
    case "status_change": return <ArrowRight size={15} className="text-slate-400" aria-hidden="true" />;
    case "approved": return <Check size={15} className="text-emerald-300" aria-hidden="true" />;
    case "rejected": return <XCircle size={15} className="text-rose-300" aria-hidden="true" />;
    case "completed": return <CheckCircle2 size={15} className="text-emerald-300" aria-hidden="true" />;
    default: return <Inbox size={15} className="text-slate-400" aria-hidden="true" />;
  }
}

/** Agrupación visual por categoría de evento (no son estados). */
function categoryOf(type: string): string {
  if (type === "received") return "Recepción";
  if (type === "assignment") return "Asignación";
  if (type === "investigation_started" || type === "investigation_updated") return "Investigación";
  if (type === "evidence_added") return "Evidencia";
  if (type === "internal_note_added") return "Nota interna";
  if (type === "approved" || type === "rejected") return "Resolución";
  if (type === "completed") return "Cierre";
  return "Estado";
}

export default function ComplaintTimeline({ events }: { events?: ComplaintHistoryEvent[] | null }) {
  const list = events ?? [];
  if (list.length === 0) {
    return (
      <section aria-label="Historial" className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-800 text-slate-400"><History size={17} aria-hidden="true" /></span>
          <h2 className="text-base font-semibold text-slate-100">Historial</h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-400">No hay actividad registrada. Las acciones realizadas sobre esta queja aparecerán aquí.</p>
      </section>
    );
  }

  return (
    <section aria-label="Historial" className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-800 text-slate-300"><History size={17} aria-hidden="true" /></span>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Historial</h2>
            <p className="text-xs text-slate-500">{list.length} {list.length === 1 ? "evento registrado" : "eventos registrados"}</p>
          </div>
        </div>
      </div>
      <ol className="relative mt-5 border-l border-slate-800">
        {list.map((ev) => (
          <li key={ev.id} className="relative mb-5 ml-6 last:mb-0">
            <span className="absolute -left-[31px] grid h-6 w-6 place-items-center rounded-full border border-slate-700 bg-slate-900">
              <Icon type={ev.type} />
            </span>
            <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 px-3.5 py-3 transition-colors hover:border-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-100">{ev.title}</p>
                <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[11px] font-medium text-slate-400">{categoryOf(ev.type)}</span>
              </div>
              {ev.description && <p className="mt-1 text-xs leading-5 text-slate-400">{ev.description}</p>}
              <p className="mt-1.5 text-xs text-slate-500">
                <span className="font-medium text-slate-400">{ev.actor}</span>
                <span aria-hidden="true"> · </span>
                <span className="tabular-nums">{formatDateNormalized(ev.createdAt)}</span>
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}