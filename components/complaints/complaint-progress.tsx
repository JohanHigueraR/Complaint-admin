import { Check, Circle } from "lucide-react";

import { complaintStatusLabels } from "@/constants/complaints";
import type { ComplaintStatus } from "@/types/complaint";
import styles from "./complaint-progress.module.scss";

const stages: { status: ComplaintStatus; label: string }[] = [{ status: "recibido", label: "Recibido" }, { status: "investigando", label: "Investigando" }, { status: "manejando", label: "Manejando" }, { status: "aprobado", label: "Aprobado" }, { status: "rechazado", label: "Rechazado" }, { status: "completado", label: "Completado" }];
const order: ComplaintStatus[] = ["recibido", "investigando", "manejando", "aprobado", "rechazado", "completado"];

export function ComplaintProgress({ status }: { status: ComplaintStatus }) {
  // "Escalado a merchant" es una rama de la investigación, no una etapa nueva: se refleja como "Investigando" en el stepper.
  const stepStatus: ComplaintStatus = status === "escalado_merchant" ? "investigando" : status;
  const currentIndex = order.indexOf(stepStatus);

  return (
    <section aria-label="Progreso del caso" className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Progreso del caso</h2>
        <span className={styles.current}>Estado actual: {complaintStatusLabels[status]}</span>
      </div>
      <div className={styles.stages}>
        {stages.map((stage, index) => {
          const isCurrent = stage.status === stepStatus;
          const isDone = index < currentIndex && !(status === "rechazado" && stage.status === "aprobado");
          const isAlternative = (stage.status === "aprobado" || stage.status === "rechazado") && !isCurrent;
          return (
            <div className={styles.stage} key={stage.status}>
              {index > 0 && <span className={styles.connector} />}
              {isDone ? (
                <span className={`${styles.dot} ${styles.dotDone}`}><Check size={14} /></span>
              ) : (
                <span className={`${styles.dot} ${isCurrent ? styles.dotCurrent : ""}`}><Circle size={12} fill="currentColor" /></span>
              )}
              <span className={`${styles.label} ${isCurrent ? styles.labelCurrent : isAlternative ? styles.labelAlternative : ""}`}>
                {stage.label}
                {stage.status === "investigando" && status === "escalado_merchant" && <span className={styles.labelExtra}> · esperando merchant</span>}
              </span>
            </div>
          );
        })}
      </div>
      <p className={styles.footer}>Aprobado o Rechazado son resultados alternativos antes de completar el caso.</p>
    </section>
  );
}
