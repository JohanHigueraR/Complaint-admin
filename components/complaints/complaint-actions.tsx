"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

const actions = ["Iniciar investigación", "Continuar gestión", "Aprobar", "Rechazar", "Completar"];

export function ComplaintActions() {
  const [open, setOpen] = useState(false);
  return <div className="relative"><button aria-expanded={open} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm font-medium text-slate-300 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400" onClick={() => setOpen((value) => !value)} type="button">Acciones <ChevronDown size={16} /></button>{open && <div className="absolute right-0 top-11 z-10 w-52 rounded-lg border border-slate-700 bg-slate-900 p-1 shadow-xl"><p className="px-3 py-2 text-xs text-slate-500">Próximamente</p>{actions.map((action) => <button className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-500" disabled key={action} type="button">{action}</button>)}</div>}</div>;
}
