"use client";

import { ChevronDown, UserRound } from "lucide-react";
import { useState } from "react";

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  return <div className="relative"><button aria-expanded={isOpen} aria-haspopup="menu" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400" onClick={() => setIsOpen((open) => !open)} type="button"><span className="grid h-8 w-8 place-items-center rounded-full bg-blue-500/20 text-xs font-semibold text-blue-200">MG</span><span className="hidden sm:block"><span className="block text-sm font-medium text-slate-200">María Gómez</span><span className="block text-xs text-slate-500">Asesora SAC</span></span><ChevronDown aria-hidden="true" className="hidden text-slate-500 sm:block" size={16} /></button>{isOpen && <div className="absolute right-0 top-12 z-20 w-48 rounded-lg border border-slate-700 bg-slate-800 p-1 shadow-xl" role="menu"><div className="border-b border-slate-700 px-3 py-2"><p className="text-sm font-medium text-slate-100">María Gómez</p><p className="text-xs text-slate-400">Asesora SAC</p></div><button className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-700" role="menuitem" type="button"><UserRound size={16} />Perfil (próximamente)</button></div>}</div>;
}
