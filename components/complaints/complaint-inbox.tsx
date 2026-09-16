"use client";

import { CheckCircle2, ClipboardList, Clock3, Search, UserRound, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

import { ComplaintFilterPanel } from "@/components/complaints/complaint-filter-panel";
import { ComplaintTable } from "@/components/complaints/complaint-table";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { sortOptions, type SortOption } from "@/constants/complaint-options";
import { complaintPriorityLabels, complaintStatusLabels } from "@/constants/complaints";
import { emptyComplaintFilters, filterComplaints, getComplaintFilterOptions, getComplaintSummary, sortComplaints, type ComplaintFilters, type ComplaintView } from "@/lib/complaint-list";
import { useComplaintStore } from "@/lib/store";
import type { ComplaintPriority, ComplaintStatus } from "@/types/complaint";
import styles from "./complaint-inbox.module.scss";

const tabs: { label: string; view: ComplaintView; href: string }[] = [{ label: "Todas", view: "all", href: "/quejas" }, { label: "Mis quejas", view: "mine", href: "/quejas/mis" }, { label: "Pendientes", view: "pending", href: "/quejas/pendientes" }, { label: "Completadas", view: "completed", href: "/quejas/completadas" }];

function getView(pathname: string): ComplaintView { return pathname.endsWith("/mis") ? "mine" : pathname.endsWith("/pendientes") ? "pending" : pathname.endsWith("/completadas") ? "completed" : "all"; }
function values(param: string | null) { return param ? param.split(",").filter(Boolean) : []; }

function parseFilters(searchParams: URLSearchParams): ComplaintFilters {
  return { ...emptyComplaintFilters, query: searchParams.get("q") ?? "", statuses: values(searchParams.get("status")) as ComplaintStatus[], priorities: values(searchParams.get("priority")) as ComplaintPriority[], advisors: values(searchParams.get("advisor")), merchants: values(searchParams.get("merchant")), types: values(searchParams.get("type")), date: (searchParams.get("date") as ComplaintFilters["date"]) || "all", startDate: searchParams.get("start") ?? "", endDate: searchParams.get("end") ?? "" };
}

function activeFilterCount(filters: ComplaintFilters) { return filters.statuses.length + filters.priorities.length + filters.advisors.length + filters.merchants.length + filters.types.length + (filters.date === "all" ? 0 : 1); }

/** Fallback mostrado mientras se resuelve la lectura de parámetros de búsqueda. */
function ComplaintInboxFallback() {
  return (
    <AppShell>
      <PageContainer>
        <div aria-busy="true" className={`${styles.page} ${styles.skeleton}`}>
          <div style={{ height: "2rem", width: "10rem" }} />
          <div style={{ height: "5rem" }} />
          <div style={{ height: "16rem" }} />
        </div>
      </PageContainer>
    </AppShell>
  );
}

export function ComplaintInbox() {
  return (
    <Suspense fallback={<ComplaintInboxFallback />}>
      <ComplaintInboxContent />
    </Suspense>
  );
}

function ComplaintInboxContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeView = getView(pathname);
  const filters = parseFilters(searchParams);
  const sort = (searchParams.get("sort") as SortOption) || "recent";

  // Get from global store
  const complaints = useComplaintStore((s) => s.complaints);
  const currentAdvisor = useComplaintStore((s) => s.currentAdvisor);

  const options = useMemo(() => getComplaintFilterOptions(complaints), [complaints]);
  const summary = useMemo(() => getComplaintSummary(complaints, currentAdvisor.id), [complaints, currentAdvisor]);
  const results = useMemo(() => sortComplaints(filterComplaints(complaints, activeView, filters, currentAdvisor.id), sort), [activeView, filters, sort, complaints, currentAdvisor]);
  const hasActiveFilters = activeFilterCount(filters) > 0;

  const updateParams = (changes: Record<string, string | null>, nextPathname = pathname) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => value ? params.set(key, value) : params.delete(key));
    const query = params.toString();
    router.replace(query ? `${nextPathname}?${query}` : nextPathname);
  };
  const applyFilters = (next: ComplaintFilters) => updateParams({ q: next.query || null, status: next.statuses.join(",") || null, priority: next.priorities.join(",") || null, advisor: next.advisors.join(",") || null, merchant: next.merchants.join(",") || null, type: next.types.join(",") || null, date: next.date === "all" ? null : next.date, start: next.startDate || null, end: next.endDate || null });
  const clearFilters = () => updateParams({ status: null, priority: null, advisor: null, merchant: null, type: null, date: null, start: null, end: null });
  const removeValue = (key: "status" | "priority" | "advisor" | "merchant" | "type", value: string) => updateParams({ [key]: values(searchParams.get(key)).filter((item) => item !== value).join(",") || null });

  const chips = [
    ...filters.statuses.map((value) => ({ key: "status" as const, value, label: complaintStatusLabels[value] })),
    ...filters.priorities.map((value) => ({ key: "priority" as const, value, label: complaintPriorityLabels[value] })),
    ...filters.advisors.map((value) => ({ key: "advisor" as const, value, label: value })),
    ...filters.merchants.map((value) => ({ key: "merchant" as const, value, label: value })),
    ...filters.types.map((value) => ({ key: "type" as const, value, label: value })),
  ];

  const statCards = [
    { label: "Total", value: summary.total, view: "all" as ComplaintView, href: "/quejas", icon: ClipboardList },
    { label: "Mis quejas", value: summary.mine, view: "mine" as ComplaintView, href: "/quejas/mis", icon: UserRound },
    { label: "Pendientes", value: summary.pending, view: "pending" as ComplaintView, href: "/quejas/pendientes", icon: Clock3 },
    { label: "Completadas", value: summary.completed, view: "completed" as ComplaintView, href: "/quejas/completadas", icon: CheckCircle2 },
  ];

  return (
    <AppShell>
      <PageContainer>
        <div className={styles.page}>
          {/* Encabezado de la sección */}
          <div className={styles.header}>
            <div>
              <p className={styles.eyebrow}>Centro de trabajo</p>
              <h1 className={styles.title}>Quejas</h1>
              <p className={styles.subtitle}>
                {activeView === "mine"
                  ? `Casos asignados a ${currentAdvisor.name}. Prioriza por estado y prioridad.`
                  : "Gestiona y da seguimiento a las quejas recibidas."}
              </p>
            </div>
          </div>

          {/* Resumen operativo: compacto, clicable, sincronizado con el store */}
          <div className={styles.stats} role="group" aria-label="Resumen operativo">
            {statCards.map(({ label, value, view, href, icon: Icon }) => {
              const isActive = activeView === view;
              return (
                <button
                  key={label}
                  onClick={() => updateParams({}, href)}
                  aria-current={isActive ? "page" : undefined}
                  type="button"
                  className={`${styles.statCard} ${isActive ? styles.statCardActive : ""}`}
                >
                  <span className={styles.statIcon}>
                    <Icon size={17} aria-hidden="true" />
                  </span>
                  <span className={styles.statBody}>
                    <span className={styles.statValue}>{value}</span>
                    <span className={styles.statLabel}>{label}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Vistas de trabajo */}
          <div aria-label="Vistas de quejas" className={styles.tabs} role="tablist">
            {tabs.map((tab) => {
              const count = tab.view === "all" ? summary.total : tab.view === "mine" ? summary.mine : tab.view === "pending" ? summary.pending : summary.completed;
              const isActive = activeView === tab.view;
              return (
                <button
                  aria-selected={isActive}
                  className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
                  key={tab.view}
                  onClick={() => updateParams({}, tab.href)}
                  role="tab"
                  type="button"
                >
                  {tab.label}
                  <span className={`${styles.tabCount} ${isActive ? styles.tabCountActive : ""}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Búsqueda + filtros + orden */}
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <Search aria-hidden="true" className={styles.searchIcon} size={18} />
              <input
                className={styles.searchInput}
                onChange={(event) => updateParams({ q: event.target.value || null })}
                placeholder="Buscar por ID, cliente o transacción…"
                type="search"
                value={filters.query}
                aria-label="Buscar quejas"
              />
              {filters.query && (
                <button
                  aria-label="Limpiar búsqueda"
                  className={styles.searchClear}
                  onClick={() => updateParams({ q: null })}
                  type="button"
                >
                  <X size={15} />
                </button>
              )}
            </div>
            <div className={styles.toolbarActions}>
              <ComplaintFilterPanel activeCount={activeFilterCount(filters)} advisors={options.advisors} filters={filters} merchants={options.merchants} onApply={applyFilters} onClear={clearFilters} />
              <select
                aria-label="Ordenar resultados"
                className={styles.sortSelect}
                onChange={(event) => updateParams({ sort: event.target.value === "recent" ? null : event.target.value })}
                value={sort}
              >
                {sortOptions.map((option) => <option key={option.value} value={option.value}>Ordenar: {option.label}</option>)}
              </select>
            </div>
          </div>

          {/* Filtros activos */}
          {hasActiveFilters && (
            <div className={styles.chips}>
              <span className={styles.chipsLabel}>Filtros activos:</span>
              {chips.map((chip) => (
                <button
                  className={styles.chip}
                  key={`${chip.key}-${chip.value}`}
                  onClick={() => removeValue(chip.key, chip.value)}
                  type="button"
                  title="Quitar filtro"
                >
                  {chip.label}<X size={13} aria-hidden="true" />
                </button>
              ))}
              {filters.date !== "all" && (
                <button
                  className={styles.chip}
                  onClick={() => updateParams({ date: null, start: null, end: null })}
                  type="button"
                  title="Quitar filtro de fecha"
                >
                  {filters.date === "today" ? "Hoy" : filters.date === "7d" ? "Últimos 7 días" : filters.date === "30d" ? "Últimos 30 días" : "Fecha personalizada"}<X size={13} aria-hidden="true" />
                </button>
              )}
              <button className={styles.chipsClear} onClick={clearFilters} type="button">Limpiar filtros</button>
            </div>
          )}

          {/* Resultados */}
          <p className={styles.resultsCount} aria-live="polite">
            {hasActiveFilters || filters.query ? (
              <><strong>{results.length}</strong> {results.length === 1 ? "resultado" : "resultados"}</>
            ) : (
              <>Mostrando <strong>{results.length}</strong> de <strong>{summary.total}</strong> quejas</>
            )}
          </p>
          <ComplaintTable complaints={results} currentAdvisorId={currentAdvisor.id} />
        </div>
      </PageContainer>
    </AppShell>
  );
}
