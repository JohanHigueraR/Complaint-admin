"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

import { NotificationCenter } from "@/components/notifications/notification-center";
import { UserMenu } from "@/components/layout/user-menu";

const pageInfo: Record<string, { title: string; crumb?: string }> = { "/quejas": { title: "Quejas" }, "/quejas/mis": { title: "Mis quejas", crumb: "Quejas" }, "/quejas/pendientes": { title: "Pendientes", crumb: "Quejas" }, "/quejas/completadas": { title: "Completadas", crumb: "Quejas" } };

export function Header() {
  const pathname = usePathname();
  const currentPage = pageInfo[pathname] ?? pageInfo["/quejas"];
  return <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 sm:px-6"><div className="flex min-w-0 items-center gap-3"><button aria-label="Abrir navegación" className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 lg:hidden" type="button"><Menu size={20} /></button><div className="min-w-0"><div className="flex items-center gap-2 text-sm"><span className="truncate font-semibold text-slate-100">{currentPage.title}</span>{currentPage.crumb && <><span className="text-slate-600">/</span><span className="hidden text-slate-400 sm:block">{currentPage.crumb}</span></>}</div><p className="hidden text-xs text-slate-500 sm:block">Gestión de casos SAC</p></div></div><div className="flex items-center gap-2"><NotificationCenter /><div className="h-6 w-px bg-slate-800" /><UserMenu /></div></header>;
}
