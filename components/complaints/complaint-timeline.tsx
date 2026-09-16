import { ArrowRight, Building2, Check, CheckCircle2, History, Inbox, MessageSquareReply, Paperclip, Search, StickyNote, UserRound, XCircle } from "lucide-react";
import type { ComplaintHistoryEvent } from "@/types/complaint";
import { formatDateNormalized } from "@/lib/format-date";
import styles from "./complaint-timeline.module.scss";

function Icon({ type }: { type: string }) {
  switch (type) {
    case "received": return <Inbox size={15} className={styles.iconReceived} aria-hidden="true" />;
    case "investigation_started": return <Search size={15} className={styles.iconInvestigation} aria-hidden="true" />;
    case "investigation_updated": return <CheckCircle2 size={15} className={styles.iconInvestigationDone} aria-hidden="true" />;
    case "evidence_added": return <Paperclip size={15} className={styles.iconEvidence} aria-hidden="true" />;
    case "internal_note_added": return <StickyNote size={15} className={styles.iconNote} aria-hidden="true" />;
    case "assignment": return <UserRound size={15} className={styles.iconAssignment} aria-hidden="true" />;
    case "merchant_escalated": return <Building2 size={15} className={styles.iconMerchant} aria-hidden="true" />;
    case "merchant_response_received": return <MessageSquareReply size={15} className={styles.iconMerchant} aria-hidden="true" />;
    case "status_change": return <ArrowRight size={15} className={styles.iconStatus} aria-hidden="true" />;
    case "approved": return <Check size={15} className={styles.iconApproved} aria-hidden="true" />;
    case "rejected": return <XCircle size={15} className={styles.iconRejected} aria-hidden="true" />;
    case "completed": return <CheckCircle2 size={15} className={styles.iconApproved} aria-hidden="true" />;
    default: return <Inbox size={15} className={styles.iconDefault} aria-hidden="true" />;
  }
}

/** Agrupación visual por categoría de evento (no son estados). */
function categoryOf(type: string): string {
  if (type === "received") return "Recepción";
  if (type === "assignment") return "Asignación";
  if (type === "investigation_started" || type === "investigation_updated") return "Investigación";
  if (type === "evidence_added") return "Evidencia";
  if (type === "internal_note_added") return "Nota interna";
  if (type === "merchant_escalated" || type === "merchant_response_received") return "Merchant";
  if (type === "approved" || type === "rejected") return "Resolución";
  if (type === "completed") return "Cierre";
  return "Estado";
}

export default function ComplaintTimeline({ events }: { events?: ComplaintHistoryEvent[] | null }) {
  const list = events ?? [];
  if (list.length === 0) {
    return (
      <section aria-label="Historial" className={styles.section}>
        <div className={styles.header}>
          <span className={styles.icon}><History size={17} aria-hidden="true" /></span>
          <h2 className={styles.title}>Historial</h2>
        </div>
        <p className={styles.empty}>No hay actividad registrada. Las acciones realizadas sobre esta queja aparecerán aquí.</p>
      </section>
    );
  }

  return (
    <section aria-label="Historial" className={styles.section}>
      <div className={styles.headerBetween}>
        <div className={styles.header}>
          <span className={styles.icon}><History size={17} aria-hidden="true" /></span>
          <div>
            <h2 className={styles.title}>Historial</h2>
            <p className={styles.subtitle}>{list.length} {list.length === 1 ? "evento registrado" : "eventos registrados"}</p>
          </div>
        </div>
      </div>
      <ol className={styles.list}>
        {list.map((ev) => (
          <li key={ev.id} className={styles.item}>
            <span className={styles.dot}>
              <Icon type={ev.type} />
            </span>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <p className={styles.eventTitle}>{ev.title}</p>
                <span className={styles.category}>{categoryOf(ev.type)}</span>
              </div>
              {ev.description && <p className={styles.eventDescription}>{ev.description}</p>}
              <p className={styles.meta}>
                <span className={styles.actor}>{ev.actor}</span>
                <span aria-hidden="true"> · </span>
                <span>{formatDateNormalized(ev.createdAt)}</span>
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
