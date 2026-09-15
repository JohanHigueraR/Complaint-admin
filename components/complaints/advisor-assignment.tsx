"use client";

import { useState } from "react";
import { LoaderCircle, UserRound, UserX } from "lucide-react";
import AdvisorSelector from "./advisor-selector";
import { mockAdvisors } from "@/data/mock-advisors";
import type { Advisor } from "@/types/complaint";

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
      <div className="flex items-center gap-2.5">
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${assigned ? "bg-blue-500/15 text-blue-200" : "bg-slate-800 text-slate-500"}`} aria-hidden="true">
          {assigned ? assigned.name.trim().charAt(0).toUpperCase() : <UserX size={14} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-200">
            {assigned ? assigned.name : <span className="font-normal text-slate-500">Sin asignar</span>}
          </p>
          {assigned && <p className="truncate text-xs text-slate-500">{assigned.role}</p>}
        </div>
        <button
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-blue-400"
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