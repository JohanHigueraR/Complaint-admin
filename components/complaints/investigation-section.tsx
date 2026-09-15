"use client";

import { Check, FileSearch, LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import type { Investigation } from "@/types/complaint";
import { formatDateNormalized } from "@/lib/format-date";

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="text-sm"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 text-sm text-slate-200">{value || <span className="text-slate-500">—</span>}</div></div>;
}

const EMPTY_INVESTIGATION: Investigation = {
  startedAt: null,
  investigator: null,
  findings: "",
  transactionVerified: false,
  customerDataVerified: false,
  merchantDataVerified: false,
  paymentVerified: false,
  conclusion: "",
};

const CHECKS: { key: keyof Pick<Investigation, "customerDataVerified" | "transactionVerified" | "paymentVerified" | "merchantDataVerified">; group: string; label: string }[] = [
  { key: "customerDataVerified", group: "Cliente", label: "Verificar información del cliente" },
  { key: "transactionVerified", group: "Transacción", label: "Verificar información de la transacción" },
  { key: "paymentVerified", group: "Pago", label: "Verificar información del pago" },
  { key: "merchantDataVerified", group: "Merchant", label: "Verificar información del merchant" },
];

export default function InvestigationSection({
  investigation: initial,
  status,
  onSave,
}: {
  investigation?: Investigation | null;
  status: string;
  onSave?: (inv: Investigation) => Promise<boolean> | boolean | void;
}) {
  const readOnly = !["investigando", "manejando", "escalado_merchant"].includes(status);
  const notStarted = status === "recibido" && !initial;
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inv, setInv] = useState<Investigation>(initial ?? EMPTY_INVESTIGATION);
  // Sincroniza el formulario con el estado global cuando cambia la investigación (patrón de ajuste en render).
  const [prevInitial, setPrevInitial] = useState<Investigation | null | undefined>(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setInv(initial ?? EMPTY_INVESTIGATION);
  }

  const totalChecks = CHECKS.length;
  const completedChecks = useMemo(() => [inv.transactionVerified, inv.customerDataVerified, inv.merchantDataVerified, inv.paymentVerified].filter(Boolean).length, [inv]);
  const progressPct = Math.round((completedChecks / totalChecks) * 100);

  async function save() {
    if (isSaving || readOnly) return;
    setError(null);
    setIsSaving(true);
    try {
      const payload: Investigation = { ...inv, startedAt: inv.startedAt ?? new Date().toISOString() };
      const result = await onSave?.(payload);
      if (result === false) {
        setError("No fue posible guardar la investigación. Intenta nuevamente.");
      }
    } catch {
      setError("Ocurrió un error inesperado al guardar.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section aria-label="Investigación" className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileSearch className="text-blue-300" size={18} aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-100">Investigación</h2>
        </div>
        {!notStarted && (
          <span className={`rounded-lg px-2.5 py-1 text-xs font-medium tabular-nums ${progressPct === 100 ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-800 text-slate-300"}`}>
            {completedChecks}/{totalChecks} verificaciones
          </span>
        )}
      </div>

      {notStarted ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-5 text-sm leading-6 text-slate-400">
          La investigación aún no ha iniciado. Usa <span className="font-medium text-slate-200">“Iniciar investigación”</span> para comenzar a verificar la información del caso.
        </div>
      ) : (
        <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="min-w-0 space-y-4">
            {/* Progreso */}
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium uppercase tracking-wider text-slate-500">Progreso de verificación</span>
                <span className="tabular-nums text-slate-400">{progressPct}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
                <div className={`h-2 rounded-full transition-all ${progressPct === 100 ? "bg-emerald-400" : "bg-blue-400"}`} style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            {/* Checklist */}
            <fieldset disabled={readOnly} className="grid gap-2 sm:grid-cols-2">
              <legend className="sr-only">Verificaciones del caso</legend>
              {CHECKS.map(({ key, group, label }) => {
                const checked = inv[key];
                return (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors ${
                      checked
                        ? "border-emerald-500/25 bg-emerald-500/5"
                        : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                    } ${readOnly ? "cursor-default opacity-70 hover:border-slate-800" : ""}`}
                  >
                    <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${checked ? "border-emerald-400 bg-emerald-400 text-slate-950" : "border-slate-600 bg-slate-800 text-transparent"}`}>
                      <Check size={13} strokeWidth={3} aria-hidden="true" />
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      disabled={readOnly}
                      checked={checked}
                      onChange={(e) => setInv((s) => ({ ...s, [key]: e.target.checked }))}
                    />
                    <span>
                      <span className="block text-xs font-medium uppercase tracking-wider text-slate-500">{group}</span>
                      <span className="mt-0.5 block text-sm leading-5 text-slate-200">{label}</span>
                    </span>
                  </label>
                );
              })}
            </fieldset>

            {/* Hallazgos y conclusión */}
            <div>
              <label htmlFor="inv-findings" className="text-xs font-medium uppercase tracking-wider text-slate-500">Hallazgos de la investigación</label>
              <textarea
                id="inv-findings"
                className="mt-2 min-h-24 w-full rounded-xl border border-slate-700 bg-slate-800/60 p-3 text-sm leading-6 text-slate-200 outline-none transition-colors placeholder:text-slate-500 hover:border-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={readOnly}
                value={inv.findings}
                onChange={(e) => setInv((s) => ({ ...s, findings: e.target.value }))}
                placeholder={readOnly ? "" : "Describe lo encontrado durante la verificación…"}
              />
            </div>
            <div>
              <label htmlFor="inv-conclusion" className="text-xs font-medium uppercase tracking-wider text-slate-500">Conclusión</label>
              <input
                id="inv-conclusion"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800/60 p-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-500 hover:border-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={readOnly}
                value={inv.conclusion}
                onChange={(e) => setInv((s) => ({ ...s, conclusion: e.target.value }))}
                placeholder={readOnly ? "" : "Conclusión preliminar del caso…"}
              />
            </div>

            {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200" role="alert">{error}</p>}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                disabled={readOnly || isSaving}
                onClick={save}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                type="button"
              >
                {isSaving && <LoaderCircle className="animate-spin" size={15} aria-hidden="true" />}
                {isSaving ? "Guardando…" : "Guardar investigación"}
              </button>
              {readOnly
                ? <span className="text-xs text-slate-500">Solo lectura en este estado. Guardar no cambia el estado de la queja.</span>
                : <span className="text-xs text-slate-500">Guardar no cambia el estado de la queja.</span>}
            </div>
          </div>

          {/* Resumen lateral */}
          <aside className="h-fit space-y-2.5 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <Stat label="Fecha de inicio" value={inv.startedAt ? formatDateNormalized(inv.startedAt) : "—"} />
            <div className="border-t border-slate-800/80 pt-2.5">
              <Stat label="Asesor investigador" value={inv.investigator ?? "—"} />
            </div>
            <div className="border-t border-slate-800/80 pt-2.5">
              <p className="text-xs text-slate-500">Verificaciones</p>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-200">
                {CHECKS.map(({ key, group }) => (
                  <li key={key} className="flex items-center gap-2">
                    <Check size={14} aria-hidden="true" className={inv[key] ? "text-emerald-400" : "text-slate-700"} />
                    <span className={inv[key] ? undefined : "text-slate-500"}>{group}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}