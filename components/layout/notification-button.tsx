"use client";

import { Bell } from "lucide-react";

export function NotificationButton() {
  return <button aria-label="Notificaciones: 3 pendientes" className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400" type="button"><Bell aria-hidden="true" size={19} /><span aria-hidden="true" className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-slate-900 bg-blue-400" /></button>;
}
