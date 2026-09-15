"use client";

import { Eye, FileText, File as FileIcon, Image as ImageIcon, LoaderCircle, Paperclip, PlusCircle, X } from "lucide-react";
import { useState } from "react";
import type { Evidence } from "@/types/complaint";
import { formatDateNormalized } from "@/lib/format-date";

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

function IconForType(type: string) {
  const t = (type || "").toLowerCase();
  if (t.includes("image") || t.match(/\.(png|jpg|jpeg|gif)$/)) return <ImageIcon size={18} className="text-blue-300" aria-hidden="true" />;
  if (t.includes("pdf") || t.endsWith(".pdf")) return <FileText size={18} className="text-amber-300" aria-hidden="true" />;
  return <FileIcon size={18} className="text-slate-400" aria-hidden="true" />;
}

export default function EvidenceSection({
  evidences = [],
  status,
  onAdd,
}: {
  evidences?: Evidence[] | null;
  status: string;
  onAdd?: (e: Evidence) => Promise<boolean> | boolean | void;
}) {
  const readOnly = !["investigando", "manejando", "escalado_merchant"].includes(status);
  const [preview, setPreview] = useState<Evidence | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const items = evidences ?? [];
  const count = items.length;

  function openAdd() {
    setDialogOpen(true);
  }

  /** Cierra el diálogo de alta sin modificar datos. */
  function closeAdd() {
    setDialogOpen(false);
  }

  return (
    <section aria-label="Evidencias y soportes" className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-800 text-blue-300">
            <Paperclip size={17} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Evidencias y soportes</h2>
            <p className="text-xs text-slate-500">
              {count === 0 ? "Sin archivos asociados" : `${count} ${count === 1 ? "archivo asociado" : "archivos asociados"}`}
            </p>
          </div>
        </div>
        {!readOnly && (
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-3.5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
            type="button"
          >
            <PlusCircle size={16} aria-hidden="true" /> Agregar evidencia
          </button>
        )}
      </div>

      <div className="mt-4">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-5 text-sm leading-6 text-slate-400">
            No hay evidencias asociadas a este caso.
            {!readOnly && <> Puedes agregar soportes mientras la queja esté en <span className="font-medium text-slate-200">Investigación</span>, <span className="font-medium text-slate-200">Escalado a merchant</span> o <span className="font-medium text-slate-200">Manejo</span>.</>}
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((ev) => (
              <li key={ev.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3 transition-colors hover:border-slate-700">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-800">{IconForType(ev.type)}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-100">{ev.name}</p>
                    <p className="mt-0.5 text-xs tabular-nums text-slate-500">{ev.type} · {fmtSize(ev.size)}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">Cargado por {ev.uploadedBy} · {formatDateNormalized(ev.uploadedAt)}</p>
                  </div>
                </div>
                <button
                  aria-label={`Ver ${ev.name}`}
                  onClick={() => setPreview(ev)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-blue-300 transition-colors hover:bg-slate-800 hover:text-blue-200 focus-visible:outline-2 focus-visible:outline-blue-400"
                  type="button"
                >
                  <Eye size={15} aria-hidden="true" /> Ver
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {readOnly && count > 0 && (
        <p className="mt-3 text-xs text-slate-500">Solo lectura en este estado.</p>
      )}

      {preview && (
        <div aria-modal="true" className="fixed inset-0 z-40 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-[2px]" role="dialog">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-slate-100">{preview.name}</h3>
                <p className="mt-1 text-sm tabular-nums text-slate-400">{preview.type} · {fmtSize(preview.size)}</p>
              </div>
              <button aria-label="Cerrar preview" onClick={() => setPreview(null)} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300" type="button"><X size={17} /></button>
            </div>
            <div className="mt-4">
              {(preview.type || "").includes("image") || preview.name.match(/\.(png|jpg|jpeg|gif)$/i) ? (
                <div className="grid h-64 w-full place-items-center rounded-xl bg-slate-800 text-sm text-slate-500">[Imagen de ejemplo]</div>
              ) : (preview.type || "").includes("pdf") || preview.name.endsWith(".pdf") ? (
                <div className="grid h-64 w-full place-items-center rounded-xl bg-slate-800 text-sm text-slate-500">[Previsualización de documento]</div>
              ) : (
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-400">Previsualización no disponible en este prototipo.</div>
              )}
            </div>
            {preview.description && <p className="mt-4 text-sm leading-6 text-slate-400">{preview.description}</p>}
          </div>
        </div>
      )}

      {dialogOpen && (
        <AddEvidenceDialog onClose={closeAdd} onAdd={onAdd} />
      )}
    </section>
  );
}

function AddEvidenceDialog({ onClose, onAdd }: { onClose: () => void; onAdd?: (e: Evidence) => Promise<boolean> | boolean | void }) {
  const [desc, setDesc] = useState("");
  const [selected, setSelected] = useState<File | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Restablece y cierra sin tocar el estado global. */
  function cancel() {
    if (isAdding) return;
    setDesc("");
    setSelected(null);
    setError(null);
    onClose();
  }

  async function submit() {
    if (isAdding) return;
    if (!selected && !desc.trim()) {
      setError("Selecciona un archivo o describe la evidencia para continuar.");
      return;
    }
    setError(null);
    setIsAdding(true);
    try {
      const id = `E-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      const name = selected?.name ?? `Documento_${id}.bin`;
      const type = selected?.type || (name.includes(".") ? name.split(".").pop()! : "application/octet-stream");
      const size = selected?.size ?? 24_800;
      const evidence: Evidence = { id, name, type, size, uploadedAt: new Date().toISOString(), uploadedBy: "María Gómez", description: desc.trim() || undefined };
      const result = await onAdd?.(evidence);
      if (result === false) {
        setError("No fue posible agregar la evidencia. Intenta nuevamente.");
        return;
      }
      // Solo cerramos y limpiamos cuando la operación fue exitosa.
      setDesc("");
      setSelected(null);
      onClose();
    } catch {
      setError("Ocurrió un error inesperado al agregar la evidencia.");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div aria-modal="true" className="fixed inset-0 z-40 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-[2px]" role="dialog">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Agregar evidencia</h3>
            <p className="mt-1 text-sm text-slate-400">Sube un archivo para adjuntarlo a la queja (mock).</p>
          </div>
          <button aria-label="Cerrar" onClick={cancel} disabled={isAdding} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300 disabled:opacity-60" type="button"><X size={17} /></button>
        </div>
        <div className="mt-4">
          <label htmlFor="ev-file" className="text-xs font-medium uppercase tracking-wider text-slate-500">Archivo</label>
          <input id="ev-file" onChange={(e) => setSelected(e.target.files?.[0] ?? null)} disabled={isAdding} className="mt-2 w-full rounded-xl border border-dashed border-slate-700 bg-slate-800/40 p-2.5 text-sm text-slate-200 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-200 disabled:opacity-60" type="file" />
          {selected && <p className="mt-1.5 truncate text-xs text-slate-400">{selected.name}</p>}
        </div>
        <div className="mt-4">
          <label htmlFor="ev-desc" className="text-xs font-medium uppercase tracking-wider text-slate-500">Descripción <span className="normal-case text-slate-600">(opcional)</span></label>
          <input id="ev-desc" value={desc} onChange={(e) => setDesc(e.target.value)} disabled={isAdding} placeholder="Ej. Comprobante enviado por el cliente…" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800/60 p-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-500 hover:border-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 disabled:opacity-60" />
        </div>
        {error && <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200" role="alert">{error}</p>}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button onClick={cancel} disabled={isAdding} className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-60" type="button">Cancelar</button>
          <button disabled={isAdding} onClick={submit} className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-400 disabled:opacity-60" type="button">
            {isAdding && <LoaderCircle className="animate-spin" size={15} aria-hidden="true" />}
            {isAdding ? "Agregando…" : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}