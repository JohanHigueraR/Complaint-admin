"use client";

import { Eye, FileText, File as FileIcon, Image as ImageIcon, LoaderCircle, Paperclip, PlusCircle, X } from "lucide-react";
import { useState } from "react";
import type { Evidence } from "@/types/complaint";
import { formatDateNormalized } from "@/lib/format-date";
import styles from "./evidence-section.module.scss";

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

function IconForType(type: string) {
  const t = (type || "").toLowerCase();
  if (t.includes("image") || t.match(/\.(png|jpg|jpeg|gif)$/)) return <ImageIcon size={18} className={styles.iconImage} aria-hidden="true" />;
  if (t.includes("pdf") || t.endsWith(".pdf")) return <FileText size={18} className={styles.iconPdf} aria-hidden="true" />;
  return <FileIcon size={18} className={styles.iconFile} aria-hidden="true" />;
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
    <section aria-label="Evidencias y soportes" className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.icon}>
            <Paperclip size={17} aria-hidden="true" />
          </span>
          <div>
            <h2 className={styles.title}>Evidencias y soportes</h2>
            <p className={styles.subtitle}>
              {count === 0 ? "Sin archivos asociados" : `${count} ${count === 1 ? "archivo asociado" : "archivos asociados"}`}
            </p>
          </div>
        </div>
        {!readOnly && (
          <button onClick={openAdd} className={styles.addBtn} type="button">
            <PlusCircle size={16} aria-hidden="true" /> Agregar evidencia
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>
          No hay evidencias asociadas a este caso.
          {!readOnly && <> Puedes agregar soportes mientras la queja esté en <span className={styles.emphasis}>Investigación</span>, <span className={styles.emphasis}>Escalado a merchant</span> o <span className={styles.emphasis}>Manejo</span>.</>}
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((ev) => (
            <li key={ev.id} className={styles.item}>
              <div className={styles.itemLeft}>
                <span className={styles.fileIcon}>{IconForType(ev.type)}</span>
                <div>
                  <p className={styles.fileName}>{ev.name}</p>
                  <p className={styles.fileMeta}>{ev.type} · {fmtSize(ev.size)}</p>
                  <p className={styles.fileUploader}>Cargado por {ev.uploadedBy} · {formatDateNormalized(ev.uploadedAt)}</p>
                </div>
              </div>
              <button aria-label={`Ver ${ev.name}`} onClick={() => setPreview(ev)} className={styles.viewBtn} type="button">
                <Eye size={15} aria-hidden="true" /> Ver
              </button>
            </li>
          ))}
        </ul>
      )}
      {readOnly && count > 0 && (
        <p className={styles.readOnlyHint}>Solo lectura en este estado.</p>
      )}

      {preview && (
        <div aria-modal="true" className={styles.overlay} role="dialog">
          <div className={styles.previewDialog}>
            <div className={styles.previewHeader}>
              <div>
                <h3 className={styles.previewName}>{preview.name}</h3>
                <p className={styles.previewMeta}>{preview.type} · {fmtSize(preview.size)}</p>
              </div>
              <button aria-label="Cerrar preview" onClick={() => setPreview(null)} className={styles.closeBtn} type="button"><X size={17} /></button>
            </div>
            {(preview.type || "").includes("image") || preview.name.match(/\.(png|jpg|jpeg|gif)$/i) ? (
              <div className={styles.previewBody}>[Imagen de ejemplo]</div>
            ) : (preview.type || "").includes("pdf") || preview.name.endsWith(".pdf") ? (
              <div className={styles.previewBody}>[Previsualización de documento]</div>
            ) : (
              <div className={styles.previewFallback}>Previsualización no disponible en este prototipo.</div>
            )}
            {preview.description && <p className={styles.previewDescription}>{preview.description}</p>}
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
    <div aria-modal="true" className={styles.overlay} role="dialog">
      <div className={styles.dialog}>
        <div className={styles.dialogHeader}>
          <div>
            <h3 className={styles.dialogTitle}>Agregar evidencia</h3>
            <p className={styles.dialogDescription}>Sube un archivo para adjuntarlo a la queja (mock).</p>
          </div>
          <button aria-label="Cerrar" onClick={cancel} disabled={isAdding} className={styles.closeBtn} type="button"><X size={17} /></button>
        </div>
        <div className={styles.field}>
          <label htmlFor="ev-file" className={styles.label}>Archivo</label>
          <input id="ev-file" onChange={(e) => setSelected(e.target.files?.[0] ?? null)} disabled={isAdding} className={styles.fileInput} type="file" />
          {selected && <p className={styles.selectedFile}>{selected.name}</p>}
        </div>
        <div className={styles.field}>
          <label htmlFor="ev-desc" className={styles.label}>Descripción (opcional)</label>
          <input id="ev-desc" value={desc} onChange={(e) => setDesc(e.target.value)} disabled={isAdding} placeholder="Ej. Comprobante enviado por el cliente…" className={styles.textInput} />
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.dialogActions}>
          <button onClick={cancel} disabled={isAdding} className={styles.cancelBtn} type="button">Cancelar</button>
          <button disabled={isAdding} onClick={submit} className={styles.submitBtn} type="button">
            {isAdding && <LoaderCircle className="animate-spin" size={15} aria-hidden="true" />}
            {isAdding ? "Agregando…" : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}
