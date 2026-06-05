/**
 * ReportDashboard.tsx — Main report dashboard component.
 *
 * Features:
 *  - Module selector (Leads / Deals / Payments / Commissions / All)
 *  - Date range picker (start & end date inputs)
 *  - Group by selector (Agent / Branch / Property Type / Status / Month)
 *  - Run report button
 *  - Results table with rows and summary
 *  - Export buttons (CSV / PDF)
 *  - Loading, error, and empty states
 */

import { useState, useMemo, useCallback } from "react";
import { useCollection } from "@/hooks/useFirestore";
import type { Lead, Deal, Payment, CommissionPlan } from "@/types";
import {
  generateReport,
  type ReportFilter,
} from "@/lib/reportEngine";
import { exportToCSV, exportToPDF } from "./ReportExport";

// ─── Constants ──────────────────────────────────────────────────────────

const MODULES: { value: ReportFilter["module"]; label: string }[] = [
  { value: "leads", label: "Leads" },
  { value: "deals", label: "Deals" },
  { value: "payments", label: "Payments" },
  { value: "commissions", label: "Commissions" },
  { value: "all", label: "All Modules" },
];

const GROUP_BY_OPTIONS: {
  value: ReportFilter["groupBy"];
  label: string;
}[] = [
  { value: "agent", label: "Agent" },
  { value: "branch", label: "Branch" },
  { value: "propertyType", label: "Property Type" },
  { value: "status", label: "Status" },
  { value: "month", label: "Month" },
];

/** One month ago as the default start date. */
function defaultStart(): number {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.getTime();
}

/** End of today as the default end date. */
function defaultEnd(): number {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

// ─── Component ──────────────────────────────────────────────────────────

export default function ReportDashboard() {
  // Filters
  const [module, setModule] = useState<ReportFilter["module"]>("leads");
  const [groupBy, setGroupBy] = useState<ReportFilter["groupBy"]>("status");
  const [dateStart, setDateStart] = useState<number>(defaultStart);
  const [dateEnd, setDateEnd] = useState<number>(defaultEnd);

  // Firestore subscriptions (always fetch — we slice in the engine)
  const { data: leads, loading: leadsLoading } = useCollection<Lead>("leads");
  const { data: deals, loading: dealsLoading } = useCollection<Deal>("deals");
  const { data: payments, loading: paymentsLoading } =
    useCollection<Payment>("payments");
  const { data: commissions, loading: commissionsLoading } =
    useCollection<CommissionPlan>("commissionPlans");

  const loading =
    leadsLoading || dealsLoading || paymentsLoading || commissionsLoading;

  // Build the filter object
  const filter: ReportFilter = useMemo(
    () => ({
      dateRange: { start: dateStart, end: dateEnd },
      groupBy,
      module,
    }),
    [dateStart, dateEnd, groupBy, module],
  );

  // Generate report data
  const [reportRun, setReportRun] = useState(false);

  const report = useMemo(() => {
    if (!reportRun) return null;

    let data: unknown;
    switch (module) {
      case "leads":
        data = leads ?? [];
        break;
      case "deals":
        data = deals ?? [];
        break;
      case "payments":
        data = payments ?? [];
        break;
      case "commissions":
        data = commissions ?? [];
        break;
      case "all":
        data = {
          leads: leads ?? [],
          deals: deals ?? [],
          payments: payments ?? [],
          commissions: commissions ?? [],
        };
        break;
      default:
        data = [];
    }

    return generateReport(module, data, filter);
  }, [reportRun, module, filter, leads, deals, payments, commissions]);

  const handleRunReport = useCallback(() => {
    setReportRun(true);
  }, []);

  const handleExportCSV = useCallback(() => {
    if (!report) return;
    exportToCSV(report.rows, report.title);
  }, [report]);

  const handleExportPDF = useCallback(() => {
    if (!report) return;
    exportToPDF(report.title, report.rows, report.summary);
  }, [report]);

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">📊 Reports</h1>
        <p className="text-muted-foreground">
          Generate cross-module reports with CSV and PDF export.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Module selector */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Module
            </label>
            <select
              value={module}
              onChange={(e) => {
                setModule(e.target.value as ReportFilter["module"]);
                setReportRun(false);
              }}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              {MODULES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Group by selector */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Group By
            </label>
            <select
              value={groupBy}
              onChange={(e) => {
                setGroupBy(e.target.value as ReportFilter["groupBy"]);
                setReportRun(false);
              }}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              {GROUP_BY_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date start */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Start Date
            </label>
            <input
              type="date"
              value={toDateInputValue(dateStart)}
              onChange={(e) => {
                const val = e.target.value;
                setDateStart(val ? new Date(val + "T00:00:00").getTime() : 0);
                setReportRun(false);
              }}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Date end */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              End Date
            </label>
            <input
              type="date"
              value={toDateInputValue(dateEnd)}
              onChange={(e) => {
                const val = e.target.value;
                setDateEnd(
                  val
                    ? new Date(val + "T23:59:59").getTime()
                    : Date.now(),
                );
                setReportRun(false);
              }}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Run report button */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRunReport}
            disabled={loading}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading
              ? "Loading data…"
              : reportRun
                ? "🔄 Rerun Report"
                : "▶ Run Report"}
          </button>

          {report && (
            <>
              <button
                onClick={handleExportCSV}
                className="rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                📥 Export CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                📄 Export PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Results area */}
      {!reportRun && !loading && (
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          <p className="text-lg">Select filters and click "Run Report" to generate data.</p>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {reportRun && !loading && report && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {report.summary.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border bg-card p-4 text-center"
              >
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-xl font-bold">
                  {typeof s.value === "number"
                    ? formatCurrency(s.value)
                    : s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Results table */}
          {report.rows.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              No data matches the current filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full divide-y text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Label
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Count
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Value
                    </th>
                    {report.rows[0]?.details &&
                      Object.keys(report.rows[0].details).map((k) => (
                        <th
                          key={k}
                          className="px-4 py-3 text-right font-medium text-muted-foreground capitalize"
                        >
                          {k}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {report.rows.map((row, idx) => {
                    const isSeparator = row.label === "───";
                    if (isSeparator) {
                      return (
                        <tr key={idx}>
                          <td
                            colSpan={
                              3 +
                              (report.rows[0]?.details
                                ? Object.keys(report.rows[0].details).length
                                : 0)
                            }
                            className="px-4 py-1 text-center text-muted-foreground"
                          >
                            ─────────────────
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr
                        key={idx}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-2 font-medium">{row.label}</td>
                        <td className="px-4 py-2 text-right">{row.count}</td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency(row.value)}
                        </td>
                        {row.details &&
                          Object.entries(row.details).map(([k, v]) => (
                            <td key={k} className="px-4 py-2 text-right">
                              {typeof v === "number"
                                ? formatCurrency(v)
                                : String(v)}
                            </td>
                          ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {reportRun && !loading && !report && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          Failed to generate report. Please try again.
        </div>
      )}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────

/** Convert a timestamp to YYYY-MM-DD for <input type="date">. */
function toDateInputValue(ts: number): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toISOString().slice(0, 10);
}

/** Format a number as a locale-aware currency string. */
function formatCurrency(value: number): string {
  if (value === 0) return "0";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
