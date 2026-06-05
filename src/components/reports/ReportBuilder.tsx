/**
 * ReportBuilder.tsx — Pre-built report templates for quick report generation.
 *
 * Provides a library of report templates that pre-configure module, group-by,
 * and date range for the user. Clicking a template navigates to the dashboard
 * URL with query params, or the parent can supply an onSelect callback to
 * generate inline.
 */

import { useNavigate } from "react-router-dom";
import type { ReportFilter } from "@/lib/reportEngine";

// ─── Template Definition ──────────────────────────────────────────────

export interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  config: Pick<ReportFilter, "module" | "groupBy">;
  datePreset: DatePreset;
}

export type DatePreset =
  | "this-month"
  | "this-quarter"
  | "this-year"
  | "last-30-days"
  | "last-7-days"
  | "all-time";

/** Human-readable label + date range for a preset. */
export interface DateRangePreset {
  label: string;
  start: () => number;
  end: () => number;
}

/** Compute a date range from a DatePreset name. */
export function resolveDatePreset(preset: DatePreset): DateRangePreset {
  const now = new Date();
  const endOfToday = () => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  };
  const startOfMonth = () => {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return d.getTime();
  };
  const startOfQuarter = () => {
    const q = Math.floor(now.getMonth() / 3) * 3;
    const d = new Date(now.getFullYear(), q, 1);
    return d.getTime();
  };
  const startOfYear = () => {
    const d = new Date(now.getFullYear(), 0, 1);
    return d.getTime();
  };

  switch (preset) {
    case "this-month":
      return {
        label: "This Month",
        start: startOfMonth,
        end: endOfToday,
      };
    case "this-quarter":
      return {
        label: "This Quarter",
        start: startOfQuarter,
        end: endOfToday,
      };
    case "this-year":
      return {
        label: "This Year",
        start: startOfYear,
        end: endOfToday,
      };
    case "last-30-days": {
      return {
        label: "Last 30 Days",
        start: () => {
          const d = new Date();
          d.setDate(d.getDate() - 30);
          return d.getTime();
        },
        end: endOfToday,
      };
    }
    case "last-7-days": {
      return {
        label: "Last 7 Days",
        start: () => {
          const d = new Date();
          d.setDate(d.getDate() - 7);
          return d.getTime();
        },
        end: endOfToday,
      };
    }
    case "all-time":
    default:
      return {
        label: "All Time",
        start: () => new Date("2024-01-01").getTime(),
        end: endOfToday,
      };
  }
}

// ─── Built-in Templates ───────────────────────────────────────────────

const TEMPLATES: ReportTemplate[] = [
  {
    id: "monthly-leads",
    title: "Monthly Lead Report",
    description: "New leads grouped by source for the current month",
    icon: "📋",
    config: { module: "leads", groupBy: "status" },
    datePreset: "this-month",
  },
  {
    id: "commission-summary",
    title: "Commission Summary",
    description: "Commission plans aggregated by type this quarter",
    icon: "💰",
    config: { module: "commissions", groupBy: "status" },
    datePreset: "this-quarter",
  },
  {
    id: "pipeline-overview",
    title: "Pipeline Overview",
    description: "Deal pipeline grouped by status this year",
    icon: "📈",
    config: { module: "deals", groupBy: "status" },
    datePreset: "this-year",
  },
  {
    id: "payment-status",
    title: "Payment Status",
    description: "Payments grouped by status — all time view",
    icon: "💳",
    config: { module: "payments", groupBy: "status" },
    datePreset: "all-time",
  },
  {
    id: "top-agents",
    title: "Top Agents (30d)",
    description: "Deals grouped by agent over the last 30 days",
    icon: "🏆",
    config: { module: "deals", groupBy: "agent" },
    datePreset: "last-30-days",
  },
  {
    id: "weekly-leads",
    title: "Weekly Lead Activity",
    description: "Leads by source over the last 7 days",
    icon: "🔍",
    config: { module: "leads", groupBy: "status" },
    datePreset: "last-7-days",
  },
];

// ─── Component Props ──────────────────────────────────────────────────

interface ReportBuilderProps {
  /** Called when a template is selected; if omitted, navigates via react-router. */
  onSelectTemplate?: (
    template: ReportTemplate,
    range: DateRangePreset,
  ) => void;
  /** Base path for navigation fallback (default: "/reports"). */
  navigateTo?: string;
}

// ─── Component ────────────────────────────────────────────────────────

export default function ReportBuilder({
  onSelectTemplate,
  navigateTo = "/reports",
}: ReportBuilderProps) {
  const navigate = useNavigate();

  const handleTemplateClick = (template: ReportTemplate) => {
    const range = resolveDatePreset(template.datePreset);
    if (onSelectTemplate) {
      onSelectTemplate(template, range);
      return;
    }
    // Fallback: navigate to the reports page with query params
    const params = new URLSearchParams({
      module: template.config.module,
      groupBy: template.config.groupBy,
      dateStart: String(range.start()),
      dateEnd: String(range.end()),
      preset: template.datePreset,
    });
    navigate(`${navigateTo}?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">📁 Report Templates</h2>
        <p className="text-sm text-muted-foreground">
          Pre-built reports — click to generate instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleTemplateClick(t)}
            className="group flex items-start gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/50"
          >
            <span className="mt-0.5 text-2xl">{t.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-card-foreground group-hover:text-primary transition-colors">
                {t.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                  {t.config.module}
                </span>
                <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                  by {t.config.groupBy}
                </span>
                <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {resolveDatePreset(t.datePreset).label}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
