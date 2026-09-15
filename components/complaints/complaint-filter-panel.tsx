"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

import { complaintTypes, dateFilterOptions } from "@/constants/complaint-options";
import { complaintPriorityLabels, complaintStatusLabels, complaintStatuses } from "@/constants/complaints";
import { emptyComplaintFilters, type ComplaintFilters } from "@/lib/complaint-list";
import type { ComplaintPriority, ComplaintStatus } from "@/types/complaint";

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
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</legend>
      <div className="max-h-36 space-y-0.5 overflow-y-auto pr-1">
        {values.map((value) => (
          <label key={value} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-800">
            <input
              checked={selected.includes(value)}
              className="h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-900 accent-blue-400"
              onChange={() => onToggle(value)}
              type="checkbox"
            />
            <span className="truncate">{label === "Estado" ? complaintStatusLabels[value as ComplaintStatus] : label === "Prioridad" ? complaintPriorityLabels[value as ComplaintPriority] : value}</span>
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
    <div className="relative">
      <button
        aria-expanded={isOpen}
        className={`inline-flex h-11 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${
          activeCount > 0
            ? "border-blue-400/40 bg-blue-500/10 text-blue-200 hover:bg-blue-500/15"
            : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600 hover:bg-slate-800"
        }`}
        onClick={() => { if (!isOpen) setDraft(filters); setIsOpen((open) => !open); }}
        type="button"
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        Filtros
        {activeCount > 0 && <span className="rounded-md bg-blue-400/20 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-blue-200">{activeCount}</span>}
      </button>
      {isOpen && (
        <>
          <button aria-label="Cerrar filtros" className="fixed inset-0 z-10 cursor-default" onClick={() => setIsOpen(false)} type="button" />
          <section aria-label="Panel de filtros" className="absolute right-0 top-13 z-20 max-h-[80vh] w-[min(24rem,calc(100vw-2.5rem))] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-black/50">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">Filtros</h2>
              <button aria-label="Cerrar" className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200" onClick={() => setIsOpen(false)} type="button"><X size={17} /></button>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FilterGroup label="Estado" onToggle={(value) => update("statuses", toggle(draft.statuses, value))} selected={draft.statuses} values={complaintStatuses} />
              <FilterGroup label="Prioridad" onToggle={(value) => update("priorities", toggle(draft.priorities, value))} selected={draft.priorities} values={["alta", "media", "baja"] as const} />
              <FilterGroup label="Asesor" onToggle={(value) => update("advisors", toggle(draft.advisors, value))} selected={draft.advisors} values={advisors} />
              <FilterGroup label="Merchant" onToggle={(value) => update("merchants", toggle(draft.merchants, value))} selected={draft.merchants} values={merchants} />
              <div className="sm:col-span-2">
                <FilterGroup label="Tipo de queja" onToggle={(value) => update("types", toggle(draft.types, value))} selected={draft.types} values={complaintTypes} />
              </div>
              <fieldset className="sm:col-span-2">
                <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Fecha</legend>
                <select
                  className="h-10 w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 text-sm text-slate-200 outline-none transition-colors hover:border-slate-600 focus:border-blue-400"
                  onChange={(event) => update("date", event.target.value as ComplaintFilters["date"])}
                  value={draft.date}
                >
                  {dateFilterOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                {draft.date === "custom" && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input aria-label="Fecha inicial" className="h-10 rounded-xl border border-slate-700 bg-slate-800/60 px-2.5 text-xs text-slate-200 outline-none [color-scheme:dark] focus:border-blue-400" onChange={(event) => update("startDate", event.target.value)} type="date" value={draft.startDate} />
                    <input aria-label="Fecha final" className="h-10 rounded-xl border border-slate-700 bg-slate-800/60 px-2.5 text-xs text-slate-200 outline-none [color-scheme:dark] focus:border-blue-400" onChange={(event) => update("endDate", event.target.value)} type="date" value={draft.endDate} />
                  </div>
                )}
              </fieldset>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
              <button className="rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200" onClick={clear} type="button">Limpiar</button>
              <button className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-400" onClick={apply} type="button">Aplicar filtros</button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}