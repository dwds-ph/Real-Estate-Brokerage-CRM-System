import { MonthlyTrend } from "@/lib/marketReport";
import { formatCurrency, formatCompactCurrency } from "@/lib/marketReport";

interface PriceTrendsProps {
  trends: MonthlyTrend[];
}

export default function PriceTrends({ trends }: PriceTrendsProps) {
  if (trends.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        No trend data available yet
      </div>
    );
  }

  const maxPrice = Math.max(...trends.map((t) => t.averagePrice));
  const maxVolume = Math.max(...trends.map((t) => t.totalVolume));

  // Show last 12 months max
  const displayTrends = trends.slice(-12);

  return (
    <div className="space-y-6">
      {/* Price trend bars */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold mb-4">
          Average Price Trend
        </h3>
        <div className="space-y-1">
          {displayTrends.map((t) => {
            const height =
              maxPrice > 0
                ? Math.max((t.averagePrice / maxPrice) * 100, 5)
                : 0;
            return (
              <div key={t.month} className="flex items-center gap-3">
                <span className="w-16 text-xs text-muted-foreground shrink-0">
                  {t.month}
                </span>
                <div className="flex-1 h-5 rounded bg-muted overflow-hidden relative">
                  <div
                    className="h-full rounded bg-primary transition-all duration-500"
                    style={{ width: `${height}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-primary-foreground mix-blend-difference">
                    {formatCurrency(t.averagePrice)}
                  </span>
                </div>
                <span className="w-12 text-right text-xs text-muted-foreground shrink-0">
                  {t.listingCount}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Month</span>
          <span>Price</span>
          <span>#</span>
        </div>
      </div>

      {/* Volume trend */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold mb-4">
          Monthly Volume
        </h3>
        <div className="flex items-end gap-1 h-32">
          {displayTrends.map((t) => {
            const height =
              maxVolume > 0
                ? Math.max((t.totalVolume / maxVolume) * 100, 3)
                : 0;
            return (
              <div
                key={t.month}
                className="flex-1 flex flex-col items-center gap-1"
                title={`${t.month}: ${formatCompactCurrency(t.totalVolume)}`}
              >
                <span className="text-[10px] text-muted-foreground">
                  {formatCompactCurrency(t.totalVolume)}
                </span>
                <div
                  className="w-full rounded-t bg-gradient-to-t from-green-500 to-green-400 transition-all duration-500"
                  style={{ height: `${height}%` }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {t.month.slice(-2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left font-medium">Month</th>
                <th className="px-3 py-2 text-right font-medium">
                  Avg Price
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  Median
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  Volume
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  Listings
                </th>
              </tr>
            </thead>
            <tbody>
              {displayTrends
                .slice()
                .reverse()
                .map((t) => (
                  <tr key={t.month} className="border-b last:border-0">
                    <td className="px-3 py-2 text-muted-foreground">
                      {t.month}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatCurrency(t.averagePrice)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatCurrency(t.medianPrice)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatCompactCurrency(t.totalVolume)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {t.listingCount}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
