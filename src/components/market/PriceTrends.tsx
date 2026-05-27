import { memo, useMemo } from "react";
import { MonthlyTrend } from "@/lib/marketReport";
import { formatCurrency, formatCompactCurrency } from "@/lib/marketReport";

interface PriceTrendsProps {
  trends: MonthlyTrend[];
}

function PriceTrends({ trends }: PriceTrendsProps) {
  const maxPrice = useMemo(
    () =>
      trends.length > 0 ? Math.max(...trends.map((t) => t.averagePrice)) : 0,
    [trends],
  );
  const maxVolume = useMemo(
    () =>
      trends.length > 0 ? Math.max(...trends.map((t) => t.totalVolume)) : 0,
    [trends],
  );
  const displayTrends = useMemo(() => trends.slice(-12), [trends]);

  if (trends.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        No trend data available yet
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Price trend bars */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold mb-4">Average Price Trend</h3>
        <div className="space-y-2">
          {displayTrends.map((trend, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-24 text-xs text-muted-foreground shrink-0">
                {trend.month}
              </span>
              <div className="flex-1 flex items-center gap-2">
                <div
                  className="h-6 rounded bg-primary/20 transition-all"
                  style={{
                    width: `${Math.max((trend.averagePrice / maxPrice) * 100, 4)}%`,
                  }}
                />
                <span className="text-xs font-medium shrink-0">
                  {formatCurrency(trend.averagePrice)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Volume bars */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold mb-4">Monthly Volume</h3>
        <div className="space-y-2">
          {displayTrends.map((trend, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-24 text-xs text-muted-foreground shrink-0">
                {trend.month}
              </span>
              <div className="flex-1 flex items-center gap-2">
                <div
                  className="h-6 rounded bg-green-500/20 transition-all"
                  style={{
                    width: `${Math.max((trend.totalVolume / maxVolume) * 100, 4)}%`,
                  }}
                />
                <span className="text-xs font-medium shrink-0">
                  {formatCompactCurrency(trend.totalVolume)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 font-medium">Month</th>
              <th className="text-right p-2 font-medium">Avg Price</th>
              <th className="text-right p-2 font-medium">Median</th>
              <th className="text-right p-2 font-medium">Volume</th>
              <th className="text-right p-2 font-medium">Listings</th>
            </tr>
          </thead>
          <tbody>
            {displayTrends.map((trend, i) => (
              <tr key={i} className="border-t border-border/50">
                <td className="p-2">{trend.month}</td>
                <td className="p-2 text-right">
                  {formatCurrency(trend.averagePrice)}
                </td>
                <td className="p-2 text-right">
                  {formatCurrency(trend.medianPrice)}
                </td>
                <td className="p-2 text-right">
                  {formatCompactCurrency(trend.totalVolume)}
                </td>
                <td className="p-2 text-right">{trend.listingCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default memo(PriceTrends);
