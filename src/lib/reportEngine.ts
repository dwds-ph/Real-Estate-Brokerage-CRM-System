/**
 * reportEngine.ts — Cross-module aggregation engine for advanced reporting.
 *
 * Provides typed filter/result contracts and pure aggregation functions
 * for Leads, Deals, Payments, and Commissions. All functions are
 * side-effect–free so they can be used in both client-side reports and
 * (future) server-side exports.
 */

import type {
  Lead,
  Deal,
  Payment,
  CommissionPlan,
} from "@/types";

// ─── Filter & Result Types ─────────────────────────────────────────────

export interface ReportFilter {
  dateRange: { start: number; end: number };
  groupBy: "agent" | "branch" | "propertyType" | "status" | "month";
  module: "leads" | "deals" | "payments" | "commissions" | "all";
}

export interface ReportResult {
  title: string;
  generatedAt: number;
  rows: ReportRow[];
  summary: { label: string; value: string | number }[];
}

export interface ReportRow {
  label: string;
  count: number;
  value: number;
  details?: Record<string, number>;
}

// ─── Helpers ────────────────────────────────────────────────────────────

/** Group a flat array by a string key extractor. */
function groupByKey<T>(
  items: T[],
  keyFn: (item: T) => string,
  filter: ReportFilter,
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    // Date-range filter (skip items outside range)
    const createdAt = (item as Record<string, unknown>).createdAt as
      | number
      | undefined;
    if (
      createdAt !== undefined &&
      (createdAt < filter.dateRange.start || createdAt > filter.dateRange.end)
    ) {
      continue;
    }

    const key = keyFn(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return groups;
}

/** Safely sum a numeric field across items. */
function sumField<T>(items: T[], field: keyof T): number {
  return items.reduce((acc, item) => {
    const v = item[field];
    return acc + (typeof v === "number" ? (v as number) : 0);
  }, 0);
}

// ─── Lead: status-based source grouping ─────────────────────────────────

export function aggregateLeadsBySource(
  leads: Lead[],
  filter: ReportFilter,
): ReportRow[] {
  const groups = groupByKey(leads, (l) => l.source, filter);
  const rows: ReportRow[] = [];
  for (const [source, items] of groups) {
    rows.push({
      label: source,
      count: items.length,
      value: items.length, // count is the primary metric for leads
      details: {
        new: items.filter((l) => l.status === "new").length,
        contacted: items.filter((l) => l.status === "contacted").length,
        negotiating: items.filter((l) => l.status === "negotiating").length,
        closed: items.filter((l) => l.status === "closed").length,
        lost: items.filter((l) => l.status === "lost").length,
      },
    });
  }
  return rows.sort((a, b) => b.count - a.count);
}

// ─── Deal: aggregated by status ─────────────────────────────────────────

export function aggregateDealsByStatus(
  deals: Deal[],
  filter: ReportFilter,
): ReportRow[] {
  const groups = groupByKey(deals, (d) => d.status, filter);
  const rows: ReportRow[] = [];
  for (const [status, items] of groups) {
    rows.push({
      label: status,
      count: items.length,
      value: sumField(items, "dealPrice" as keyof Deal),
      details: {
        totalCommission: sumField(
          items,
          "commission" as keyof Deal,
        ) as unknown as number,
      },
    });
  }
  return rows.sort((a, b) => b.value - a.value);
}

// ─── Payment: aggregated by status ──────────────────────────────────────

export function aggregatePaymentsByStatus(
  payments: Payment[],
  filter: ReportFilter,
): ReportRow[] {
  const groups = groupByKey(payments, (p) => p.status, filter);
  const rows: ReportRow[] = [];
  for (const [status, items] of groups) {
    rows.push({
      label: status,
      count: items.length,
      value: sumField(items, "amount"),
      details: {
        overdue: items.filter((p) => p.status === "overdue").length,
        paid: items.filter((p) => p.status === "paid").length,
      },
    });
  }
  return rows.sort((a, b) => b.value - a.value);
}

// ─── Commission: aggregated by plan type ────────────────────────────────

export function aggregateCommissions(
  commissions: CommissionPlan[],
  filter: ReportFilter,
): ReportRow[] {
  const groups = groupByKey(commissions, (c) => c.type, filter);
  const rows: ReportRow[] = [];
  for (const [type, items] of groups) {
    rows.push({
      label: type,
      count: items.length,
      value: items.reduce(
        (acc, c) => acc + (c.rules.percent ?? c.rules.referralFee ?? 0),
        0,
      ),
      details: {
        assignedToTotal: items.reduce(
          (acc, c) => acc + c.assignedTo.length,
          0,
        ),
      },
    });
  }
  return rows.sort((a, b) => b.count - a.count);
}

// ─── Module Dispatcher ──────────────────────────────────────────────────

export function generateReport(
  module: ReportFilter["module"],
  data: unknown,
  filter: ReportFilter,
): ReportResult {
  const generatedAt = Date.now();
  let rows: ReportRow[] = [];
  let title = "Report";

  switch (module) {
    case "leads": {
      title = "Leads by Source";
      rows = aggregateLeadsBySource(data as Lead[], filter);
      break;
    }
    case "deals": {
      title = "Deals by Status";
      rows = aggregateDealsByStatus(data as Deal[], filter);
      break;
    }
    case "payments": {
      title = "Payments by Status";
      rows = aggregatePaymentsByStatus(data as Payment[], filter);
      break;
    }
    case "commissions": {
      title = "Commission Plans by Type";
      rows = aggregateCommissions(data as CommissionPlan[], filter);
      break;
    }
    case "all": {
      title = "Combined Report";
      // For "all" we produce a cross-module summary
      const leadRows = aggregateLeadsBySource(
        (data as { leads: Lead[] }).leads ?? [],
        filter,
      );
      const dealRows = aggregateDealsByStatus(
        (data as { deals: Deal[] }).deals ?? [],
        filter,
      );
      const paymentRows = aggregatePaymentsByStatus(
        (data as { payments: Payment[] }).payments ?? [],
        filter,
      );
      const commissionRows = aggregateCommissions(
        (data as { commissions: CommissionPlan[] }).commissions ?? [],
        filter,
      );
      rows = [
        ...leadRows,
        { label: "───", count: 0, value: 0 },
        ...dealRows,
        { label: "───", count: 0, value: 0 },
        ...paymentRows,
        { label: "───", count: 0, value: 0 },
        ...commissionRows,
      ];
      break;
    }
  }

  const totalCount = rows.reduce((s, r) => s + r.count, 0);
  const totalValue = rows.reduce((s, r) => s + r.value, 0);

  const summary: { label: string; value: string | number }[] = [
    { label: "Total Rows", value: rows.length },
    { label: "Total Count", value: totalCount },
    { label: "Total Value", value: totalValue },
  ];

  return { title, generatedAt, rows, summary };
}
