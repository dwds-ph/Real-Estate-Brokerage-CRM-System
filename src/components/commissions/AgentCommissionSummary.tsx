import { useState, useMemo, useCallback, memo } from "react";
import type { Deal, Payout } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { computeFullBreakdown } from "@/lib/commissionEngine";

// ─── Types ─────────────────────────────────────────────────────────────

type PeriodFilter = "all" | "week" | "month" | "quarter" | "year";

interface AgentCommissionRow {
  agentId: string;
  agentName: string;
  dealCount: number;
  grossCommission: number;
  netCommission: number;
  paidAmount: number;
  dealIds: string[];
}

interface SummaryTotals {
  totalGrossCommission: number;
  totalNetCommission: number;
  totalPaid: number;
  totalPending: number;
  totalApproved: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────

function getPeriodStart(period: PeriodFilter): number {
  const now = Date.now();
  switch (period) {
    case "week":
      return now - 7 * 24 * 60 * 60 * 1000;
    case "month":
      return now - 30 * 24 * 60 * 60 * 1000;
    case "quarter":
      return now - 90 * 24 * 60 * 60 * 1000;
    case "year":
      return now - 365 * 24 * 60 * 60 * 1000;
    case "all":
    default:
      return 0;
  }
}

function filterDealsByPeriod(deals: Deal[], period: PeriodFilter): Deal[] {
  const start = getPeriodStart(period);
  if (start === 0) {return deals;}
  return deals.filter((d) => d.createdAt >= start);
}

function filterPayoutsByPeriod(
  payouts: Payout[],
  period: PeriodFilter,
): Payout[] {
  const start = getPeriodStart(period);
  if (start === 0) {return payouts;}
  return payouts.filter((p) => (p.paidAt ?? 0) >= start);
}

function getCommissionFromDeal(deal: Deal): {
  gross: number;
  net: number;
} {
  // If deal already has computed commission data, use it
  if (deal.commission?.total) {
    const gross = deal.commission.total;
    const taxes =
      (deal.tax?.vat ?? 0) +
      (deal.tax?.withholding ?? 0) +
      (deal.tax?.cgt ?? 0) +
      (deal.tax?.dst ?? 0);
    const net = gross - taxes;
    return { gross, net };
  }

  // Otherwise use the commission engine with default assumptions
  try {
    const breakdown = computeFullBreakdown({
      dealPrice: deal.dealPrice,
    });
    return {
      gross: breakdown.grossCommission,
      net: breakdown.netCommission,
    };
  } catch {
    // Fallback: 3% gross, standard deductions
    const gross = deal.dealPrice * 0.03;
    const net = gross * 0.87; // ~13% standard deductions
    return { gross, net };
  }
}

// ─── Sub-components ────────────────────────────────────────────────────

const PeriodFilterBar = memo(function PeriodFilterBar({
  value,
  onChange,
}: {
  value: PeriodFilter;
  onChange: (p: PeriodFilter) => void;
}) {
  const options: { label: string; value: PeriodFilter }[] = [
    { label: "All Time", value: "all" },
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
    { label: "This Quarter", value: "quarter" },
    { label: "This Year", value: "year" },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            value === opt.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
});

const SummaryCard = memo(function SummaryCard({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string;
  variant?: "default" | "gross" | "net" | "paid" | "pending" | "approved";
}) {
  const colorMap: Record<string, string> = {
    default: "text-foreground",
    gross: "text-primary",
    net: "text-green-600 dark:text-green-400",
    paid: "text-green-600 dark:text-green-400",
    pending: "text-yellow-600 dark:text-yellow-400",
    approved: "text-blue-600 dark:text-blue-400",
  };

  return (
    <div className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted/20">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${colorMap[variant]}`}>
        {value}
      </p>
    </div>
  );
});

const EmptyState = memo(function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border bg-card py-10 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
});

const AgentMiniBreakdown = memo(function AgentMiniBreakdown({
  agentId,
  agentName,
  deals,
  payouts,
  onClose,
}: {
  agentId: string;
  agentName: string;
  deals: Deal[];
  payouts: Payout[];
  onClose: () => void;
}) {
  const agentDeals = deals.filter((d) => d.createdBy === agentId);
  const agentPayouts = payouts.filter((p) => p.agentId === agentId);

  const totalPaid = agentPayouts
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount, 0);
  const totalPending = agentPayouts
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + p.amount, 0);
  const totalApproved = agentPayouts
    .filter((p) => p.status === "approved")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{agentName} — Breakdown</h4>
        <button
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Close
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="rounded-md bg-card border px-3 py-2">
          <p className="text-muted-foreground">Deals</p>
          <p className="font-semibold text-lg">{agentDeals.length}</p>
        </div>
        <div className="rounded-md bg-card border px-3 py-2">
          <p className="text-muted-foreground">Paid</p>
          <p className="font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(totalPaid)}
          </p>
        </div>
        <div className="rounded-md bg-card border px-3 py-2">
          <p className="text-muted-foreground">Pending</p>
          <p className="font-semibold text-yellow-600 dark:text-yellow-400">
            {formatCurrency(totalPending)}
          </p>
        </div>
        <div className="rounded-md bg-card border px-3 py-2">
          <p className="text-muted-foreground">Approved</p>
          <p className="font-semibold text-blue-600 dark:text-blue-400">
            {formatCurrency(totalApproved)}
          </p>
        </div>
      </div>

