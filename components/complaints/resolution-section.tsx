"use client";

import { useState } from "react";
import { Check, LoaderCircle, Scale, X } from "lucide-react";
import { formatDateNormalized } from "@/lib/format-date";
import type { Resolution } from "@/types/complaint";
import styles from "./resolution-section.module.scss";

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.summaryRow}>
      <div className={styles.summaryRowLabel}>{label}</div>
      <div className={styles.summaryRowValue}>{value}</div>
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
    <div aria-modal="true" className={styles.overlay} role="dialog">
      <div className={styles.dialog}>
        <h3 className={styles.dialogTitle}>Completar caso</h3>
        <p className={styles.dialogDescription}>¿Confirmas que deseas marcar esta queja como completada? Una vez completada, no se podrán realizar cambios sobre el caso.</p>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.dialogActions}>
          <button onClick={resetDialogs} disabled={isProcessing} className={styles.cancelBtn} type="button">Cancelar</button>
          <button disabled={isProcessing} onClick={() => runAction(() => onComplete?.() ?? true, resetDialogs)} className={styles.confirmApproveBtn} type="button">
            {isProcessing && <LoaderCircle className="animate-spin" size={15} aria-hidden="true" />}
            {isProcessing ? "Procesando…" : "Completar caso"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (status === "recibido") {
    return (
      <section aria-label="Resolución del caso" className={styles.section}>
        <div className={styles.header}>
          <span className={styles.icon}><Scale size={17} aria-hidden="true" /></span>
          <h2 className={styles.title}>Resolución del caso</h2>
        </div>
        <p className={styles.placeholder}>La resolución estará disponible cuando la investigación y gestión del caso hayan avanzado.</p>
      </section>
    );
  }

  if (status === "investigando") {
    return (
      <section aria-label="Resolución del caso" className={styles.section}>
        <div className={styles.header}>
          <span className={styles.icon}><Scale size={17} aria-hidden="true" /></span>
          <h2 className={styles.title}>Resolución del caso</h2>
        </div>
        <p className={styles.placeholder}>El caso se encuentra en investigación. La decisión estará disponible cuando finalice la etapa de investigación.</p>
      </section>
    );
  }

  if (status === "escalado_merchant") {
    return (
      <section aria-label="Resolución del caso" className={styles.section}>
        <div className={styles.header}>
          <span className={`${styles.icon} ${styles.iconWaiting}`}><Scale size={17} aria-hidden="true" /></span>
          <h2 className={styles.title}>Resolución del caso</h2>
        </div>
        <p className={styles.placeholder}>El caso está en espera de respuesta del merchant. La decisión estará disponible cuando se cierre el seguimiento y la investigación continúe.</p>
      </section>
    );
  }

  if (status === "aprobado" || status === "rechazado" || status === "completado") {
    if (!resolution) {
      return (
        <section aria-label="Resolución" className={styles.section}>
          <div className={styles.header}>
            <span className={styles.icon}><Scale size={17} aria-hidden="true" /></span>
            <h2 className={styles.title}>Resolución</h2>
          </div>
          <p className={styles.placeholder}>No hay información de resolución registrada para este caso.</p>
          {status !== "completado" && (
            <div className={styles.footer}>
              <button className={styles.completeBtn} onClick={() => { setError(null); setCompleteOpen(true); }} type="button"><Check size={16} aria-hidden="true" /> Completar caso</button>
            </div>
          )}
          {completeDialog}
        </section>
      );
    }
    const approved = resolution.decision === "aprobado";
    return (
      <section aria-label="Resolución" className={`${styles.section} ${approved ? styles.sectionApproved : styles.sectionRejected}`}>
        <div className={styles.headerBetween}>
          <div className={styles.header}>
            <span className={`${styles.icon} ${approved ? styles.iconApproved : styles.iconRejected}`}>
              {approved ? <Check size={17} aria-hidden="true" /> : <X size={17} aria-hidden="true" />}
            </span>
            <div>
              <h2 className={styles.title}>Resolución: {approved ? "Aprobado" : "Rechazado"}</h2>
              <p className={styles.subtitle}>{approved ? "El caso fue aprobado." : "El caso fue rechazado."}</p>
            </div>
          </div>
        </div>
        <div className={styles.summaryBox}>
          <SummaryRow label="Fecha de decisión" value={formatDateNormalized(resolution.decidedAt)} />
          <SummaryRow label="Decidido por" value={resolution.decidedBy} />
          {resolution.rejectionReason && (
            <div className={styles.divider}>
              <p className={styles.summaryRowLabel}>Motivo del rechazo</p>
              <p className={styles.dividerText}>{resolution.rejectionReason}</p>
            </div>
          )}
          {resolution.completedAt && <SummaryRow label="Completado" value={formatDateNormalized(resolution.completedAt)} />}
        </div>
        {status !== "completado" && (
          <div className={styles.footer}>
            <button
              className={styles.completeBtn}
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
      <section aria-label="Resolución del caso" className={styles.section}>
        <div className={styles.header}>
          <span className={`${styles.icon} ${styles.iconAmber}`}><Scale size={17} aria-hidden="true" /></span>
          <div>
            <h2 className={styles.title}>Resolución del caso</h2>
            <p className={styles.subtitle}>Revisa la información y toma una decisión</p>
          </div>
        </div>

        <div className={styles.decisionBox}>
          <p className={styles.decisionLabel}>Resumen para decisión</p>
          <div className={styles.decisionGrid}>
            <SummaryRow label="Cliente" value={summary?.customer ?? "—"} />
            <SummaryRow label="Queja" value={summary?.complaintType ?? "—"} />
            <SummaryRow label="Transacción" value={summary?.transactionId ?? "—"} />
            <SummaryRow label="Valor" value={summary?.amount ?? "—"} />
            <SummaryRow label="Investigación" value={summary?.investigationProgress ?? "—"} />
            <SummaryRow label="Evidencias" value={summary?.evidencesCount != null ? `${summary?.evidencesCount} archivos` : "—"} />
          </div>
        </div>

        <div className={styles.actionsGrid}>
          <div className={styles.approveCard}>
            <button
              disabled={isProcessing}
              onClick={() => { setError(null); setApproveOpen(true); }}
              className={styles.approveBtn}
              type="button"
            >
              <Check size={16} aria-hidden="true" /> Aprobar
            </button>
            <p className={styles.cardHint}>La queja cumple con los criterios para ser aprobada.</p>
          </div>
          <div className={styles.rejectCard}>
            <button
              disabled={isProcessing}
              onClick={() => { setError(null); setRejectOpen(true); }}
              className={styles.rejectBtn}
              type="button"
            >
              <X size={16} aria-hidden="true" /> Rechazar
            </button>
            <p className={styles.cardHint}>Requiere motivo obligatorio. Quedará en el historial.</p>
          </div>
        </div>

        {approveOpen && (
          <div aria-modal="true" className={styles.overlay} role="dialog">
            <div className={styles.dialog}>
              <h3 className={styles.dialogTitle}>Aprobar queja</h3>
              <p className={styles.dialogDescription}>¿Confirmas que deseas aprobar esta queja? El caso pasará de <span className={styles.emphasis}>Manejando</span> a <span className={styles.emphasisApproved}>Aprobado</span>.</p>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <div className={styles.dialogActions}>
                <button onClick={resetDialogs} disabled={isProcessing} className={styles.cancelBtn} type="button">Cancelar</button>
                <button disabled={isProcessing} onClick={() => runAction(() => onApprove?.() ?? true, resetDialogs)} className={styles.confirmApproveBtn} type="button">
                  {isProcessing && <LoaderCircle className="animate-spin" size={15} aria-hidden="true" />}
                  {isProcessing ? "Procesando…" : "Confirmar aprobación"}
                </button>
              </div>
            </div>
          </div>
        )}

        {rejectOpen && (
          <div aria-modal="true" className={styles.overlay} role="dialog">
            <div className={styles.dialog}>
              <h3 className={styles.dialogTitle}>Rechazar queja</h3>
              <p className={styles.dialogDescription}>Indica el motivo del rechazo. Este motivo quedará asociado al historial del caso.</p>
              <div className={styles.field}>
                <label htmlFor="reject-reason" className={styles.label}>Motivo del rechazo <span className={styles.required}>*</span></label>
                <textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  disabled={isProcessing}
                  placeholder="Ej. La transacción fue validada como legítima con el merchant…"
                  className={styles.textarea}
                />
              </div>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <div className={styles.dialogActions}>
                <button onClick={resetDialogs} disabled={isProcessing} className={styles.cancelBtn} type="button">Cancelar</button>
                <button disabled={isProcessing || rejectReason.trim().length === 0} onClick={() => runAction(() => onReject?.(rejectReason.trim()) ?? true, resetDialogs)} className={styles.confirmRejectBtn} type="button">
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
