"use client";

import { ArrowRight, CheckCircle2, LoaderCircle, X } from "lucide-react";
import { useState } from "react";

import { getAvailableActions, getStatusDescription, type StatusAction } from "@/constants/complaint-flow";
import { complaintStatusLabels } from "@/constants/complaints";
import { ComplaintStatusBadge } from "@/components/complaints/complaint-status-badge";
import type { ComplaintStatus } from "@/types/complaint";
import styles from "./complaint-state-action.module.scss";

interface ComplaintStateActionProps {
  status: ComplaintStatus;
  onTransition: (to: ComplaintStatus) => Promise<boolean>;
}

export function ComplaintStateAction({ status, onTransition }: ComplaintStateActionProps) {
  const [pending, setPending] = useState<StatusAction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Solo transiciones "simples" (sin datos adicionales); las dedicadas (escalar/cerrar merchant, resolución) tienen su propia UI.
  const actions = getAvailableActions(status).filter((action) => action.kind === "simple");

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
      <section aria-label="Estado actual del caso" className={`${styles.section} ${status === "completado" ? styles.sectionDone : ""}`}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.title}>Estado actual</h2>
            <ComplaintStatusBadge status={status} />
            {status === "completado" && <span className={styles.doneTag}><CheckCircle2 size={16} aria-hidden="true" />Caso completado</span>}
          </div>
        </div>
        <p className={styles.description}>{getStatusDescription(status)}</p>
        {actions.length > 0 && (
          <div className={styles.actions}>
            {actions.map((action) => (
              <button
                className={styles.actionBtn}
                disabled={isLoading}
                key={action.targetStatus}
                onClick={() => request(action)}
                type="button"
              >
                {isLoading ? <LoaderCircle className="animate-spin" size={16} aria-hidden="true" /> : <ArrowRight size={15} aria-hidden="true" />}
                {action.label}
              </button>
            ))}
            <span className={styles.hint}>Esta acción avanzará el caso a “{actions.map((a) => complaintStatusLabels[a.targetStatus]).join(" · ")}”.</span>
          </div>
        )}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </section>

      {pending && (
        <div aria-modal="true" className={styles.overlay} role="dialog">
          <div className={styles.dialog}>
            <div className={styles.dialogHeader}>
              <div>
                <h2 className={styles.dialogTitle}>¿{pending.label} esta queja?</h2>
                <p className={styles.dialogDescription}>Esta acción cambiará el estado de la queja a “{complaintStatusLabels[pending.targetStatus]}”.</p>
              </div>
              <button aria-label="Cerrar confirmación" className={styles.closeBtn} disabled={isLoading} onClick={() => { setPending(null); setError(null); }} type="button"><X size={17} /></button>
            </div>
            {error && <p className={styles.error} role="alert">{error}</p>}
            <div className={styles.dialogActions}>
              <button className={styles.cancelBtn} disabled={isLoading} onClick={() => { setPending(null); setError(null); }} type="button">Cancelar</button>
              <button className={styles.confirmBtn} disabled={isLoading} onClick={() => execute(pending)} type="button">{isLoading ? <LoaderCircle className="animate-spin" size={16} aria-hidden="true" /> : pending.label}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
