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
const ResolutionSection = dynamic(() => import("@/components/complaints/resolution-section"), { ssr: false });
const moneyFormatter = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
/** Latencia simulada de las operaciones (mock). */
const OP_DELAY = 450;
function delay(ms: number) { return new Promise<void>((resolve) => window.setTimeout(resolve, ms)); }
function displayId(id: string) { return `#${id.replace("Q-", "CL-")}`; }
function InfoRow({ label, children }: { label: string; children: ReactNode }) { return <div><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 text-sm text-slate-200">{children}</dd></div>; }
function TextOrDash({ value }: { value?: string | null }) { return <>{value && value.trim() ? value : <span className="text-slate-500">—</span>}</>; }

const SECTION_LINKS = [
  { id: "resumen", label: "Resumen" },
  { id: "investigacion", label: "Investigación" },
  { id: "evidencias", label: "Evidencias" },
  { id: "notas", label: "Notas" },
  { id: "resolucion", label: "Resolución" },
  { id: "historial", label: "Historial" },
];

/** Ejecuta una operación de negocio simulando latencia, con exclusión por queja y feedback al usuario. */
function useComplaintOperation() {
  return async (complaintId: string, run: () => ActionResult, success: { title: string; description?: string }): Promise<ActionResult> => {
    if (!beginComplaintOperation(complaintId)) {
      const busy: ActionResult = { ok: false, error: "BUSY", message: "Hay una operación en curso para esta queja." };
      toast.error("Operación en curso", busy.message);
      return busy;
    }
    try {
      await delay(OP_DELAY);
      const result = run();
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
  const { approveComplaint, rejectComplaint, completeComplaint, updateComplaintStatus, assignComplaint, reassignComplaint, unassignComplaint, updateInvestigation, addEvidence, addInternalNote } = useComplaintStore();
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
        <nav aria-label="Miga de pan" className="flex items-center gap-2 text-sm">
          <Link className="rounded text-blue-300 hover:text-blue-200 focus-visible:outline-2 focus-visible:outline-blue-400" href="/quejas">Quejas</Link>
          <span className="text-slate-600">/</span>
          <span className="font-mono text-slate-400">{caseId}</span>
        </nav>

        {/* Encabezado operativo */}
        <header className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-lg font-semibold text-slate-100">{caseId}</span>
                <CopyButton label="ID de queja" value={complaint.id} />
              </div>
              <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-100 sm:text-2xl">{complaint.complaintType}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <ComplaintStatusBadge status={status} />
                <ComplaintPriorityBadge priority={complaint.priority} />
              </div>
            </div>
            <dl className="grid shrink-0 grid-cols-2 gap-x-8 gap-y-3 text-right sm:text-left">
              <div>
                <dt className="text-xs text-slate-500">Creada</dt>
                <dd className="mt-0.5 text-xs tabular-nums text-slate-300">{formatDateNormalized(complaint.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Actualizada</dt>
                <dd className="mt-0.5 text-xs tabular-nums text-slate-300">{formatDateNormalized(complaint.updatedAt)}</dd>
              </div>
            </dl>
          </div>

          {/* Navegación interna por secciones */}
          <nav aria-label="Secciones del caso" className="mt-5 flex gap-1.5 overflow-x-auto border-t border-slate-800/80 pt-3.5">
            {SECTION_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-blue-400"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </header>

        {/* Barra de acción principal persistente */}
        {primaryAction && (
          <div className="sticky top-0 z-20 -mx-1 mt-3 px-1 py-2">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-700/80 bg-slate-900/95 px-4 py-2.5 shadow-lg shadow-black/30 backdrop-blur">
              <div className="flex min-w-0 items-center gap-2.5">
                <ComplaintStatusBadge status={status} />
                <p className="hidden truncate text-xs text-slate-400 sm:block">
                  {status === "recibido" && "Lista para iniciar la investigación."}
                  {status === "investigando" && "Investigación en curso."}
                  {status === "manejando" && "Lista para decisión en Resolución."}
                  {(status === "aprobado" || status === "rechazado") && "Pendiente de completar el caso."}
                </p>
              </div>
              {primaryAction.kind === "transition" ? (
                <button
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                  disabled={isTransitioning}
                  onClick={() => runPrimaryTransition(primaryAction.target)}
                  type="button"
                >
                  {isTransitioning && <LoaderCircle className="animate-spin" size={15} aria-hidden="true" />}
                  {primaryAction.label}
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              ) : (
                <a
                  href={primaryAction.href}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                >
                  {primaryAction.label}
                  <ArrowRight size={15} aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        )}

        <div className="mt-4">
          <ComplaintProgress status={status} />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {/* Columna principal: flujo de trabajo */}
          <div className="min-w-0 space-y-5">
            <ComplaintStateAction onTransition={transition} status={status} />

            <section id="resumen" aria-label="Resumen de la queja" className="scroll-mt-32 rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
              <h2 className="text-base font-semibold text-slate-100">Resumen del caso</h2>
              <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <InfoRow label="Tipo">{complaint.complaintType}</InfoRow>
                <InfoRow label="Merchant">{complaint.merchant}</InfoRow>
                <InfoRow label="Transacción"><span className="inline-flex items-center gap-1.5 font-mono text-blue-300">{complaint.transaction.id}<CopyButton label="ID de transacción" value={complaint.transaction.id} /></span></InfoRow>
                <InfoRow label="Valor">{moneyFormatter.format(complaint.transaction.amount)}</InfoRow>
                <div className="sm:col-span-2">
                  <InfoRow label="Descripción">
                    <p className="max-w-3xl leading-6 text-slate-300">{complaint.description}</p>
                  </InfoRow>
                </div>
              </dl>
            </section>

            <div id="investigacion" className="scroll-mt-32">
              <InvestigationSection investigation={complaint.investigation} status={complaint.status} onSave={handleSaveInvestigation} />
            </div>

            <div id="evidencias" className="scroll-mt-32">
              <EvidenceSection evidences={complaint.evidences ?? []} status={complaint.status} onAdd={handleAddEvidence} />
            </div>

            <section aria-label="Cliente" className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
              <div className="flex items-center gap-2"><UserRound className="text-blue-300" size={18} aria-hidden="true" /><h2 className="text-base font-semibold text-slate-100">Cliente</h2></div>
              <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <InfoRow label="Nombre"><TextOrDash value={complaint.customer.name} /></InfoRow>
                <InfoRow label="Documento"><TextOrDash value={complaint.customer.document} /></InfoRow>
                <InfoRow label="Teléfono"><TextOrDash value={complaint.customer.phone} /></InfoRow>
                <InfoRow label="Correo"><TextOrDash value={complaint.customer.email} /></InfoRow>
              </dl>
            </section>

            <section aria-label="Transacción relacionada" className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
              <div className="flex items-center gap-2"><CreditCard className="text-blue-300" size={18} aria-hidden="true" /><h2 className="text-base font-semibold text-slate-100">Transacción relacionada</h2></div>
              <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <InfoRow label="ID de transacción"><span className="inline-flex items-center gap-1.5 font-mono text-blue-300">{complaint.transaction.id}<CopyButton label="ID de transacción" value={complaint.transaction.id} /></span></InfoRow>
                <InfoRow label="Fecha">{formatDateNormalized(complaint.transaction.date)}</InfoRow>
                <InfoRow label="Valor">{moneyFormatter.format(complaint.transaction.amount)}</InfoRow>
                <InfoRow label="Método de pago">{complaint.transaction.paymentMethod}</InfoRow>
                <InfoRow label="Estado de transacción">{complaint.transaction.transactionStatus}</InfoRow>
                <InfoRow label="Merchant">{complaint.merchant}</InfoRow>
              </dl>
            </section>

            <section aria-label="Merchant" className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
              <div className="flex items-center gap-2"><Building2 className="text-blue-300" size={18} aria-hidden="true" /><h2 className="text-base font-semibold text-slate-100">Merchant</h2></div>
              <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-3">
                <InfoRow label="Nombre"><TextOrDash value={complaint.merchantInfo.name} /></InfoRow>
                <InfoRow label="Tipo"><TextOrDash value={complaint.merchantInfo.type} /></InfoRow>
                <InfoRow label="Código"><TextOrDash value={complaint.merchantInfo.code} /></InfoRow>
              </dl>
            </section>

            <div id="notas" className="scroll-mt-32">
              <InternalNotesSection
                notes={complaint.notes ?? []}
                status={complaint.status}
                onAdd={handleAddNote}
              />
            </div>

            <div id="resolucion" className="scroll-mt-32">
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
          <aside className="h-fit rounded-xl border border-slate-800 bg-slate-900 p-5 lg:sticky lg:top-24" aria-label="Información del caso">
            <h2 className="text-base font-semibold text-slate-100">Información del caso</h2>
            <dl className="mt-4 space-y-4">
              <InfoRow label="Estado"><ComplaintStatusBadge status={complaint.status} /></InfoRow>
              <InfoRow label="Prioridad"><ComplaintPriorityBadge priority={complaint.priority} /></InfoRow>
              <InfoRow label="Asignado a">
                <AdvisorAssignment assigned={complaint.assignedAdvisor ?? null} onAssign={handleAssign} onReassign={handleReassign} onUnassign={handleUnassign} />
              </InfoRow>
              <InfoRow label="Fecha de creación"><span className="inline-flex items-center gap-2"><CalendarDays className="text-slate-500" size={15} aria-hidden="true" />{formatDateNormalized(complaint.createdAt)}</span></InfoRow>
              <InfoRow label="Última actualización">{formatDateNormalized(complaint.updatedAt)}</InfoRow>
            </dl>
            <div className="mt-5 border-t border-slate-800 pt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Próxima acción</p>
              <p className="mt-1.5 text-sm text-slate-300">
                {status === "recibido" && "Iniciar investigación"}
                {status === "investigando" && "Completar investigación e iniciar manejo"}
                {status === "manejando" && "Aprobar o rechazar en Resolución"}
                {(status === "aprobado" || status === "rechazado") && "Completar el caso"}
                {status === "completado" && "Sin acciones pendientes"}
              </p>
            </div>
            <Link className="mt-5 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-blue-300 hover:text-blue-200 focus-visible:outline-2 focus-visible:outline-blue-400" href="/quejas"><ArrowLeft size={16} aria-hidden="true" />Volver a quejas</Link>
          </aside>
        </div>

        <div id="historial" className="mt-5 scroll-mt-32">
          <ComplaintTimeline events={complaint.history ?? []} />
        </div>
      </PageContainer>
    </AppShell>
  );
}