import { ClipboardList } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";

interface ComplaintsPlaceholderProps {
  title: string;
  description: string;
}

export function ComplaintsPlaceholder({ title, description }: ComplaintsPlaceholderProps) {
  return <AppShell><PageContainer><div className="max-w-2xl"><p className="mb-2 text-sm font-medium text-blue-300">Gestión de quejas</p><h1 className="text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl">{title}</h1><p className="mt-3 text-sm leading-6 text-slate-400">{description}</p><section className="mt-8 rounded-xl border border-slate-800 bg-slate-800/50 p-6"><div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-800 text-blue-300"><ClipboardList size={20} /></div><h2 className="mt-4 text-base font-semibold text-slate-100">Espacio de trabajo preparado</h2><p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">Aquí se incorporará la vista de casos en una siguiente etapa. Por ahora la navegación y el contexto de trabajo están listos.</p></section></div></PageContainer></AppShell>;
}
