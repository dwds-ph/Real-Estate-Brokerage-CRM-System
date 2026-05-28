import { CommissionBreakdown } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface CommissionBreakdownProps {
  breakdown: CommissionBreakdown;
}

const typeColors: Record<
  CommissionBreakdown["breakdown"][number]["type"],
  { badge: string; text: string }
> = {
  gross: {
    badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  deduction: {
    badge: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
    text: "text-red-600 dark:text-red-400",
  },
  tax: {
    badge: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20",
    text: "text-orange-600 dark:text-orange-400",
  },
  split: {
    badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
  },
  net: {
    badge: "bg-primary/15 text-primary border-primary/20",
    text: "text-primary font-semibold",
  },
};

const typeLabels: Record<CommissionBreakdown["breakdown"][number]["type"], string> = {
  gross: "Gross Commission",
  deduction: "Deduction",
  tax: "Tax",
  split: "Split",
  net: "Net Commission",
};

function SplitBar({ breakdown }: { breakdown: CommissionBreakdown }) {
  const { brokerShare, agentShare, agent2Share, grossCommission } = breakdown;

  // Co-broker share is the remaining commission after broker, agent(s), and referral fee
  const totalDistributed = brokerShare + agentShare + (agent2Share ?? 0) + (breakdown.referralFee ?? 0);
  const coBrokerShare = Math.max(0, grossCommission - totalDistributed);

  const segments: { label: string; value: number; color: string }[] = [
    { label: "Broker", value: brokerShare, color: "bg-blue-500" },
    { label: "Agent", value: agentShare + (agent2Share ?? 0), color: "bg-emerald-500" },
  ];

  if (coBrokerShare > 0) {
    segments.push({ label: "Co-Broker", value: coBrokerShare, color: "bg-amber-500" });
  }

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {return null;}

  return (
    <div className="space-y-2">
      <div className="flex h-5 w-full overflow-hidden rounded-full bg-muted">
        {segments.map((seg) => {
          const pct = (seg.value / total) * 100;
          if (pct < 1) {return null;}
          return (
            <div
              key={seg.label}
              className={`${seg.color} transition-all duration-300`}
              style={{ width: `${pct}%` }}
              title={`${seg.label}: ${formatCurrency(seg.value)} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {segments.map((seg) => {
          const pct = total > 0 ? ((seg.value / total) * 100).toFixed(1) : "0.0";
          return (
            <div key={seg.label} className="flex items-center gap-1.5">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${seg.color}`}
              />
              <span>
                {seg.label}: {formatCurrency(seg.value)} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p
        className={`text-lg font-bold tabular-nums ${
          highlight ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function CommissionBreakdownView({
  breakdown,
}: CommissionBreakdownProps) {
  const { dealPrice, grossCommission, netCommission, effectiveRate, breakdown: items } =
    breakdown;

  return (
    <div className="space-y-5">
      {/* Summary Cards Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Deal Price" value={formatCurrency(dealPrice)} />
        <SummaryCard label="Gross Commission" value={formatCurrency(grossCommission)} />
        <SummaryCard
          label="Net Commission"
          value={formatCurrency(netCommission)}
          highlight
        />
        <SummaryCard label="Effective Rate" value={`${effectiveRate.toFixed(2)}%`} />
      </div>

      {/* Detailed Breakdown List */}
      <div className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Commission Breakdown</h3>
        </div>
        <div className="divide-y">
          {items.map((item, idx) => {
            const colors = typeColors[item.type];
            return (
              <div
                key={idx}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${colors.badge}`}
                  >
                    {typeLabels[item.type]}
                  </span>
                  <span className="truncate text-muted-foreground">
                    {item.label}
                  </span>
                </div>
                <span className={`tabular-nums whitespace-nowrap ${colors.text}`}>
                  {item.type === "deduction" || item.type === "tax"
                    ? `-${formatCurrency(Math.abs(item.amount))}`
                    : formatCurrency(item.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Split Bar */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Commission Split</h3>
        <SplitBar breakdown={breakdown} />
      </div>
    </div>
  );
}
