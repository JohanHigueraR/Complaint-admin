"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavigationItemProps { href: string; icon: LucideIcon; label: string; count: number; exact?: boolean; }

export function NavigationItem({ href, icon: Icon, label, count, exact = false }: NavigationItemProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return <Link aria-current={isActive ? "page" : undefined} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-400 ${isActive ? "bg-blue-500/15 text-blue-200" : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"}`} href={href}><Icon aria-hidden="true" className={isActive ? "text-blue-300" : "text-slate-500 group-hover:text-slate-300"} size={18} /><span className="flex-1">{label}</span><span className={`min-w-6 rounded-md px-1.5 py-0.5 text-center text-xs tabular-nums ${isActive ? "bg-blue-400/15 text-blue-200" : "bg-slate-800 text-slate-400 group-hover:bg-slate-700"}`}>{count}</span></Link>;
}
