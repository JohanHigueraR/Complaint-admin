"use client";

import Link from "next/link";
import { ArrowUpRight, SearchX, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { getAvailableActions } from "@/constants/complaint-flow";
import { complaintPriorityLabels, complaintStatusLabels } from "@/constants/complaints";
import type { Complaint, ComplaintPriority, ComplaintStatus } from "@/types/complaint";
import styles from "./complaint-table.module.scss";

const STATUS_CLASS: Record<ComplaintStatus, string> = {
  recibido: styles.statusRecibido,
  investigando: styles.statusInvestigando,
  escalado_merchant: styles.statusEscaladoMerchant,
  manejando: styles.statusManejando,
  aprobado: styles.statusAprobado,
  rechazado: styles.statusRechazado,
  completado: styles.statusCompletado,
};

const PRIORITY_CLASS: Record<ComplaintPriority, string> = {
  alta: styles.priorityAlta,
  media: styles.priorityMedia,
  baja: styles.priorityBaja,
};

function StatusBadge({ status }: { status: ComplaintStatus }) {
  return <span className={`${styles.badge} ${STATUS_CLASS[status]}`}>{complaintStatusLabels[status]}</span>;
}

function PriorityBadge({ priority }: { priority: ComplaintPriority }) {
  return <span className={`${styles.badge} ${PRIORITY_CLASS[priority]}`}>{complaintPriorityLabels[priority]}</span>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Bogota" }).format(new Date(value));
}

function displayId(id: string) {
  return `#${id.replace("Q-", "CL-")}`;
}

/** Siguiente acción disponible según el estado (solo lectura, sin ejecutar). */
function nextActionLabel(complaint: Complaint): string | null {
  const actions = getAvailableActions(complaint.status);
  if (!actions.length) return null;
  return actions.map((a) => a.label).join(" · ");
}

/** Sincroniza el scrollLeft de dos elementos sin generar un loop (asignar el mismo valor no dispara "scroll" de nuevo, pero el flag evita reentradas en navegadores que sí lo hacen). */
function useMirroredHorizontalScroll() {
  const isSyncing = useRef(false);
  return function sync(source: HTMLElement, target: HTMLElement) {
    if (isSyncing.current) return;
    isSyncing.current = true;
    target.scrollLeft = source.scrollLeft;
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  };
}

/** Barra de scroll horizontal flotante, fija al fondo del viewport, para no depender de bajar
 * hasta el final de la tabla (que puede tener muchas filas) para alcanzar su propia barra. */
function useFloatingScrollbar(wrapRef: React.RefObject<HTMLDivElement | null>, rowsKey: number) {
  const [rect, setRect] = useState<{ left: number; width: number } | null>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<{ left: number; width: number } | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let frame: number | null = null;

    function measure() {
      if (!wrap) return;
      const box = wrap.getBoundingClientRect();
      const needsScroll = wrap.scrollWidth > wrap.clientWidth + 1;
      const tableInView = box.top < window.innerHeight && box.bottom > 0;
      const tableBottomVisible = box.bottom <= window.innerHeight;
      const next = needsScroll && tableInView && !tableBottomVisible ? { left: Math.round(box.left), width: Math.round(box.width) } : null;
      const prev = lastRef.current;
      const changed = (prev === null) !== (next === null) || (prev && next && (prev.left !== next.left || prev.width !== next.width));
      if (changed) {
        lastRef.current = next;
        setRect(next);
      }
      if (spacerRef.current) {
        const width = `${wrap.scrollWidth}px`;
        if (spacerRef.current.style.width !== width) spacerRef.current.style.width = width;
      }
    }

    function scheduleMeasure() {
      if (frame != null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        measure();
      });
    }

    // Colapsar/expandir el sidebar (ver lib/sidebar-store.ts) no cambia el tamaño de la
    // tabla, solo su posición horizontal en pantalla — ResizeObserver no se entera de eso.
    // Reaccionamos al atributo que ese toggle deja en <html> y volvemos a medir varias veces
    // mientras dura su transición de ancho (~0.15s, ver sidebar.module.scss) para que la
    // barra flotante siga la animación en vez de saltar de golpe al final.
    function onSidebarAttributeChange() {
      const start = performance.now();
      function tick(now: number) {
        measure();
        if (now - start < 220) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    measure();
    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(wrap);
    const attributeObserver = new MutationObserver(onSidebarAttributeChange);
    attributeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-sidebar"] });
    window.addEventListener("scroll", scheduleMeasure, { passive: true });
    window.addEventListener("resize", scheduleMeasure);
    return () => {
      if (frame != null) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      attributeObserver.disconnect();
      window.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowsKey]);

  return { rect, spacerRef };
}

export function ComplaintTable({ complaints, currentAdvisorId }: { complaints: Complaint[]; currentAdvisorId?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const sync = useMirroredHorizontalScroll();
  const { rect: floatingScrollbarRect, spacerRef } = useFloatingScrollbar(wrapRef, complaints.length);

  if (!complaints.length) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}><SearchX size={20} aria-hidden="true" /></span>
        <h2 className={styles.emptyTitle}>No encontramos quejas</h2>
        <p className={styles.emptyDescription}>No hay quejas que coincidan con los criterios seleccionados. Ajusta la búsqueda o limpia los filtros.</p>
      </div>
    );
  }

  return (
    <>
      {/* Vista desktop: tabla optimizada para lectura rápida */}
      <div
        className={styles.tableWrap}
        onScroll={() => {
          if (wrapRef.current && scrollbarRef.current) sync(wrapRef.current, scrollbarRef.current);
        }}
        ref={wrapRef}
      >
        <table className={styles.table}>
          <thead>
            <tr>
              {["Caso", "Cliente", "Merchant", "Fecha", "Prioridad", "Estado", "Asesor", "Siguiente paso"].map((label) => (
                <th key={label} scope="col">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {complaints.map((complaint) => {
              const isMine = !!complaint.assignedAdvisor && !!currentAdvisorId && complaint.assignedAdvisor.id === currentAdvisorId;
              const next = nextActionLabel(complaint);
              return (
                <tr className={isMine ? styles.rowMine : undefined} key={complaint.id}>
                  <td>
                    <Link className={styles.caseId} href={`/quejas/${complaint.id}`}>{displayId(complaint.id)}</Link>
                    <p className={styles.caseType}>{complaint.complaintType}</p>
                  </td>
                  <td>
                    <p className={styles.customerName}>{complaint.customer.name}</p>
                    <p className={styles.customerTx}>{complaint.transaction.id}</p>
                  </td>
                  <td>{complaint.merchant}</td>
                  <td>{formatDate(complaint.createdAt)}</td>
                  <td><PriorityBadge priority={complaint.priority} /></td>
                  <td><StatusBadge status={complaint.status} /></td>
                  <td>
                    <span className={styles.advisorCell}>
                      {complaint.assignedAdvisor ? (
                        <>
                          {isMine && <UserRound size={13} aria-label="Asignada a ti" />}
                          <span className={isMine ? styles.advisorMine : undefined}>{complaint.assignedAdvisor.name}</span>
                        </>
                      ) : (
                        <span className={styles.advisorNone}>Sin asignar</span>
                      )}
                    </span>
                  </td>
                  <td>
                    {next ? <span className={styles.nextStep}>{next}</span> : <span className={styles.nextStepNone}>Sin acciones</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {floatingScrollbarRect && (
        <div
          aria-hidden="true"
          className={styles.floatingScrollbarBackdrop}
          style={{ left: floatingScrollbarRect.left, width: floatingScrollbarRect.width }}
        />
      )}

      {floatingScrollbarRect && (
        <div
          aria-hidden="true"
          className={styles.floatingScrollbar}
          onScroll={() => {
            if (wrapRef.current && scrollbarRef.current) sync(scrollbarRef.current, wrapRef.current);
          }}
          ref={scrollbarRef}
          style={{ left: floatingScrollbarRect.left, width: floatingScrollbarRect.width }}
        >
          <div className={styles.floatingScrollbarSpacer} ref={spacerRef} />
        </div>
      )}

      {/* Vista móvil/tablet pequeña: tarjetas compactas */}
      <ul className={styles.cards}>
        {complaints.map((complaint) => {
          const isMine = !!complaint.assignedAdvisor && !!currentAdvisorId && complaint.assignedAdvisor.id === currentAdvisorId;
          const next = nextActionLabel(complaint);
          return (
            <li key={complaint.id}>
              <Link href={`/quejas/${complaint.id}`} className={`${styles.card} ${isMine ? styles.cardMine : ""}`}>
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.cardId}>{displayId(complaint.id)}</p>
                    <p className={styles.cardType}>{complaint.complaintType}</p>
                  </div>
                  <StatusBadge status={complaint.status} />
                </div>
                <div className={styles.cardMeta}>
                  <span>{complaint.customer.name}</span>
                  <span className={styles.cardDot} aria-hidden="true">•</span>
                  <span>{complaint.merchant}</span>
                  <span className={styles.cardDot} aria-hidden="true">•</span>
                  <span>{formatDate(complaint.createdAt)}</span>
                </div>
                <div className={styles.cardFooter}>
                  <span className={styles.cardMeta} style={{ marginTop: 0 }}>
                    <PriorityBadge priority={complaint.priority} />
                    <span className={styles.cardDot} aria-hidden="true">·</span>
                    {complaint.assignedAdvisor ? (
                      <>
                        {isMine && <UserRound size={12} aria-label="Asignada a ti" />}
                        <span className={isMine ? styles.advisorMine : undefined}>{complaint.assignedAdvisor.name}</span>
                      </>
                    ) : (
                      <span className={styles.advisorNone}>Sin asignar</span>
                    )}
                  </span>
                  {next ? (
                    <span className={styles.cardNextStep}>{next} <ArrowUpRight size={13} aria-hidden="true" /></span>
                  ) : (
                    <span className={styles.nextStepNone}>Sin acciones</span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
