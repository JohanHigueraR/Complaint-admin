"use client";

import { Check, FileSearch, LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import type { Investigation } from "@/types/complaint";
import { formatDateNormalized } from "@/lib/format-date";
import styles from "./investigation-section.module.scss";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value || "—"}</div>
    </div>
  );
}

const EMPTY_INVESTIGATION: Investigation = {
  startedAt: null,
  investigator: null,
  findings: "",
  transactionVerified: false,
  customerDataVerified: false,
  merchantDataVerified: false,
  paymentVerified: false,
  conclusion: "",
};

const CHECKS: { key: keyof Pick<Investigation, "customerDataVerified" | "transactionVerified" | "paymentVerified" | "merchantDataVerified">; group: string; label: string }[] = [
  { key: "customerDataVerified", group: "Cliente", label: "Verificar información del cliente" },
  { key: "transactionVerified", group: "Transacción", label: "Verificar información de la transacción" },
  { key: "paymentVerified", group: "Pago", label: "Verificar información del pago" },
  { key: "merchantDataVerified", group: "Merchant", label: "Verificar información del merchant" },
];

export default function InvestigationSection({
  investigation: initial,
  status,
  onSave,
}: {
  investigation?: Investigation | null;
  status: string;
  onSave?: (inv: Investigation) => Promise<boolean> | boolean | void;
}) {
  const readOnly = !["investigando", "manejando", "escalado_merchant"].includes(status);
  const notStarted = status === "recibido" && !initial;
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inv, setInv] = useState<Investigation>(initial ?? EMPTY_INVESTIGATION);
  // Sincroniza el formulario con el estado global cuando cambia la investigación (patrón de ajuste en render).
  const [prevInitial, setPrevInitial] = useState<Investigation | null | undefined>(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setInv(initial ?? EMPTY_INVESTIGATION);
  }

  const totalChecks = CHECKS.length;
  const completedChecks = useMemo(() => [inv.transactionVerified, inv.customerDataVerified, inv.merchantDataVerified, inv.paymentVerified].filter(Boolean).length, [inv]);
  const progressPct = Math.round((completedChecks / totalChecks) * 100);
  const allDone = progressPct === 100;

  async function save() {
    if (isSaving || readOnly) return;
    setError(null);
    setIsSaving(true);
    try {
      const payload: Investigation = { ...inv, startedAt: inv.startedAt ?? new Date().toISOString() };
      const result = await onSave?.(payload);
      if (result === false) {
        setError("No fue posible guardar la investigación. Intenta nuevamente.");
      }
    } catch {
      setError("Ocurrió un error inesperado al guardar.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section aria-label="Investigación" className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <FileSearch size={18} aria-hidden="true" />
          <h2 className={styles.title}>Investigación</h2>
        </div>
        {!notStarted && (
          <span className={`${styles.progressTag} ${allDone ? styles.progressTagDone : ""}`}>
            {completedChecks}/{totalChecks} verificaciones
          </span>
        )}
      </div>

      {notStarted ? (
        <div className={styles.notStarted}>
          La investigación aún no ha iniciado. Usa <span className={styles.emphasis}>“Iniciar investigación”</span> para comenzar a verificar la información del caso.
        </div>
      ) : (
        <div className={styles.grid}>
          <div className={styles.main}>
            {/* Progreso */}
            <div>
              <div className={styles.progressRow}>
                <span className={styles.progressLabel}>Progreso de verificación</span>
                <span className={styles.progressPct}>{progressPct}%</span>
              </div>
              <div className={styles.progressTrack} role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
                <div className={`${styles.progressFill} ${allDone ? styles.progressFillDone : ""}`} style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            {/* Checklist */}
            <fieldset disabled={readOnly} className={styles.checklist}>
              <legend className="sr-only">Verificaciones del caso</legend>
              {CHECKS.map(({ key, group, label }) => {
                const checked = inv[key];
                return (
                  <label
                    key={key}
                    className={`${styles.checkOption} ${checked ? styles.checkOptionChecked : ""} ${readOnly ? styles.checkOptionDisabled : ""}`}
                  >
                    <span className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ""}`}>
                      <Check size={13} strokeWidth={3} aria-hidden="true" />
                    </span>
                    <input
                      type="checkbox"
                      className={styles.checkInput}
                      disabled={readOnly}
                      checked={checked}
                      onChange={(e) => setInv((s) => ({ ...s, [key]: e.target.checked }))}
                    />
                    <span>
                      <span className={styles.checkGroup}>{group}</span>
                      <span className={styles.checkLabel}>{label}</span>
                    </span>
                  </label>
                );
              })}
            </fieldset>

            {/* Hallazgos y conclusión */}
            <div className={styles.field}>
              <label htmlFor="inv-findings" className={styles.label}>Hallazgos de la investigación</label>
              <textarea
                id="inv-findings"
                className={styles.textarea}
                disabled={readOnly}
                value={inv.findings}
                onChange={(e) => setInv((s) => ({ ...s, findings: e.target.value }))}
                placeholder={readOnly ? "" : "Describe lo encontrado durante la verificación…"}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="inv-conclusion" className={styles.label}>Conclusión</label>
              <input
                id="inv-conclusion"
                className={styles.input}
                disabled={readOnly}
                value={inv.conclusion}
                onChange={(e) => setInv((s) => ({ ...s, conclusion: e.target.value }))}
                placeholder={readOnly ? "" : "Conclusión preliminar del caso…"}
              />
            </div>

            {error && <p className={styles.error} role="alert">{error}</p>}
            <div className={styles.footer}>
              <button
                disabled={readOnly || isSaving}
                onClick={save}
                className={styles.saveBtn}
                type="button"
              >
                {isSaving && <LoaderCircle className="animate-spin" size={15} aria-hidden="true" />}
                {isSaving ? "Guardando…" : "Guardar investigación"}
              </button>
              {readOnly
                ? <span className={styles.hint}>Solo lectura en este estado. Guardar no cambia el estado de la queja.</span>
                : <span className={styles.hint}>Guardar no cambia el estado de la queja.</span>}
            </div>
          </div>

          {/* Resumen lateral */}
          <aside className={styles.summary}>
            <Stat label="Fecha de inicio" value={inv.startedAt ? formatDateNormalized(inv.startedAt) : "—"} />
            <div className={styles.summaryDivider}>
              <Stat label="Asesor investigador" value={inv.investigator ?? "—"} />
            </div>
            <div className={styles.summaryDivider}>
              <p className={styles.statLabel}>Verificaciones</p>
              <ul className={styles.checkSummaryList}>
                {CHECKS.map(({ key, group }) => (
                  <li key={key} className={styles.checkSummaryItem}>
                    <Check size={14} aria-hidden="true" className={inv[key] ? styles.checkSummaryIconOn : styles.checkSummaryIconOff} />
                    <span className={inv[key] ? undefined : styles.checkSummaryTextOff}>{group}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
