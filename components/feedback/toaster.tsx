"use client";

import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import type { ReactElement } from "react";
import { useToastStore, type ToastItem } from "@/lib/toast";

const icons: Record<ToastItem["kind"], ReactElement> = {
  success: <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-300" />,
  error: <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-300" />,
  info: <Info size={18} className="mt-0.5 shrink-0 text-sky-300" />,
};

function ToastCard({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div
      aria-live="polite"
      className={
        item.kind === "error"
          ? "pointer-events-auto flex w-full items-start gap-3 rounded-lg border border-rose-500/30 bg-slate-900 px-4 py-3 shadow-xl"
          : item.kind === "info"
            ? "pointer-events-auto flex w-full items-start gap-3 rounded-lg border border-sky-500/30 bg-slate-900 px-4 py-3 shadow-xl"
            : "pointer-events-auto flex w-full items-start gap-3 rounded-lg border border-emerald-500/30 bg-slate-900 px-4 py-3 shadow-xl"
      }
      role="status"
    >
      {icons[item.kind]}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-100">{item.title}</p>
        {item.description && <p className="mt-0.5 text-xs leading-5 text-slate-400">{item.description}</p>}
      </div>
      <button aria-label="Cerrar notificación" className="rounded p-0.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300" onClick={() => dismiss(item.id)} type="button">
        <X size={14} />
      </button>
    </div>
  );
}

/** Contenedor global de toasts; se monta una sola vez en el layout raíz. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  if (!toasts.length) return null;
  return (
    <div aria-label="Notificaciones de acción" className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((item) => (
        <ToastCard item={item} key={item.id} />
      ))}
    </div>
  );
}