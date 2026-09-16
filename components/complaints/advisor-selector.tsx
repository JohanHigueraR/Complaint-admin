"use client";

import { useState } from "react";
import { Check, Search, UserX, X } from "lucide-react";
import type { Advisor } from "@/types/complaint";
import styles from "./advisor-selector.module.scss";

export default function AdvisorSelector({
  advisors,
  onSelect,
  onClose,
  currentAdvisorId = null,
  allowUnassign = true,
}: {
  advisors: Advisor[];
  onSelect: (advisor: Advisor | null) => void;
  onClose: () => void;
  currentAdvisorId?: string | null;
  allowUnassign?: boolean;
}) {
  const [query, setQuery] = useState("");
  const list = advisors.filter((a) => a.name.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es")));

  return (
    <div aria-modal="true" role="dialog" className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Asignar asesor</h3>
            <p className={styles.description}>Busca y selecciona un asesor. La asignación no cambia el estado.</p>
          </div>
          <button aria-label="Cerrar" onClick={onClose} className={styles.closeBtn} type="button"><X size={17} /></button>
        </div>
        <div className={styles.searchWrap}>
          <Search size={15} aria-hidden="true" className={styles.searchIcon} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar asesor…"
            aria-label="Buscar asesor"
            className={styles.searchInput}
          />
        </div>
        <div className={styles.list} role="listbox" aria-label="Asesores disponibles">
          {allowUnassign && currentAdvisorId && (
            <button onClick={() => onSelect(null)} className={styles.option} type="button" role="option" aria-selected="false">
              <span className={styles.avatar}><UserX size={14} aria-hidden="true" /></span>
              <span className={styles.optionBody}>
                <span className={styles.optionName}>Sin asignar</span>
                <span className={styles.optionRole}>Quitar el asesor actual</span>
              </span>
            </button>
          )}
          {allowUnassign && !currentAdvisorId && (
            <p className={styles.emptyRow}>Sin asignar (estado actual)</p>
          )}
          {list.map((a) => {
            const isCurrent = a.id === currentAdvisorId;
            return (
              <button
                key={a.id}
                disabled={isCurrent}
                onClick={() => onSelect(a)}
                className={styles.option}
                type="button"
                role="option"
                aria-selected={isCurrent}
              >
                <span className={`${styles.avatar} ${isCurrent ? styles.avatarCurrent : ""}`}>
                  {a.name.trim().charAt(0).toUpperCase()}
                </span>
                <span className={styles.optionBody}>
                  <span className={`${styles.optionName} ${isCurrent ? styles.optionNameCurrent : ""}`}>{a.name}</span>
                  <span className={styles.optionRole}>{a.role}</span>
                </span>
                {isCurrent && <span className={styles.currentTag}><Check size={12} aria-hidden="true" /> Actual</span>}
              </button>
            );
          })}
          {!list.length && <p className={styles.emptyRow}>No se encontraron asesores con ese criterio.</p>}
        </div>
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.cancelBtn} type="button">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