      {/* Deals list */}
      {agentDeals.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Deals ({agentDeals.length})
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {agentDeals.map((deal) => {
              const { gross, net } = getCommissionFromDeal(deal);
              return (
                <div
                  key={deal.id}
                  className="flex items-center justify-between rounded-md bg-card px-3 py-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{deal.clientName}</p>
                    <p className="text-muted-foreground">
                      {formatDate(deal.createdAt)} —{" "}
                      {formatCurrency(deal.dealPrice)}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="font-semibold tabular-nums">
                      {formatCurrency(gross)}
                    </p>
                    <p className="text-muted-foreground tabular-nums">
                      Net: {formatCurrency(net)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground py-2">
          No deals closed in this period.
        </p>
      )}

      {/* Payouts list */}
      {agentPayouts.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Payouts ({agentPayouts.length})
          </p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {agentPayouts.map((payout) => (
              <div
                key={payout.id}
                className="flex items-center justify-between rounded-md bg-card px-3 py-2 text-xs"
              >
                <span className="text-muted-foreground">
                  {payout.paidAt ? formatDate(payout.paidAt) : "Not yet paid"}
                </span>
                <div className="text-right">
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(payout.amount)}
                  </span>
                  <span
                    className={`ml-2 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      payout.status === "paid"
                        ? "bg-green-500/15 text-green-600 dark:text-green-400"
                        : payout.status === "approved"
                          ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                          : "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
                    }`}
                  >
                    {payout.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

const RankBadge = memo(function RankBadge({ rank }: { rank: number }) {
  if (rank === 0) {
    return (
      <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs font-bold">
        🥇
      </span>
    );
  }
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-gray-300/30 text-gray-500 dark:text-gray-400 text-xs font-bold">
        🥈
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-600/20 text-amber-600 dark:text-amber-400 text-xs font-bold">
        🥉
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center h-7 w-7 text-xs font-bold text-muted-foreground">
      #{rank + 1}
    </span>
  );
});

const AgentRow = memo(function AgentRow({
  row,
  index,
  isExpanded,
  onToggle,
  onClose,
  filteredDeals,
  filteredPayouts,
}: {
  row: AgentCommissionRow;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onClose: () => void;
  filteredDeals: Deal[];
  filteredPayouts: Payout[];
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className={`w-full grid grid-cols-1 sm:grid-cols-12 gap-2 px-4 py-3 text-sm transition-colors hover:bg-muted/30 text-left ${
          isExpanded ? "bg-muted/20" : ""
        }`}
      >
        {/* Mobile layout */}
        <div className="flex items-center gap-3 sm:hidden">
          <RankBadge rank={index} />
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{row.agentName}</p>
            <p className="text-xs text-muted-foreground">
              {row.dealCount} deal{row.dealCount !== 1 ? "s" : ""} · Gross:{" "}
              {formatCurrency(row.grossCommission)}
            </p>
          </div>
          <span className="text-muted-foreground text-xs shrink-0">
            {isExpanded ? "▲" : "▼"}
          </span>
        </div>

        {/* Desktop layout */}
        <div className="hidden sm:flex sm:contents">
          <div className="col-span-1 flex items-center justify-center">
            <RankBadge rank={index} />
          </div>
          <div className="col-span-3 flex items-center font-medium truncate">
            {row.agentName}
          </div>
          <div className="col-span-1 flex items-center justify-end tabular-nums">
            {row.dealCount}
          </div>
          <div className="col-span-2 flex items-center justify-end tabular-nums font-medium">
            {formatCurrency(row.grossCommission)}
          </div>
          <div className="col-span-2 flex items-center justify-end tabular-nums text-muted-foreground">
            {formatCurrency(row.netCommission)}
          </div>
          <div className="col-span-2 flex items-center justify-end tabular-nums text-green-600 dark:text-green-400">
            {formatCurrency(row.paidAmount)}
          </div>
          <div className="col-span-1 flex items-center justify-center text-muted-foreground text-xs">
            {isExpanded ? "▲" : "▼"}
          </div>
        </div>
      </button>

      {/* Expandable Mini Breakdown */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <AgentMiniBreakdown
            agentId={row.agentId}
            agentName={row.agentName}
            deals={filteredDeals}
            payouts={filteredPayouts}
            onClose={onClose}
          />
        </div>
      )}
    </div>
  );
});

// ─── Main Component ────────────────────────────────────────────────────

interface AgentCommissionSummaryProps {
  deals: Deal[];
  payouts: Payout[];
  agents: { id: string; displayName: string }[];
}

export default function AgentCommissionSummary({
  deals,
  payouts,
  agents,
}: AgentCommissionSummaryProps) {
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);

  // Filter data by selected period
  const filteredDeals = useMemo(
    () => filterDealsByPeriod(deals, period),
    [deals, period],
  );
  const filteredPayouts = useMemo(
    () => filterPayoutsByPeriod(payouts, period),
    [payouts, period],
  );

  // Compute summary totals
  const summaryTotals: SummaryTotals = useMemo(() => {
    let totalGrossCommission = 0;
    let totalNetCommission = 0;

    for (const deal of filteredDeals) {
      const { gross, net } = getCommissionFromDeal(deal);
      totalGrossCommission += gross;
      totalNetCommission += net;
    }

    const totalPaid = filteredPayouts
      .filter((p) => p.status === "paid")
      .reduce((s, p) => s + p.amount, 0);

    const totalPending = filteredPayouts
      .filter((p) => p.status === "pending")
      .reduce((s, p) => s + p.amount, 0);

    const totalApproved = filteredPayouts
      .filter((p) => p.status === "approved")
      .reduce((s, p) => s + p.amount, 0);

    return {
      totalGrossCommission,
      totalNetCommission,
      totalPaid,
      totalPending,
      totalApproved,
    };
  }, [filteredDeals, filteredPayouts]);

  // Build agent ranking table
  const agentRows: AgentCommissionRow[] = useMemo(() => {
    const agentMap = new Map<string, AgentCommissionRow>();

    for (const agent of agents) {
      agentMap.set(agent.id, {
        agentId: agent.id,
        agentName: agent.displayName,
        dealCount: 0,
        grossCommission: 0,
        netCommission: 0,
        paidAmount: 0,
        dealIds: [],
      });
    }

    // Aggregate deals per agent
    for (const deal of filteredDeals) {
      const agentId = deal.createdBy;
      const { gross, net } = getCommissionFromDeal(deal);

      if (agentMap.has(agentId)) {
        const row = agentMap.get(agentId)!;
        row.dealCount += 1;
        row.grossCommission += gross;
        row.netCommission += net;
        row.dealIds.push(deal.id);
      } else {
        // Agent from deal not in provided agents list — add on the fly
        agentMap.set(agentId, {
          agentId,
          agentName: `Agent ${agentId.slice(0, 6)}`,
          dealCount: 1,
          grossCommission: gross,
          netCommission: net,
          paidAmount: 0,
          dealIds: [deal.id],
        });
      }
    }

    // Aggregate payouts per agent
    for (const payout of filteredPayouts) {
      if (payout.status === "paid" && agentMap.has(payout.agentId)) {
        const row = agentMap.get(payout.agentId)!;
        row.paidAmount += payout.amount;
      }
    }

    // Convert to array, filter out agents with no activity, sort by gross desc
    return Array.from(agentMap.values())
      .filter((r) => r.dealCount > 0 || r.paidAmount > 0)
      .sort((a, b) => b.grossCommission - a.grossCommission);
  }, [filteredDeals, filteredPayouts, agents]);

  const handleToggleAgent = useCallback(
    (agentId: string, isExpanded: boolean) => {
      setExpandedAgentId(isExpanded ? null : agentId);
    },
    [],
  );

  const handleCloseBreakdown = useCallback(() => {
    setExpandedAgentId(null);
  }, []);

  const periodLabel =
    period === "all"
      ? "All Time"
      : period === "week"
        ? "This Week"
        : period === "month"
          ? "This Month"
          : period === "quarter"
            ? "This Quarter"
            : "This Year";

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Agent Commission Summary</h2>
          <p className="text-xs text-muted-foreground">
            {periodLabel} — {filteredDeals.length} deal
            {filteredDeals.length !== 1 ? "s" : ""}
          </p>
        </div>
        <PeriodFilterBar value={period} onChange={setPeriod} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <SummaryCard
          label="Total Gross Commission"
          value={formatCurrency(summaryTotals.totalGrossCommission)}
          variant="gross"
        />
        <SummaryCard
          label="Total Net Commission"
          value={formatCurrency(summaryTotals.totalNetCommission)}
          variant="net"
        />
        <SummaryCard
          label="Total Paid"
          value={formatCurrency(summaryTotals.totalPaid)}
          variant="paid"
        />
        <SummaryCard
          label="Pending"
          value={formatCurrency(summaryTotals.totalPending)}
          variant="pending"
        />
        <SummaryCard
          label="Approved"
          value={formatCurrency(summaryTotals.totalApproved)}
          variant="approved"
        />
      </div>

      {/* Agent Ranking Table */}
      <div className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Agent Rankings</h3>
        </div>

        {agentRows.length === 0 ? (
          <EmptyState message="No agent commission data available for this period." />
        ) : (
          <div className="divide-y">
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-3">Agent</div>
              <div className="col-span-1 text-right">Deals</div>
              <div className="col-span-2 text-right">Gross Commission</div>
              <div className="col-span-2 text-right">Net Commission</div>
              <div className="col-span-2 text-right">Paid Amount</div>
              <div className="col-span-1" />
            </div>

            {/* Table Rows */}
            {agentRows.map((row, index) => {
              const isExpanded = expandedAgentId === row.agentId;
              return (
                <AgentRow
                  key={row.agentId}
                  row={row}
                  index={index}
                  isExpanded={isExpanded}
                  onToggle={handleToggleAgent.bind(
                    null,
                    row.agentId,
                    isExpanded,
                  )}
                  onClose={handleCloseBreakdown}
                  filteredDeals={filteredDeals}
                  filteredPayouts={filteredPayouts}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Summary info */}
      <div className="text-center text-[10px] text-muted-foreground">
        Commission estimates use default rates (3% gross, standard deductions)
        when deal-specific commission data is unavailable.
      </div>
    </div>
  );
}
