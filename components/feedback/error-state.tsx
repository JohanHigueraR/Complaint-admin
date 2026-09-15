import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

export function ErrorState({ title = "No pudimos cargar las quejas", description = "Intenta nuevamente más tarde.", action }: { title?: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-300">
        <CircleAlert size={20} aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-sm font-semibold text-slate-200">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-400">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}