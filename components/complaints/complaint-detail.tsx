"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, CalendarDays, CreditCard, LoaderCircle, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { CopyButton } from "@/components/complaints/copy-button";
import { ComplaintPriorityBadge } from "@/components/complaints/complaint-priority-badge";
import { ComplaintProgress } from "@/components/complaints/complaint-progress";
import { ComplaintStateAction } from "@/components/complaints/complaint-state-action";
import { ComplaintStatusBadge } from "@/components/complaints/complaint-status-badge";
import InvestigationSection from "@/components/complaints/investigation-section";
import EvidenceSection from "@/components/complaints/evidence-section";
import MerchantEscalationSection from "@/components/complaints/merchant-escalation-section";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import type { ActionResult } from "@/lib/store";
import { beginComplaintOperation, endComplaintOperation } from "@/lib/store";
import type { Complaint } from "@/types/complaint";
import AdvisorAssignment from "@/components/complaints/advisor-assignment";
import { useComplaintStore } from "@/lib/store";
import ComplaintTimeline from "@/components/complaints/complaint-timeline";
import { formatDateNormalized } from "@/lib/format-date";
import { complaintStatusLabels } from "@/constants/complaints";
import { toast } from "@/lib/toast";
import dynamic from "next/dynamic";
import InternalNotesSection from "@/components/complaints/internal-notes-section";
import styles from "./complaint-detail.module.scss";
const ResolutionSection = dynamic(() => import("@/components/complaints/resolution-section"), { ssr: false });
const moneyFormatter = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
/** Latencia simulada de las operaciones (mock). */
const OP_DELAY = 450;
function delay(ms: number) { return new Promise<void>((resolve) => window.setTimeout(resolve, ms)); }
function displayId(id: string) { return `#${id.replace("Q-", "CL-")}`; }
function InfoRow({ label, children }: { label: string; children: ReactNode }) { return <div><dt className={styles.infoLabel}>{label}</dt><dd className={styles.infoValue}>{children}</dd></div>; }
function TextOrDash({ value }: { value?: string | null }) { return <>{value && value.trim() ? value : <span className={styles.dash}>—</span>}</>; }

const SECTION_LINKS = [
  { id: "resumen", label: "Resumen" },
  { id: "investigacion", label: "Investigación" },
  { id: "seguimiento-merchant", label: "Seguimiento merchant" },
  { id: "evidencias", label: "Evidencias" },
  { id: "notas", label: "Notas" },
  { id: "resolucion", label: "Resolución" },
  { id: "historial", label: "Historial" },
];

/** Ejecuta una operación de negocio simulando latencia, con exclusión por queja y feedback al usuario. */
function useComplaintOperation() {
  return async (complaintId: string, run: () => Promise<ActionResult>, success: { title: string; description?: string }): Promise<ActionResult> => {
    if (!beginComplaintOperation(complaintId)) {
      const busy: ActionResult = { ok: false, error: "BUSY", message: "Hay una operación en curso para esta queja." };
      toast.error("Operación en curso", busy.message);
      return busy;
    }
    try {
      await delay(OP_DELAY);
      const result = await run();
      if (result.ok) toast.success(success.title, success.description);
      else toast.error("La operación no se completó", result.message ?? "Intenta nuevamente.");
      return result;
    } catch {
      const unexpected: ActionResult = { ok: false, error: "MISSING_DATA", message: "Ocurrió un error inesperado." };
      toast.error("Error inesperado", unexpected.message ?? undefined);
      return unexpected;
    } finally {
      endComplaintOperation(complaintId);
    }
  };
}

