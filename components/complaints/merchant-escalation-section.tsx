"use client";

import { Building2, LoaderCircle, MessageSquareReply, Send, X } from "lucide-react";
import { useState } from "react";
import type { MerchantEscalation } from "@/types/complaint";
import { formatDateNormalized } from "@/lib/format-date";

/** Texto corto de tiempo transcurrido desde `iso` hasta ahora (para que el agente vea de un vistazo cuánto lleva esperando). */
function elapsedLabel(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "hace instantes";
  if (minutes < 60) return `hace ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
  const days = Math.floor(hours / 24);
  return `hace ${days} ${days === 1 ? "día" : "días"}`;
}

export default function MerchantEscalationSection({
  status,
  escalation,
  onEscalate,
  onClose,
}: {
  status: string;
  escalation?: MerchantEscalation | null;
  onEscalate?: (note: string) => Promise<boolean> | boolean | void;
  onClose?: (response: string) => Promise<boolean> | boolean | void;
}) {
  const waiting = status === "escalado_merchant";
  const canEscalate = status === "investigando";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [text, setText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!waiting && !canEscalate && !escalation) return null;

  function openDialog() {
    setText("");
    setError(null);
    setDialogOpen(true);
  }

  function cancel() {
    if (isSaving) return;
    setText("");
    setError(null);
    setDialogOpen(false);
  }

  async function submit() {
    if (isSaving) return;
    const trimmed = text.trim();
    if (!trimmed) {
      setError(waiting ? "Registra la respuesta del merchant." : "Describe qué necesitas del merchant.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const result = waiting ? await onClose?.(trimmed) : await onEscalate?.(trimmed);
      if (result === false) {
        setError("No fue posible completar la acción. Intenta nuevamente.");
        return;
      }
      setText("");
      setDialogOpen(false);
    } catch {
      setError("Ocurrió un error inesperado. Intenta nuevamente.");
    } finally {
      setIsSaving(false);
    }
  }

  const previousCycle = !waiting && escalation && escalation.respondedAt ? escalation : null;

  return (
    <section
      aria-label="Seguimiento con el merchant"
      className={`rounded-xl border p-5 sm:p-6 ${waiting ? "border-orange-500/30 bg-orange-500/5" : "border-slate-800 bg-slate-900"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`grid h-9 w-9 place-items-center rounded-lg ${waiting ? "bg-orange-500/15 text-orange-300" : "bg-slate-800 text-slate-400"}`}>
            <Building2 size={17} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Seguimiento con el merchant</h2>
            {waiting && <p className="text-xs text-orange-300">En espera de respuesta · {elapsedLabel(escalation!.escalatedAt)}</p>}
            {!waiting && canEscalate && <p className="text-xs text-slate-500">Envía el caso al merchant si necesitas su confirmación o soporte.</p>}
          </div>
        </div>
        {canEscalate && !waiting && (
          <button
            onClick={openDialog}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500/90 px-3.5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
            type="button"
          >
            <Send size={16} aria-hidden="true" /> Enviar al merchant
          </button>
        )}
      </div>

      {waiting && escalation && (
        <div className="mt-4 space-y-2.5 rounded-xl border border-orange-500/20 bg-slate-950/40 p-4">
          <div className="flex items-start justify-between gap-4 text-sm">
            <div className="shrink-0 text-xs text-slate-500">Enviado</div>
            <div className="text-right text-sm text-slate-200">{formatDateNormalized(escalation.escalatedAt)} · {escalation.escalatedBy}</div>
          </div>
          <div className="border-t border-slate-800/80 pt-2.5">
            <p className="text-xs text-slate-500">Qué se le pidió al merchant</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-200">{escalation.note}</p>
          </div>
        </div>
      )}

      {waiting && (
        <div className="mt-4">
          <button
            onClick={openDialog}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
            type="button"
          >
            <MessageSquareReply size={16} aria-hidden="true" /> Registrar respuesta y cerrar seguimiento
          </button>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            El caso volverá a <span className="font-medium text-slate-200">Investigando</span>. Si el merchant envió soportes, adjúntalos en la sección Evidencias.
          </p>
        </div>
      )}

      {previousCycle && (
        <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Último seguimiento con el merchant</p>
          <div className="mt-2.5 space-y-2.5">
            <div className="flex items-start justify-between gap-4 text-sm">
              <div className="shrink-0 text-xs text-slate-500">Enviado</div>
              <div className="text-right text-sm text-slate-200">{formatDateNormalized(previousCycle.escalatedAt)} · {previousCycle.escalatedBy}</div>
            </div>
            <div className="flex items-start justify-between gap-4 text-sm">
              <div className="shrink-0 text-xs text-slate-500">Respondido</div>
              <div className="text-right text-sm text-slate-200">{formatDateNormalized(previousCycle.respondedAt)} · {previousCycle.closedBy}</div>
            </div>
            <div className="border-t border-slate-800/80 pt-2.5">
              <p className="text-xs text-slate-500">Respuesta del merchant</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-200">{previousCycle.response}</p>
            </div>
          </div>
        </div>
      )}

      {!waiting && !canEscalate && escalation && !previousCycle && (
        <p className="mt-3 text-xs text-slate-500">Solo lectura en este estado.</p>
      )}

      {dialogOpen && (
        <div aria-modal="true" className="fixed inset-0 z-40 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-[2px]" role="dialog">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100">{waiting ? "Registrar respuesta del merchant" : "Enviar caso al merchant"}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  {waiting
                    ? "Describe qué respondió el merchant. El caso volverá a Investigando y quedará en el historial."
                    : "El caso pasará a “Escalado a merchant” y quedará en espera. No cambia el resultado del caso."}
                </p>
              </div>
              <button aria-label="Cerrar" onClick={cancel} disabled={isSaving} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300 disabled:opacity-60" type="button"><X size={17} /></button>
            </div>
            <div className="mt-4">
              <label htmlFor="merchant-text" className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {waiting ? "Respuesta del merchant" : "¿Qué necesitas del merchant?"} <span className="text-rose-300">*</span>
              </label>
              <textarea
                id="merchant-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isSaving}
                placeholder={waiting ? "Ej. El merchant confirmó el reverso y lo aplicará en 48 horas…" : "Ej. Confirmar si el cobro fue autorizado y enviar soporte de la transacción…"}
                className="mt-2 min-h-28 w-full rounded-xl border border-slate-700 bg-slate-800/60 p-3 text-sm leading-6 text-slate-200 outline-none transition-colors placeholder:text-slate-500 hover:border-slate-600 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 disabled:opacity-60"
              />
            </div>
            {error && <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200" role="alert">{error}</p>}
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button onClick={cancel} disabled={isSaving} className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-60" type="button">Cancelar</button>
              <button disabled={isSaving || !text.trim()} onClick={submit} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60" type="button">
                {isSaving && <LoaderCircle className="animate-spin" size={15} aria-hidden="true" />}
                {isSaving ? "Guardando…" : waiting ? "Registrar y cerrar" : "Enviar al merchant"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
