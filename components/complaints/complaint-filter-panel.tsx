"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

import { complaintTypes, dateFilterOptions } from "@/constants/complaint-options";
import { complaintPriorityLabels, complaintStatusLabels, complaintStatuses } from "@/constants/complaints";
import { emptyComplaintFilters, type ComplaintFilters } from "@/lib/complaint-list";
import type { ComplaintPriority, ComplaintStatus } from "@/types/complaint";
import styles from "./complaint-filter-panel.module.scss";

interface ComplaintFilterPanelProps {
  filters: ComplaintFilters;
  advisors: string[];
  merchants: string[];
  activeCount: number;
  onApply: (filters: ComplaintFilters) => void;
  onClear: () => void;
}

function FilterGroup<T extends string>({ label, values, selected, onToggle }: { label: string; values: readonly T[]; selected: T[]; onToggle: (value: T) => void }) {
  return (
    <fieldset>
      <legend className={styles.groupLabel}>{label}</legend>
      <div className={styles.groupList}>
        {values.map((value) => (
          <label key={value} className={styles.checkOption}>
            <input
              checked={selected.includes(value)}
              onChange={() => onToggle(value)}
              type="checkbox"
            />
            <span>{label === "Estado" ? complaintStatusLabels[value as ComplaintStatus] : label === "Prioridad" ? complaintPriorityLabels[value as ComplaintPriority] : value}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function toggle<T>(items: T[], item: T) { return items.includes(item) ? items.filter((value) => value !== item) : [...items, item]; }

export function ComplaintFilterPanel({ filters, advisors, merchants, activeCount, onApply, onClear }: ComplaintFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const update = <K extends keyof ComplaintFilters>(key: K, value: ComplaintFilters[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const apply = () => { onApply(draft); setIsOpen(false); };
  const clear = () => { setDraft(emptyComplaintFilters); onClear(); setIsOpen(false); };

  return (
    <div className={styles.wrap}>
      <button
        aria-expanded={isOpen}
        className={`${styles.trigger} ${activeCount > 0 ? styles.triggerActive : ""}`}
        onClick={() => { if (!isOpen) setDraft(filters); setIsOpen((open) => !open); }}
        type="button"
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        Filtros
        {activeCount > 0 && <span className={styles.triggerCount}>{activeCount}</span>}
      </button>
      {isOpen && (
        <>
          <button aria-label="Cerrar filtros" className={styles.overlay} onClick={() => setIsOpen(false)} type="button" />
          <section aria-label="Panel de filtros" className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Filtros</h2>
              <button aria-label="Cerrar" className={styles.closeBtn} onClick={() => setIsOpen(false)} type="button"><X size={17} /></button>
            </div>
            <div className={styles.grid}>
              <FilterGroup label="Estado" onToggle={(value) => update("statuses", toggle(draft.statuses, value))} selected={draft.statuses} values={complaintStatuses} />
              <FilterGroup label="Prioridad" onToggle={(value) => update("priorities", toggle(draft.priorities, value))} selected={draft.priorities} values={["alta", "media", "baja"] as const} />
              <FilterGroup label="Asesor" onToggle={(value) => update("advisors", toggle(draft.advisors, value))} selected={draft.advisors} values={advisors} />
              <FilterGroup label="Merchant" onToggle={(value) => update("merchants", toggle(draft.merchants, value))} selected={draft.merchants} values={merchants} />
              <div className={styles.span2}>
                <FilterGroup label="Tipo de queja" onToggle={(value) => update("types", toggle(draft.types, value))} selected={draft.types} values={complaintTypes} />
              </div>
              <fieldset className={styles.span2}>
                <legend className={styles.groupLabel}>Fecha</legend>
                <select
                  className={styles.dateSelect}
                  onChange={(event) => update("date", event.target.value as ComplaintFilters["date"])}
                  value={draft.date}
                >
                  {dateFilterOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                {draft.date === "custom" && (
                  <div className={styles.dateRange}>
                    <input aria-label="Fecha inicial" className={styles.dateInput} onChange={(event) => update("startDate", event.target.value)} type="date" value={draft.startDate} />
                    <input aria-label="Fecha final" className={styles.dateInput} onChange={(event) => update("endDate", event.target.value)} type="date" value={draft.endDate} />
                  </div>
                )}
              </fieldset>
            </div>
            <div className={styles.footer}>
              <button className={styles.clearBtn} onClick={clear} type="button">Limpiar</button>
              <button className={styles.applyBtn} onClick={apply} type="button">Aplicar filtros</button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
