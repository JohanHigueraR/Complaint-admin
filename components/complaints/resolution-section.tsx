"use client";

import { useState } from "react";
import { Check, LoaderCircle, Scale, X } from "lucide-react";
import { formatDateNormalized } from "@/lib/format-date";
import type { Resolution } from "@/types/complaint";

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <div className="shrink-0 text-xs text-slate-500">{label}</div>
      <div className="text-right text-sm text-slate-200">{value}</div>
    </div>
  );
}

export default function ResolutionSection({
  status,
  resolution,
  summary,
  onApprove,
  onReject,
  onComplete,
}: {
  status: string;
  resolution?: Resolution | null;
  summary?: { customer?: string; complaintType?: string; transactionId?: string; amount?: string; investigationProgress?: string; evidencesCount?: number };
  onApprove?: () => Promise<boolean> | boolean | void;
  onReject?: (reason: string) => Promise<boolean> | boolean | void;
  onComplete?: () => Promise<boolean> | boolean | void;
}) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Cierra todos los diálogos y limpia el estado temporal. */
  function resetDialogs() {
    setApproveOpen(false);
    setRejectOpen(false);
    setCompleteOpen(false);
    setRejectReason("");
    setError(null);
    setIsProcessing(false);
  }

  /** Ejecuta una acción de resolución; mantiene el diálogo abierto si falla. */
  async function runAction(action: () => Promise<boolean> | boolean | void, close: () => void) {
    if (isProcessing) return;
    setError(null);
    setIsProcessing(true);
    try {
      const result = await action();
      // `undefined`/`true` se consideran éxito; `false` indica fallo.
      if (result === false) {
        setError("No fue posible completar la operación. Revisa el estado del caso e intenta nuevamente.");
        return;
      }
      close();
    } catch {
      setError("Ocurrió un error inesperado. Intenta nuevamente.");
    } finally {
      setIsProcessing(false);
    }
  }

  const completeDialog = completeOpen ? (
    <div aria-modal="true" className="fixed inset-0 z-40 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-[2px]" role="dialog">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h3 className="text-base font-semibold text-slate-100">Completar caso</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">¿Confirmas que deseas marcar esta queja como completada? Una vez completada, no se podrán realizar cambios sobre el caso.</p>
        {error && <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200" role="alert">{error}</p>}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button onClick={resetDialogs} disabled={isProcessing} className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-60" type="button">Cancelar</button>
          <button disabled={isProcessing} onClick={() => runAction(() => onComplete?.() ?? true, resetDialogs)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-60" type="button">
            {isProcessing && <LoaderCircle className="animate-spin" size={15} aria-hidden="true" />}
            {isProcessing ? "Procesando…" : "Completar caso"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (status === "recibido") {
    return (
      <section aria-label="Resolución del caso" className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-800 text-slate-400"><Scale size={17} aria-hidden="true" /></span>
          <h2 className="text-base font-semibold text-slate-100">Resolución del caso</h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-400">La resolución estará disponible cuando la investigación y gestión del caso hayan avanzado.</p>
      </section>
    );
  }

  if (status === "investigando") {
    return (
      <section aria-label="Resolución del caso" className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-800 text-slate-400"><Scale size={17} aria-hidden="true" /></span>
          <h2 className="text-base font-semibold text-slate-100">Resolución del caso</h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-400">El caso se encuentra en investigación. La decisión estará disponible cuando finalice la etapa de investigación.</p>
      </section>
    );
  }

  if (status === "escalado_merchant") {
    return (
      <section aria-label="Resolución del caso" className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-800 text-orange-300"><Scale size={17} aria-hidden="true" /></span>
          <h2 className="text-base font-semibold text-slate-100">Resolución del caso</h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-400">El caso está en espera de respuesta del merchant. La decisión estará disponible cuando se cierre el seguimiento y la investigación continúe.</p>
      </section>
    );
  }

  if (status === "aprobado" || status === "rechazado" || status === "completado") {
    if (!resolution) {
      return (
        <section aria-label="Resolución" className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-800 text-slate-400"><Scale size={17} aria-hidden="true" /></span>
            <h2 className="text-base font-semibold text-slate-100">Resolución</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">No hay información de resolución registrada para este caso.</p>
          {status !== "completado" && (
            <div className="mt-4 border-t border-slate-800/80 pt-4">
              <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400" onClick={() => { setError(null); setCompleteOpen(true); }} type="button"><Check size={16} aria-hidden="true" /> Completar caso</button>
            </div>
          )}
          {completeDialog}
        </section>
      );
    }
    const approved = resolution.decision === "aprobado";
    return (
      <section aria-label="Resolución" className={`rounded-xl border p-5 sm:p-6 ${approved ? "border-emerald-500/25 bg-emerald-500/5" : "border-rose-500/25 bg-rose-500/5"}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className={`grid h-9 w-9 place-items-center rounded-lg ${approved ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
              {approved ? <Check size={17} aria-hidden="true" /> : <X size={17} aria-hidden="true" />}
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Resolución: {approved ? "Aprobado" : "Rechazado"}</h2>
              <p className="text-xs text-slate-500">{approved ? "El caso fue aprobado." : "El caso fue rechazado."}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2.5 rounded-xl border border-slate-800/80 bg-slate-900/70 p-4">
          <SummaryRow label="Fecha de decisión" value={formatDateNormalized(resolution.decidedAt)} />
          <SummaryRow label="Decidido por" value={resolution.decidedBy} />
          {resolution.rejectionReason && (
            <div className="border-t border-slate-800/80 pt-2.5">
              <p className="text-xs text-slate-500">Motivo del rechazo</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-200">{resolution.rejectionReason}</p>
            </div>
          )}
          {resolution.completedAt && <SummaryRow label="Completado" value={formatDateNormalized(resolution.completedAt)} />}
        </div>
        {status !== "completado" && (
          <div className="mt-4">
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
              disabled={isProcessing}
              onClick={() => { setError(null); setCompleteOpen(true); }}
              type="button"
            >
              <Check size={16} aria-hidden="true" /> Completar caso
            </button>
          </div>
        )}
        {completeDialog}
      </section>
    );
  }

  if (status === "manejando") {
    return (
      <section aria-label="Resolución del caso" className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-800 text-amber-300"><Scale size={17} aria-hidden="true" /></span>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Resolución del caso</h2>
            <p className="text-xs text-slate-500">Revisa la información y toma una decisión</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Resumen para decisión</p>
          <div className="mt-3 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
            <SummaryRow label="Cliente" value={summary?.customer ?? "—"} />
            <SummaryRow label="Queja" value={summary?.complaintType ?? "—"} />
            <SummaryRow label="Transacción" value={summary?.transactionId ?? "—"} />
            <SummaryRow label="Valor" value={summary?.amount ?? "—"} />
            <SummaryRow label="Investigación" value={summary?.investigationProgress ?? "—"} />
            <SummaryRow label="Evidencias" value={summary?.evidencesCount != null ? `${summary?.evidencesCount} archivos` : "—"} />
          </div>
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <button
              disabled={isProcessing}
              onClick={() => { setError(null); setApproveOpen(true); }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
              type="button"
            >
              <Check size={16} aria-hidden="true" /> Aprobar
            </button>
            <p className="mt-2 text-xs leading-5 text-slate-400">La queja cumple con los criterios para ser aprobada.</p>
          </div>
          <div className="rounded-xl border border-slate-700/80 bg-slate-950/40 p-4">
            <button
              disabled={isProcessing}
              onClick={() => { setError(null); setRejectOpen(true); }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-transparent px-4 py-2.5 text-sm font-medium text-rose-200 transition-colors hover:bg-rose-500/10 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
              type="button"
            >
              <X size={16} aria-hidden="true" /> Rechazar
            </button>
            <p className="mt-2 text-xs leading-5 text-slate-400">Requiere motivo obligatorio. Quedará en el historial.</p>
          </div>
        </div>

        {approveOpen && (
          <div aria-modal="true" className="fixed inset-0 z-40 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-[2px]" role="dialog">
            <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <h3 className="text-base font-semibold text-slate-100">Aprobar queja</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">¿Confirmas que deseas aprobar esta queja? El caso pasará de <span className="font-medium text-slate-200">Manejando</span> a <span className="font-medium text-emerald-300">Aprobado</span>.</p>
              {error && <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200" role="alert">{error}</p>}
              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button onClick={resetDialogs} disabled={isProcessing} className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-60" type="button">Cancelar</button>
                <button disabled={isProcessing} onClick={() => runAction(() => onApprove?.() ?? true, resetDialogs)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-60" type="button">
                  {isProcessing && <LoaderCircle className="animate-spin" size={15} aria-hidden="true" />}
                  {isProcessing ? "Procesando…" : "Confirmar aprobación"}
                </button>
              </div>
            </div>
          </div>
        )}

        {rejectOpen && (
          <div aria-modal="true" className="fixed inset-0 z-40 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-[2px]" role="dialog">
            <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <h3 className="text-base font-semibold text-slate-100">Rechazar queja</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">Indica el motivo del rechazo. Este motivo quedará asociado al historial del caso.</p>
              <div className="mt-4">
                <label htmlFor="reject-reason" className="text-xs font-medium uppercase tracking-wider text-slate-500">Motivo del rechazo <span className="text-rose-300">*</span></label>
                <textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  disabled={isProcessing}
                  placeholder="Ej. La transacción fue validada como legítima con el merchant…"
                  className="mt-2 min-h-28 w-full rounded-xl border border-slate-700 bg-slate-800/60 p-3 text-sm leading-6 text-slate-200 outline-none transition-colors placeholder:text-slate-500 hover:border-slate-600 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 disabled:opacity-60"
                />
              </div>
              {error && <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200" role="alert">{error}</p>}
              <div className="mt-5 flex items-center justify-end gap-2.5">
                <button onClick={resetDialogs} disabled={isProcessing} className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-60" type="button">Cancelar</button>
                <button disabled={isProcessing || rejectReason.trim().length === 0} onClick={() => runAction(() => onReject?.(rejectReason.trim()) ?? true, resetDialogs)} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60" type="button">
                  {isProcessing && <LoaderCircle className="animate-spin" size={15} aria-hidden="true" />}
                  {isProcessing ? "Procesando…" : "Confirmar rechazo"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  return null;
}