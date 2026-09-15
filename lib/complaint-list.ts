import { completedStatuses, pendingStatuses, type DateFilter, type SortOption } from "@/constants/complaint-options";
import type { Complaint, ComplaintPriority, ComplaintStatus } from "@/types/complaint";

export interface ComplaintFilters {
  query: string;
  statuses: ComplaintStatus[];
  priorities: ComplaintPriority[];
  advisors: string[];
  merchants: string[];
  types: string[];
  date: DateFilter;
  startDate: string;
  endDate: string;
}

export type ComplaintView = "all" | "mine" | "pending" | "completed";

export const emptyComplaintFilters: ComplaintFilters = { query: "", statuses: [], priorities: [], advisors: [], merchants: [], types: [], date: "all", startDate: "", endDate: "" };

/**
 * Calculate summary counts for all views.
 * This is the single source of truth for complaint counts.
 */
export function getComplaintSummary(complaints: Complaint[], advisorId: string) {
  const total = complaints.length;
  const mine = complaints.filter((c) => c.assignedAdvisor?.id === advisorId).length;
  const pending = complaints.filter((c) => pendingStatuses.includes(c.status)).length;
  const completed = complaints.filter((c) => completedStatuses.includes(c.status)).length;
  return { total, mine, pending, completed };
}

export function filterComplaints(complaints: Complaint[], view: ComplaintView, filters: ComplaintFilters, advisorId: string) {
  const query = filters.query.trim().toLocaleLowerCase("es");
  const now = new Date("2026-09-14T23:59:59-05:00");
  const startForDate = filters.date === "today" ? new Date("2026-09-14T00:00:00-05:00") : filters.date === "7d" ? new Date(now.getTime() - 6 * 86_400_000) : filters.date === "30d" ? new Date(now.getTime() - 29 * 86_400_000) : null;

  return complaints.filter((complaint) => {
    // View filter
    const matchesView =
      view === "all" ||
      (view === "mine" && complaint.assignedAdvisor?.id === advisorId) ||
      (view === "pending" && pendingStatuses.includes(complaint.status)) ||
      (view === "completed" && completedStatuses.includes(complaint.status));

    // Query filter
    const matchesQuery = !query || [complaint.id, complaint.customer.name, complaint.transaction.id].some((value) => value.toLocaleLowerCase("es").includes(query));

    // Array filters helper
    const matchesArray = <T,>(values: T[], value: T) => !values.length || values.includes(value);

    // Date filters
    const createdAt = new Date(complaint.createdAt);
    const matchesDate = !startForDate || createdAt >= startForDate;
    const matchesCustomDate =
      filters.date !== "custom" ||
      ((!filters.startDate || complaint.createdAt.slice(0, 10) >= filters.startDate) &&
        (!filters.endDate || complaint.createdAt.slice(0, 10) <= filters.endDate));

    // Advisor filter - use advisor name since that's what's displayed in UI
    const advisorKey: string = complaint.assignedAdvisor ? complaint.assignedAdvisor.name : "Sin asignar";

    return (
      matchesView &&
      matchesQuery &&
      matchesArray(filters.statuses, complaint.status) &&
      matchesArray(filters.priorities, complaint.priority) &&
      matchesArray(filters.advisors, advisorKey) &&
      matchesArray(filters.merchants, complaint.merchant) &&
      matchesArray(filters.types, complaint.complaintType) &&
      matchesDate &&
      matchesCustomDate
    );
  });
}

export function sortComplaints(complaints: Complaint[], sort: SortOption) {
  const priorityRank: Record<ComplaintPriority, number> = { alta: 3, media: 2, baja: 1 };
  return [...complaints].sort((left, right) => sort === "oldest" ? new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime() : sort === "priority-high" ? priorityRank[right.priority] - priorityRank[left.priority] : sort === "priority-low" ? priorityRank[left.priority] - priorityRank[right.priority] : new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export function getComplaintFilterOptions(complaints: Complaint[]) {
  return { advisors: [...new Set(complaints.map((item) => item.assignedAdvisor ? item.assignedAdvisor.name : "Sin asignar"))].sort(), merchants: [...new Set(complaints.map((item) => item.merchant))].sort() };
}
