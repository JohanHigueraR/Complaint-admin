"use client";

import { Building2, LoaderCircle, MessageSquareReply, Send, X } from "lucide-react";
import { useState } from "react";
import type { MerchantEscalation } from "@/types/complaint";
import { formatDateNormalized } from "@/lib/format-date";
import styles from "./merchant-escalation-section.module.scss";

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
      className={`${styles.section} ${waiting ? styles.sectionWaiting : ""}`}
    >
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={`${styles.icon} ${waiting ? styles.iconWaiting : ""}`}>
            <Building2 size={17} aria-hidden="true" />
          </span>
          <div>
            <h2 className={styles.title}>Seguimiento con el merchant</h2>
            {waiting && <p className={styles.subtitleWaiting}>En espera de respuesta · {elapsedLabel(escalation!.escalatedAt)}</p>}
            {!waiting && canEscalate && <p className={styles.subtitle}>Envía el caso al merchant si necesitas su confirmación o soporte.</p>}
          </div>
        </div>
        {canEscalate && !waiting && (
          <button onClick={openDialog} className={styles.sendBtn} type="button">
            <Send size={16} aria-hidden="true" /> Enviar al merchant
          </button>
        )}
      </div>

      {waiting && escalation && (
        <div className={styles.summaryCard}>
          <div className={styles.summaryRow}>
            <div className={styles.summaryRowLabel}>Enviado</div>
            <div className={styles.summaryRowValue}>{formatDateNormalized(escalation.escalatedAt)} · {escalation.escalatedBy}</div>
          </div>
          <div className={styles.summaryDivider}>
            <p className={styles.summaryRowLabel}>Qué se le pidió al merchant</p>
            <p className={styles.summaryText}>{escalation.note}</p>
          </div>
        </div>
      )}

      {waiting && (
        <div className={styles.closeAction}>
          <button onClick={openDialog} className={styles.closeBtnMain} type="button">
            <MessageSquareReply size={16} aria-hidden="true" /> Registrar respuesta y cerrar seguimiento
          </button>
          <p className={styles.hint}>
            El caso volverá a <span className={styles.emphasis}>Investigando</span>. Si el merchant envió soportes, adjúntalos en la sección Evidencias.
          </p>
        </div>
      )}

      {previousCycle && (
        <div className={styles.previousCard}>
          <p className={styles.previousLabel}>Último seguimiento con el merchant</p>
          <div className={styles.previousBody}>
            <div className={styles.summaryRow}>
              <div className={styles.summaryRowLabel}>Enviado</div>
              <div className={styles.summaryRowValue}>{formatDateNormalized(previousCycle.escalatedAt)} · {previousCycle.escalatedBy}</div>
            </div>
            <div className={styles.summaryRow}>
              <div className={styles.summaryRowLabel}>Respondido</div>
              <div className={styles.summaryRowValue}>{formatDateNormalized(previousCycle.respondedAt)} · {previousCycle.closedBy}</div>
            </div>
            <div className={styles.summaryDivider}>
              <p className={styles.summaryRowLabel}>Respuesta del merchant</p>
              <p className={styles.summaryText}>{previousCycle.response}</p>
            </div>
          </div>
        </div>
      )}

      {!waiting && !canEscalate && escalation && !previousCycle && (
        <p className={styles.readOnlyHint}>Solo lectura en este estado.</p>
      )}

      {dialogOpen && (
        <div aria-modal="true" className={styles.overlay} role="dialog">
          <div className={styles.dialog}>
            <div className={styles.dialogHeader}>
              <div>
                <h3 className={styles.dialogTitle}>{waiting ? "Registrar respuesta del merchant" : "Enviar caso al merchant"}</h3>
                <p className={styles.dialogDescription}>
                  {waiting
                    ? "Describe qué respondió el merchant. El caso volverá a Investigando y quedará en el historial."
                    : "El caso pasará a “Escalado a merchant” y quedará en espera. No cambia el resultado del caso."}
                </p>
              </div>
              <button aria-label="Cerrar" onClick={cancel} disabled={isSaving} className={styles.closeIconBtn} type="button"><X size={17} /></button>
            </div>
            <div className={styles.field}>
              <label htmlFor="merchant-text" className={styles.label}>
                {waiting ? "Respuesta del merchant" : "¿Qué necesitas del merchant?"} <span className={styles.required}>*</span>
              </label>
              <textarea
                id="merchant-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isSaving}
                placeholder={waiting ? "Ej. El merchant confirmó el reverso y lo aplicará en 48 horas…" : "Ej. Confirmar si el cobro fue autorizado y enviar soporte de la transacción…"}
                className={styles.textarea}
              />
            </div>
            {error && <p className={styles.error} role="alert">{error}</p>}
            <div className={styles.dialogActions}>
              <button onClick={cancel} disabled={isSaving} className={styles.cancelBtn} type="button">Cancelar</button>
              <button disabled={isSaving || !text.trim()} onClick={submit} className={styles.submitBtn} type="button">
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
