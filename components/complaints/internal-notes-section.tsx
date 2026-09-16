"use client";

import { useState } from "react";
import { LoaderCircle, MessagesSquare, PlusCircle, X } from "lucide-react";
import { formatDateNormalized } from "@/lib/format-date";
import type { ComplaintNote } from "@/types/complaint";
import styles from "./internal-notes-section.module.scss";

function NoteItem({ note }: { note: ComplaintNote }) {
  return (
    <article className={styles.note}>
      <div className={styles.noteHeader}>
        <span className={styles.avatar} aria-hidden="true">
          {note.author.trim().charAt(0).toUpperCase()}
        </span>
        <div className={styles.noteAuthorLine}>
          <p className={styles.noteAuthor}>
            {note.author} <span className={styles.noteRole}>· {note.authorRole ?? "Asesora SAC"}</span>
          </p>
          <p className={styles.noteDate}>{formatDateNormalized(note.createdAt)}</p>
        </div>
      </div>
      <p className={styles.noteContent}>{note.content}</p>
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
    <section aria-label="Notas internas" className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.icon}>
            <MessagesSquare size={17} aria-hidden="true" />
          </span>
          <div>
            <h2 className={styles.title}>Notas internas</h2>
            <p className={styles.subtitle}>
              {list.length === 0 ? "Sin notas del equipo" : `${list.length} ${list.length === 1 ? "nota del equipo" : "notas del equipo"}`} · privadas
            </p>
          </div>
        </div>
        {!readOnly && (
          <button onClick={openAdd} className={styles.addBtn} type="button">
            <PlusCircle size={16} aria-hidden="true" /> Agregar nota
          </button>
        )}
      </div>

      <div className={styles.body}>
        {list.length === 0 ? (
          <div className={styles.empty}>
            {readOnly
              ? "No hay notas internas registradas en este caso."
              : <>No hay notas internas todavía. Agrega contexto útil para otros asesores que trabajen este caso.</>}
          </div>
        ) : (
          <div className={styles.list}>
            {list.map((n) => <NoteItem key={n.id} note={n} />)}
          </div>
        )}
      </div>
      {readOnly && list.length > 0 && (
        <p className={styles.readOnlyHint}>Solo lectura en este estado.</p>
      )}

      {dialogOpen && (
        <div aria-modal="true" className={styles.overlay} role="dialog">
          <div className={styles.dialog}>
            <div className={styles.dialogHeader}>
              <div>
                <h3 className={styles.dialogTitle}>Nueva nota interna</h3>
                <p className={styles.dialogDescription}>Visible solo para el equipo. No se comparte con el cliente.</p>
              </div>
              <button aria-label="Cerrar" onClick={cancel} disabled={isSaving} className={styles.closeBtn} type="button"><X size={17} /></button>
            </div>
            <div className={styles.field}>
              <label htmlFor="note-content" className={styles.label}>Nota</label>
              <textarea
                id="note-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSaving}
                placeholder="Ej. Llamé al merchant y confirmó el reverso para mañana…"
                className={styles.textarea}
              />
            </div>
            {error && <p className={styles.error} role="alert">{error}</p>}
            <div className={styles.dialogActions}>
              <button onClick={cancel} disabled={isSaving} className={styles.cancelBtn} type="button">Cancelar</button>
              <button disabled={isSaving || !content.trim()} onClick={saveNote} className={styles.submitBtn} type="button">
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
