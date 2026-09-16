"use client";

import { useState } from "react";
import { LoaderCircle, UserRound, UserX } from "lucide-react";
import AdvisorSelector from "./advisor-selector";
import { mockAdvisors } from "@/data/mock-advisors";
import type { Advisor } from "@/types/complaint";
import styles from "./advisor-assignment.module.scss";

export default function AdvisorAssignment({
  assigned,
  onAssign,
  onReassign,
  onUnassign,
}: {
  assigned?: Advisor | null;
  onAssign: (advisor: Advisor) => Promise<boolean>;
  onReassign: (advisor: Advisor) => Promise<boolean>;
  onUnassign: () => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  /** Ejecuta una operación de asignación; el diálogo ya se cerró al seleccionar. */
  async function handleSelect(advisor: Advisor | null) {
    setOpen(false);
    if (isProcessing) return;
    // Sin cambios: no ejecutar operación ni generar eventos.
    if (!advisor && !assigned) return;
    if (advisor && assigned && advisor.id === assigned.id) return;

    setIsProcessing(true);
    try {
      if (!advisor) {
        await onUnassign();
      } else if (!assigned) {
        await onAssign(advisor);
      } else {
        await onReassign(advisor);
      }
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div>
      <div className={styles.row}>
        <span className={`${styles.avatar} ${assigned ? styles.avatarAssigned : ""}`} aria-hidden="true">
          {assigned ? assigned.name.trim().charAt(0).toUpperCase() : <UserX size={14} />}
        </span>
        <div className={styles.body}>
          <p className={styles.name}>
            {assigned ? assigned.name : <span className={styles.nameEmpty}>Sin asignar</span>}
          </p>
          {assigned && <p className={styles.role}>{assigned.role}</p>}
        </div>
        <button
          className={styles.changeBtn}
          disabled={isProcessing}
          onClick={() => setOpen(true)}
          type="button"
        >
          {isProcessing ? <LoaderCircle className="animate-spin" size={13} aria-hidden="true" /> : <UserRound size={13} aria-hidden="true" />}
          {assigned ? "Cambiar" : "Asignar"}
        </button>
      </div>
      {open && (
        <AdvisorSelector
          advisors={mockAdvisors}
          currentAdvisorId={assigned?.id ?? null}
          onSelect={handleSelect}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
