"use client";

import { useState } from "react";
import { LoaderCircle, MessagesSquare, PlusCircle, X } from "lucide-react";
import { formatDateNormalized } from "@/lib/format-date";
import type { ComplaintNote } from "@/types/complaint";

function NoteItem({ note }: { note: ComplaintNote }) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-500/15 text-xs font-semibold text-violet-300" aria-hidden="true">
          {note.author.trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-100">
            {note.author} <span className="font-normal text-slate-500">· {note.authorRole ?? "Asesora SAC"}</span>
          </p>
          <p className="text-xs tabular-nums text-slate-500">{formatDateNormalized(note.createdAt)}</p>
        </div>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200">{note.content}</p>
    </article>
  );
}

export default function InternalNotesSection({
  notes = [],
  status,
  onAdd,
}: {
  notes?: ComplaintNote[] | null;
  status: string;
  onAdd?: (note: ComplaintNote) => Promise<boolean> | boolean | void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readOnly = ["aprobado", "rechazado", "completado"].includes(status);
  const list = notes ?? [];

  function openAdd() {
    setContent("");
    setError(null);
    setDialogOpen(true);
  }

  /** Cierra el diálogo y limpia el formulario sin modificar datos. */
  function cancel() {
    if (isSaving) return;
    setContent("");
    setError(null);
    setDialogOpen(false);
  }

  async function saveNote() {
    if (isSaving) return;
    const trimmed = content.trim();
    if (!trimmed) {
      setError("La nota no puede estar vacía.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const note: ComplaintNote = { id: `N-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`, complaintId: "", content: trimmed, author: "María Gómez", authorRole: "Asesora SAC", createdAt: now, updatedAt: null };
      const result = await onAdd?.(note);
      if (result === false) {
        setError("No fue posible guardar la nota. Intenta nuevamente.");
        return;
      }
      setContent("");
      setDialogOpen(false);
    } catch {
      setError("Ocurrió un error inesperado al guardar la nota.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section aria-label="Notas internas" className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-800 text-violet-300">
            <MessagesSquare size={17} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Notas internas</h2>
            <p className="text-xs text-slate-500">
              {list.length === 0 ? "Sin notas del equipo" : `${list.length} ${list.length === 1 ? "nota del equipo" : "notas del equipo"}`} · privadas
            </p>
          </div>
        </div>
        {!readOnly && (
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-3.5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
            type="button"
          >
            <PlusCircle size={16} aria-hidden="true" /> Agregar nota
          </button>
        )}
      </div>

      <div className="mt-4">
        {list.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-5 text-sm leading-6 text-slate-400">
            {readOnly
              ? "No hay notas internas registradas en este caso."
              : <>No hay notas internas todavía. Agrega contexto útil para otros asesores que trabajen este caso.</>}
          </div>
        ) : (
          <div className="space-y-2.5">
            {list.map((n) => <NoteItem key={n.id} note={n} />)}
          </div>
        )}
      </div>
      {readOnly && list.length > 0 && (
        <p className="mt-3 text-xs text-slate-500">Solo lectura en este estado.</p>
      )}

      {dialogOpen && (
        <div aria-modal="true" className="fixed inset-0 z-40 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-[2px]" role="dialog">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100">Nueva nota interna</h3>
                <p className="mt-1 text-sm text-slate-400">Visible solo para el equipo. No se comparte con el cliente.</p>
              </div>
              <button aria-label="Cerrar" onClick={cancel} disabled={isSaving} className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300 disabled:opacity-60" type="button"><X size={17} /></button>
            </div>
            <div className="mt-4">
              <label htmlFor="note-content" className="text-xs font-medium uppercase tracking-wider text-slate-500">Nota</label>
              <textarea
                id="note-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSaving}
                placeholder="Ej. Llamé al merchant y confirmó el reverso para mañana…"
                className="mt-2 min-h-32 w-full rounded-xl border border-slate-700 bg-slate-800/60 p-3 text-sm leading-6 text-slate-200 outline-none transition-colors placeholder:text-slate-500 hover:border-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 disabled:opacity-60"
              />
            </div>
            {error && <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200" role="alert">{error}</p>}
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button onClick={cancel} disabled={isSaving} className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-60" type="button">Cancelar</button>
              <button disabled={isSaving || !content.trim()} onClick={saveNote} className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60" type="button">
                {isSaving && <LoaderCircle className="animate-spin" size={15} aria-hidden="true" />}
                {isSaving ? "Guardando…" : "Guardar nota"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}