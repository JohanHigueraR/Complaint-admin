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
        <div aria-busy="true" className="animate-pulse space-y-6">
          <div className="h-8 w-40 rounded bg-slate-800" />
          <div className="h-20 rounded-xl bg-slate-800" />
          <div className="h-64 rounded-xl bg-slate-800" />
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
    { label: "Total", value: summary.total, view: "all" as ComplaintView, href: "/quejas", icon: ClipboardList, accent: "text-slate-300" },
    { label: "Mis quejas", value: summary.mine, view: "mine" as ComplaintView, href: "/quejas/mis", icon: UserRound, accent: "text-blue-300" },
    { label: "Pendientes", value: summary.pending, view: "pending" as ComplaintView, href: "/quejas/pendientes", icon: Clock3, accent: "text-amber-300" },
    { label: "Completadas", value: summary.completed, view: "completed" as ComplaintView, href: "/quejas/completadas", icon: CheckCircle2, accent: "text-emerald-300" },
  ];

  return (
    <AppShell>
      <PageContainer>
        {/* Encabezado de la sección */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Centro de trabajo</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl">Quejas</h1>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-400">
              {activeView === "mine"
                ? `Casos asignados a ${currentAdvisor.name}. Prioriza por estado y prioridad.`
                : "Gestiona y da seguimiento a las quejas recibidas."}
            </p>
          </div>
        </div>

        {/* Resumen operativo: compacto, clicable, sincronizado con el store */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3" role="group" aria-label="Resumen operativo">
          {statCards.map(({ label, value, view, href, icon: Icon, accent }) => {
            const isActive = activeView === view;
            return (
              <button
                key={label}
                onClick={() => updateParams({}, href)}
                aria-current={isActive ? "page" : undefined}
                type="button"
                className={`group flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${
                  isActive
                    ? "border-blue-400/40 bg-blue-500/10"
                    : "border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-900/80"
                }`}
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-800 ${accent}`}>
                  <Icon size={17} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xl font-semibold tabular-nums leading-6 text-slate-100">{value}</span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500 group-hover:text-slate-400">{label}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Vistas de trabajo */}
        <div aria-label="Vistas de quejas" className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-800" role="tablist">
          {tabs.map((tab) => {
            const count = tab.view === "all" ? summary.total : tab.view === "mine" ? summary.mine : tab.view === "pending" ? summary.pending : summary.completed;
            return (
              <button
                aria-selected={activeView === tab.view}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-400 ${
                  activeView === tab.view ? "border-blue-400 text-blue-300" : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
                key={tab.view}
                onClick={() => updateParams({}, tab.href)}
                role="tab"
                type="button"
              >
                {tab.label}
                <span className={`rounded-md px-1.5 py-0.5 text-xs tabular-nums ${activeView === tab.view ? "bg-blue-400/15 text-blue-200" : "bg-slate-800 text-slate-400"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Búsqueda + filtros + orden */}
        <div className="mt-5 flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900 pl-10 pr-9 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 hover:border-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              onChange={(event) => updateParams({ q: event.target.value || null })}
              placeholder="Buscar por ID, cliente o transacción…"
              type="search"
              value={filters.query}
              aria-label="Buscar quejas"
            />
            {filters.query && (
              <button
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                onClick={() => updateParams({ q: null })}
                type="button"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ComplaintFilterPanel activeCount={activeFilterCount(filters)} advisors={options.advisors} filters={filters} merchants={options.merchants} onApply={applyFilters} onClear={clearFilters} />
            <select
              aria-label="Ordenar resultados"
              className="h-11 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-300 outline-none transition-colors hover:border-slate-600 focus:border-blue-400 lg:flex-none"
              onChange={(event) => updateParams({ sort: event.target.value === "recent" ? null : event.target.value })}
              value={sort}
            >
              {sortOptions.map((option) => <option key={option.value} value={option.value}>Ordenar: {option.label}</option>)}
            </select>
          </div>
        </div>

        {/* Filtros activos */}
        {hasActiveFilters && (
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-800/80 bg-slate-900/60 px-3 py-2.5">
            <span className="mr-1 text-xs font-medium text-slate-500">Filtros activos:</span>
            {chips.map((chip) => (
              <button
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-800 px-2 py-1 text-xs text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-700"
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
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-800 px-2 py-1 text-xs text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-700"
                onClick={() => updateParams({ date: null, start: null, end: null })}
                type="button"
                title="Quitar filtro de fecha"
              >
                {filters.date === "today" ? "Hoy" : filters.date === "7d" ? "Últimos 7 días" : filters.date === "30d" ? "Últimos 30 días" : "Fecha personalizada"}<X size={13} aria-hidden="true" />
              </button>
            )}
            <button className="ml-1 text-xs font-medium text-blue-300 hover:text-blue-200" onClick={clearFilters} type="button">Limpiar filtros</button>
          </div>
        )}

        {/* Resultados */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500" aria-live="polite">
            {hasActiveFilters || filters.query ? (
              <><span className="font-semibold text-slate-300">{results.length}</span> {results.length === 1 ? "resultado" : "resultados"}</>
            ) : (
              <>Mostrando <span className="font-semibold text-slate-300">{results.length}</span> de <span className="font-semibold text-slate-300">{summary.total}</span> quejas</>
            )}
          </p>
        </div>
        <div className="mt-2.5">
          <ComplaintTable complaints={results} currentAdvisorId={currentAdvisor.id} />
        </div>
      </PageContainer>
    </AppShell>
  );
}