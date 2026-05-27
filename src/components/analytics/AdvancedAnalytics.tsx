import { formatCurrency } from "@/lib/utils";

interface DealData {
  status?: string;
  commission?: number;
  dealValue?: number;
  createdAt?: number;
}

interface Props {
  deals: DealData[];
}

export default function AdvancedAnalytics({ deals }: Props) {
  const activeDeals = deals.filter(
    (d) => d.status !== "cancelled" && d.status !== "lost",
  );
  const totalCommission = activeDeals.reduce(
    (s, d) => s + (d.commission || 0),
    0,
  );
  const avgDealValue =
    activeDeals.length > 0
      ? activeDeals.reduce((s, d) => s + (d.dealValue || 0), 0) /
        activeDeals.length
      : 0;

  const byMonth: Record<string, { deals: number; commission: number }> = {};
  activeDeals.forEach((d) => {
    if (!d.createdAt) return;
    const dte = new Date(d.createdAt);
    const key = `${dte.getFullYear()}-${String(dte.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth[key]) byMonth[key] = { deals: 0, commission: 0 };
    byMonth[key].deals++;
    byMonth[key].commission += d.commission || 0;
  });

  const months = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b));
  const maxCommission = Math.max(...months.map(([, v]) => v.commission), 1);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">
            Active Deals
          </p>
          <p className="text-xl font-bold">{activeDeals.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">
            Total Commission
          </p>
          <p className="text-xl font-bold text-primary">
            {formatCurrency(totalCommission)}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">
            Avg Deal Value
          </p>
          <p className="text-xl font-bold">{formatCurrency(avgDealValue)}</p>
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="rounded-lg border bg-card p-4">
        <h4 className="text-sm font-medium mb-3">Revenue Trend</h4>
        <div className="space-y-2">
          {months.map(([month, data]) => (
            <div key={month} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{month}</span>
                <span className="text-muted-foreground">
                  {data.deals} deals · {formatCurrency(data.commission)}
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${(data.commission / maxCommission) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
