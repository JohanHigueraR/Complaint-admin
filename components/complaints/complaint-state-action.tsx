"use client";

import { ArrowRight, CheckCircle2, LoaderCircle, X } from "lucide-react";
import { useState } from "react";

import { getAvailableActions, getStatusDescription, type StatusAction } from "@/constants/complaint-flow";
import { complaintStatusLabels } from "@/constants/complaints";
import { ComplaintStatusBadge } from "@/components/complaints/complaint-status-badge";
import type { ComplaintStatus } from "@/types/complaint";

interface ComplaintStateActionProps {
  status: ComplaintStatus;
  onTransition: (to: ComplaintStatus) => Promise<boolean>;
}

/** Transiciones gestionadas aquí (inicio de etapas). Las decisiones de resolución viven en el módulo de Resolución. */
const SIMPLE_TARGETS: ComplaintStatus[] = ["investigando", "manejando"];

export function ComplaintStateAction({ status, onTransition }: ComplaintStateActionProps) {
  const [pending, setPending] = useState<StatusAction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const actions = getAvailableActions(status).filter((action) => SIMPLE_TARGETS.includes(action.targetStatus));

  async function execute(action: StatusAction) {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);
    try {
      const ok = await onTransition(action.targetStatus);
      if (!ok) {
        setError("No fue posible actualizar el estado. Intenta nuevamente.");
        return;
      }
      setPending(null);
    } catch {
      setError("Ocurrió un error inesperado. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }

  const request = (action: StatusAction) => (action.requiresConfirmation ? setPending(action) : void execute(action));

  return (
    <>
      <section aria-label="Estado actual del caso" className={`rounded-xl border p-5 sm:p-6 ${status === "completado" ? "border-emerald-500/25 bg-emerald-500/5" : "border-slate-800 bg-slate-900"}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-semibold text-slate-200">Estado actual</h2>
            <ComplaintStatusBadge status={status} />
            {status === "completado" && <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-300"><CheckCircle2 size={16} aria-hidden="true" />Caso completado</span>}
          </div>
        </div>
        <p className="mt-2.5 max-w-2xl text-sm leading-6 text-slate-400">{getStatusDescription(status)}</p>
        {actions.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-slate-800/80 pt-4">
            {actions.map((action) => (
              <button
                className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                disabled={isLoading}
                key={action.targetStatus}
                onClick={() => request(action)}
                type="button"
              >
                {isLoading ? <LoaderCircle className="animate-spin" size={16} aria-hidden="true" /> : <ArrowRight size={15} aria-hidden="true" />}
                {action.label}
              </button>
            ))}
            <span className="text-xs text-slate-500">Esta acción avanzará el caso a “{actions.map((a) => complaintStatusLabels[a.targetStatus]).join(" · ")}”.</span>
          </div>
        )}
        {error && <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200" role="alert">{error}</p>}
      </section>

      {pending && (
        <div aria-modal="true" className="fixed inset-0 z-30 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-[2px]" role="dialog">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-100">¿{pending.label} esta queja?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">Esta acción cambiará el estado de la queja a “{complaintStatusLabels[pending.targetStatus]}”.</p>
              </div>
              <button aria-label="Cerrar confirmación" className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300" disabled={isLoading} onClick={() => { setPending(null); setError(null); }} type="button"><X size={17} /></button>
            </div>
            {error && <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200" role="alert">{error}</p>}
            <div className="mt-6 flex justify-end gap-2.5">
              <button className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200" disabled={isLoading} onClick={() => { setPending(null); setError(null); }} type="button">Cancelar</button>
              <button className="inline-flex min-w-28 items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-400 disabled:opacity-60" disabled={isLoading} onClick={() => execute(pending)} type="button">{isLoading ? <LoaderCircle className="animate-spin" size={16} aria-hidden="true" /> : pending.label}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}