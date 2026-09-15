"use client";

import { CheckCircle2, ClipboardList, Clock3, UserRound } from "lucide-react";

import { NavigationItem } from "@/components/layout/navigation-item";
import { getComplaintSummary } from "@/lib/complaint-list";
import { useComplaintStore } from "@/lib/store";

export function Sidebar() {
  const complaints = useComplaintStore((s) => s.complaints);
  const currentAdvisor = useComplaintStore((s) => s.currentAdvisor);
  // Contadores derivados del estado global (no hardcodeados).
  const summary = getComplaintSummary(complaints, currentAdvisor.id);

  const primaryItems = [{ href: "/quejas", label: "Quejas", icon: ClipboardList, count: summary.total, exact: true }, { href: "/quejas/mis", label: "Mis quejas", icon: UserRound, count: summary.mine }];
  const trackingItems = [{ href: "/quejas/pendientes", label: "Pendientes", icon: Clock3, count: summary.pending }, { href: "/quejas/completadas", label: "Completadas", icon: CheckCircle2, count: summary.completed }];

  return <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 lg:flex"><div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5"><div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500 text-sm font-bold text-white">S</div><div><p className="text-sm font-semibold text-slate-100">SAC Central</p><p className="text-xs text-slate-500">Gestión de quejas</p></div></div><nav aria-label="Navegación principal" className="flex-1 p-3"><div className="space-y-1">{primaryItems.map((item) => <NavigationItem key={item.href} {...item} />)}</div><div className="mt-7"><p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Seguimiento</p><div className="space-y-1">{trackingItems.map((item) => <NavigationItem key={item.href} {...item} />)}</div></div></nav><div className="border-t border-slate-800 p-4"><p className="text-xs leading-5 text-slate-500">Datos locales de demostración.</p></div></aside>;
}