export function ComplaintDetail({ complaint: initialComplaint }: { complaint: Complaint }) {
  // Get from global store instead of local state
  const complaint = useComplaintStore((s) => s.getComplaintById(initialComplaint.id)) ?? initialComplaint;
  const status = complaint.status;
  const { approveComplaint, rejectComplaint, completeComplaint, updateComplaintStatus, assignComplaint, reassignComplaint, unassignComplaint, updateInvestigation, escalateToMerchant, closeMerchantEscalation, addEvidence, addInternalNote } = useComplaintStore();
  const runOperation = useComplaintOperation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const caseId = displayId(complaint.id);

  /** Transiciones simples (Recibido→Investigando, Investigando→Manejando). */
  const transition = (to: Complaint["status"]): Promise<boolean> =>
    runOperation(
      complaint.id,
      () => updateComplaintStatus(complaint.id, to),
      { title: "Estado actualizado", description: `La queja ahora está en “${complaintStatusLabels[to]}”.` },
    ).then((r) => r.ok);

  async function runPrimaryTransition(to: Complaint["status"]) {
    if (isTransitioning) return;
    setIsTransitioning(true);
    try {
      await transition(to);
    } finally {
      setIsTransitioning(false);
    }
  }

  async function handleApprove(): Promise<boolean> {
    const result = await runOperation(
      complaint.id,
      () => approveComplaint(complaint.id),
      { title: "Queja aprobada", description: "Manejando → Aprobado." },
    );
    return result.ok;
  }

  async function handleReject(reason: string): Promise<boolean> {
    const result = await runOperation(
      complaint.id,
      () => rejectComplaint(complaint.id, reason),
      { title: "Queja rechazada", description: "Manejando → Rechazado." },
    );
    return result.ok;
  }

  async function handleComplete(): Promise<boolean> {
    const result = await runOperation(
      complaint.id,
      () => completeComplaint(complaint.id),
      { title: "Queja completada", description: "El caso quedó cerrado." },
    );
    return result.ok;
  }

  async function handleSaveInvestigation(inv: NonNullable<Complaint["investigation"]>): Promise<boolean> {
    const result = await runOperation(
      complaint.id,
      () => updateInvestigation(complaint.id, inv),
      { title: "Investigación guardada", description: "Los datos se guardaron localmente (mock)." },
    );
    return result.ok;
  }

  async function handleEscalateToMerchant(note: string): Promise<boolean> {
    const result = await runOperation(
      complaint.id,
      () => escalateToMerchant(complaint.id, note),
      { title: "Caso enviado al merchant", description: "Queda en espera de respuesta." },
    );
    return result.ok;
  }

  async function handleCloseMerchantEscalation(response: string): Promise<boolean> {
    const result = await runOperation(
      complaint.id,
      () => closeMerchantEscalation(complaint.id, response),
      { title: "Seguimiento cerrado", description: "El caso volvió a Investigando." },
    );
    return result.ok;
  }

  async function handleAddEvidence(evidence: NonNullable<Complaint["evidences"]>[number]): Promise<boolean> {
    const result = await runOperation(
      complaint.id,
      () => addEvidence(complaint.id, evidence),
      { title: "Evidencia agregada", description: evidence.name },
    );
    return result.ok;
  }

  async function handleAddNote(note: NonNullable<Complaint["notes"]>[number]): Promise<boolean> {
    const result = await runOperation(
      complaint.id,
      () => addInternalNote(complaint.id, note),
      { title: "Nota interna agregada" },
    );
    return result.ok;
  }

  async function handleAssign(advisor: NonNullable<Complaint["assignedAdvisor"]>): Promise<boolean> {
    const result = await runOperation(
      complaint.id,
      () => assignComplaint(complaint.id, advisor),
      { title: "Queja asignada", description: `Asignada a ${advisor.name}.` },
    );
    return result.ok;
  }

  async function handleReassign(advisor: NonNullable<Complaint["assignedAdvisor"]>): Promise<boolean> {
    const result = await runOperation(
      complaint.id,
      () => reassignComplaint(complaint.id, advisor),
      { title: "Asignación actualizada", description: `Reasignada a ${advisor.name}.` },
    );
    return result.ok;
  }

  async function handleUnassign(): Promise<boolean> {
    const result = await runOperation(
      complaint.id,
      () => unassignComplaint(complaint.id),
      { title: "Asignación eliminada", description: "La queja quedó sin asesor asignado." },
    );
    return result.ok;
  }

  // Acción principal según el estado (misma regla de negocio, sin cambios).
  const primaryAction =
    status === "recibido"
      ? { kind: "transition" as const, label: "Iniciar investigación", target: "investigando" as const }
      : status === "investigando"
        ? { kind: "transition" as const, label: "Iniciar manejo", target: "manejando" as const }
        : status === "escalado_merchant"
          ? { kind: "anchor" as const, label: "Ver seguimiento", href: "#seguimiento-merchant" }
          : status === "manejando" || status === "aprobado" || status === "rechazado"
            ? { kind: "anchor" as const, label: status === "manejando" ? "Ir a resolución" : "Completar caso", href: "#resolucion" }
            : null;

  const investigationChecks = complaint.investigation
    ? [complaint.investigation.transactionVerified, complaint.investigation.customerDataVerified, complaint.investigation.merchantDataVerified, complaint.investigation.paymentVerified].filter(Boolean).length
    : 0;

  return (
    <AppShell>
      <PageContainer>
        {/* Miga de pan */}
        <nav aria-label="Miga de pan" className={styles.breadcrumb}>
          <Link className={styles.breadcrumbLink} href="/quejas">Quejas</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{caseId}</span>
        </nav>

        {/* Encabezado operativo */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.headerLeft}>
              <div className={styles.idRow}>
                <span className={styles.idText}>{caseId}</span>
                <CopyButton label="ID de queja" value={complaint.id} />
              </div>
              <h1 className={styles.titleText}>{complaint.complaintType}</h1>
              <div className={styles.badgeRow}>
                <ComplaintStatusBadge status={status} />
                <ComplaintPriorityBadge priority={complaint.priority} />
              </div>
            </div>
            <dl className={styles.metaGrid}>
              <div>
                <dt className={styles.metaLabel}>Creada</dt>
                <dd className={styles.metaValue}>{formatDateNormalized(complaint.createdAt)}</dd>
              </div>
              <div>
                <dt className={styles.metaLabel}>Actualizada</dt>
                <dd className={styles.metaValue}>{formatDateNormalized(complaint.updatedAt)}</dd>
              </div>
            </dl>
          </div>

          {/* Navegación interna por secciones */}
          <nav aria-label="Secciones del caso" className={styles.sectionNav}>
            {SECTION_LINKS.map((link) => (
              <a key={link.id} href={`#${link.id}`} className={styles.sectionNavLink}>
                {link.label}
              </a>
            ))}
          </nav>
        </header>

        {/* Barra de acción principal persistente */}
        {primaryAction && (
          <div className={styles.actionBar}>
            <div className={styles.actionBarInner}>
              <div className={styles.actionBarLeft}>
                <ComplaintStatusBadge status={status} />
                <p className={styles.actionBarHint}>
                  {status === "recibido" && "Lista para iniciar la investigación."}
                  {status === "investigando" && "Investigación en curso."}
                  {status === "escalado_merchant" && "En espera de respuesta del merchant."}
                  {status === "manejando" && "Lista para decisión en Resolución."}
                  {(status === "aprobado" || status === "rechazado") && "Pendiente de completar el caso."}
                </p>
              </div>
              {primaryAction.kind === "transition" ? (
                <button
                  className={styles.actionBarBtn}
                  disabled={isTransitioning}
                  onClick={() => runPrimaryTransition(primaryAction.target)}
                  type="button"
                >
                  {isTransitioning && <LoaderCircle className="animate-spin" size={15} aria-hidden="true" />}
                  {primaryAction.label}
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              ) : (
                <a href={primaryAction.href} className={styles.actionBarBtn}>
                  {primaryAction.label}
                  <ArrowRight size={15} aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        )}

        <div className={styles.progressWrap}>
          <ComplaintProgress status={status} />
        </div>

        <div className={styles.layoutGrid}>
          {/* Columna principal: flujo de trabajo */}
          <div className={styles.mainCol}>
            <ComplaintStateAction onTransition={transition} status={status} />

            <section id="resumen" aria-label="Resumen de la queja" className={`${styles.panel} ${styles.scrollAnchor}`}>
              <h2 className={styles.panelTitle}>Resumen del caso</h2>
              <dl className={styles.infoGrid2}>
                <InfoRow label="Tipo">{complaint.complaintType}</InfoRow>
                <InfoRow label="Merchant">{complaint.merchant}</InfoRow>
                <InfoRow label="Transacción"><span className={styles.txIdInline}>{complaint.transaction.id}<CopyButton label="ID de transacción" value={complaint.transaction.id} /></span></InfoRow>
                <InfoRow label="Valor">{moneyFormatter.format(complaint.transaction.amount)}</InfoRow>
                <div className={styles.fullSpan}>
                  <InfoRow label="Descripción">
                    <p className={styles.description}>{complaint.description}</p>
                  </InfoRow>
                </div>
              </dl>
            </section>

            <div id="investigacion" className={styles.scrollAnchor}>
              <InvestigationSection investigation={complaint.investigation} status={complaint.status} onSave={handleSaveInvestigation} />
            </div>

            <div id="seguimiento-merchant" className={styles.scrollAnchor}>
              <MerchantEscalationSection
                status={complaint.status}
                escalation={complaint.merchantEscalation}
                onEscalate={handleEscalateToMerchant}
                onClose={handleCloseMerchantEscalation}
              />
            </div>

            <div id="evidencias" className={styles.scrollAnchor}>
              <EvidenceSection evidences={complaint.evidences ?? []} status={complaint.status} onAdd={handleAddEvidence} />
            </div>

            <section aria-label="Cliente" className={styles.panel}>
              <div className={styles.panelHeader}><UserRound className={styles.panelIcon} size={18} aria-hidden="true" /><h2 className={styles.panelTitle}>Cliente</h2></div>
              <dl className={styles.infoGrid2}>
                <InfoRow label="Nombre"><TextOrDash value={complaint.customer.name} /></InfoRow>
                <InfoRow label="Documento"><TextOrDash value={complaint.customer.document} /></InfoRow>
                <InfoRow label="Teléfono"><TextOrDash value={complaint.customer.phone} /></InfoRow>
                <InfoRow label="Correo"><TextOrDash value={complaint.customer.email} /></InfoRow>
              </dl>
            </section>

            <section aria-label="Transacción relacionada" className={styles.panel}>
              <div className={styles.panelHeader}><CreditCard className={styles.panelIcon} size={18} aria-hidden="true" /><h2 className={styles.panelTitle}>Transacción relacionada</h2></div>
              <dl className={styles.infoGrid2}>
                <InfoRow label="ID de transacción"><span className={styles.txIdInline}>{complaint.transaction.id}<CopyButton label="ID de transacción" value={complaint.transaction.id} /></span></InfoRow>
                <InfoRow label="Fecha">{formatDateNormalized(complaint.transaction.date)}</InfoRow>
                <InfoRow label="Valor">{moneyFormatter.format(complaint.transaction.amount)}</InfoRow>
                <InfoRow label="Método de pago">{complaint.transaction.paymentMethod}</InfoRow>
                <InfoRow label="Estado de transacción">{complaint.transaction.transactionStatus}</InfoRow>
                <InfoRow label="Merchant">{complaint.merchant}</InfoRow>
              </dl>
            </section>

            <section aria-label="Merchant" className={styles.panel}>
              <div className={styles.panelHeader}><Building2 className={styles.panelIcon} size={18} aria-hidden="true" /><h2 className={styles.panelTitle}>Merchant</h2></div>
              <dl className={styles.infoGrid3}>
                <InfoRow label="Nombre"><TextOrDash value={complaint.merchantInfo.name} /></InfoRow>
                <InfoRow label="Tipo"><TextOrDash value={complaint.merchantInfo.type} /></InfoRow>
                <InfoRow label="Código"><TextOrDash value={complaint.merchantInfo.code} /></InfoRow>
              </dl>
            </section>

            <div id="notas" className={styles.scrollAnchor}>
              <InternalNotesSection
                notes={complaint.notes ?? []}
                status={complaint.status}
                onAdd={handleAddNote}
              />
            </div>

            <div id="resolucion" className={styles.scrollAnchor}>
              <ResolutionSection
                status={complaint.status}
                resolution={complaint.resolution ?? null}
                summary={{
                  customer: complaint.customer.name,
                  complaintType: complaint.complaintType,
                  transactionId: complaint.transaction.id,
                  amount: moneyFormatter.format(complaint.transaction.amount),
                  investigationProgress: complaint.investigation ? `${investigationChecks}/4 verificaciones` : "—",
                  evidencesCount: complaint.evidences ? complaint.evidences.length : 0,
                }}
                onApprove={handleApprove}
                onReject={handleReject}
                onComplete={handleComplete}
              />
            </div>
          </div>

          {/* Panel operativo lateral */}
          <aside className={styles.sidebar} aria-label="Información del caso">
            <h2 className={styles.sidebarTitle}>Información del caso</h2>
            <dl className={styles.sidebarList}>
              <InfoRow label="Estado"><ComplaintStatusBadge status={complaint.status} /></InfoRow>
              <InfoRow label="Prioridad"><ComplaintPriorityBadge priority={complaint.priority} /></InfoRow>
              <InfoRow label="Asignado a">
                <AdvisorAssignment assigned={complaint.assignedAdvisor ?? null} onAssign={handleAssign} onReassign={handleReassign} onUnassign={handleUnassign} />
              </InfoRow>
              <InfoRow label="Fecha de creación"><span className={styles.dateInline}><CalendarDays size={15} aria-hidden="true" />{formatDateNormalized(complaint.createdAt)}</span></InfoRow>
              <InfoRow label="Última actualización">{formatDateNormalized(complaint.updatedAt)}</InfoRow>
            </dl>
            <div className={styles.sidebarFooter}>
              <p className={styles.sidebarFooterLabel}>Próxima acción</p>
              <p className={styles.sidebarFooterText}>
                {status === "recibido" && "Iniciar investigación"}
                {status === "investigando" && "Completar investigación e iniciar manejo"}
                {status === "escalado_merchant" && "Registrar la respuesta del merchant para continuar"}
                {status === "manejando" && "Aprobar o rechazar en Resolución"}
                {(status === "aprobado" || status === "rechazado") && "Completar el caso"}
                {status === "completado" && "Sin acciones pendientes"}
              </p>
            </div>
            <Link className={styles.backLink} href="/quejas"><ArrowLeft size={16} aria-hidden="true" />Volver a quejas</Link>
          </aside>
        </div>

        <div id="historial" className={`${styles.historyWrap} ${styles.scrollAnchor}`}>
          <ComplaintTimeline events={complaint.history ?? []} />
        </div>
      </PageContainer>
    </AppShell>
  );
}
