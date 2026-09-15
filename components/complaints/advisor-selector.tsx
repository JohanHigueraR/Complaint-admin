"use client";

import { useState } from "react";
import { Check, Search, UserX, X } from "lucide-react";
import type { Advisor } from "@/types/complaint";

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
    <div aria-modal="true" role="dialog" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Asignar asesor</h3>
            <p className="mt-1 text-sm text-slate-400">Busca y selecciona un asesor. La asignación no cambia el estado.</p>
          </div>
          <button aria-label="Cerrar" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300" type="button"><X size={17} /></button>
        </div>
        <div className="relative mt-4">
          <Search size={15} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar asesor…"
            aria-label="Buscar asesor"
            className="h-10 w-full rounded-xl border border-slate-700 bg-slate-800/60 pl-9 pr-3 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-500 hover:border-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
          />
        </div>
        <div className="mt-3 max-h-60 overflow-auto rounded-xl border border-slate-800/80" role="listbox" aria-label="Asesores disponibles">
          {allowUnassign && currentAdvisorId && (
            <button onClick={() => onSelect(null)} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800" type="button" role="option" aria-selected="false">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-800 text-slate-500"><UserX size={14} aria-hidden="true" /></span>
              <span>
                <span className="block font-medium">Sin asignar</span>
                <span className="block text-xs text-slate-500">Quitar el asesor actual</span>
              </span>
            </button>
          )}
          {allowUnassign && !currentAdvisorId && (
            <p className="px-3.5 py-2.5 text-sm text-slate-500">Sin asignar (estado actual)</p>
          )}
          {list.map((a) => {
            const isCurrent = a.id === currentAdvisorId;
            return (
              <button
                key={a.id}
                disabled={isCurrent}
                onClick={() => onSelect(a)}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-slate-800 disabled:cursor-default disabled:hover:bg-transparent"
                type="button"
                role="option"
                aria-selected={isCurrent}
              >
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${isCurrent ? "bg-blue-500/15 text-blue-200" : "bg-slate-800 text-slate-300"}`} aria-hidden="true">
                  {a.name.trim().charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate font-medium ${isCurrent ? "text-slate-400" : "text-slate-200"}`}>{a.name}</span>
                  <span className="block truncate text-xs text-slate-500">{a.role}</span>
                </span>
                {isCurrent && <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-blue-500/15 px-1.5 py-0.5 text-xs font-medium text-blue-200"><Check size={12} aria-hidden="true" /> Actual</span>}
              </button>
            );
          })}
          {!list.length && <p className="px-3.5 py-4 text-sm text-slate-500">No se encontraron asesores con ese criterio.</p>}
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200" type="button">Cancelar</button>
        </div>
      </div>
    </div>
  );
}