import { memo, useMemo } from "react";
import { MarketOverview as MarketOverviewType } from "@/lib/marketReport";
import { formatCurrency, formatCompactCurrency } from "@/lib/marketReport";

interface MarketOverviewProps {
  overview: MarketOverviewType;
}

function MarketOverview({ overview }: MarketOverviewProps) {
  const stats = useMemo(
    () => [
      {
        label: "Total Listings",
        value: overview.totalListings,
        sub: `${overview.totalActive} active · ${overview.totalSold} sold`,
        color: "text-blue-600",
      },
      {
        label: "Total Volume",
        value: formatCompactCurrency(overview.totalVolume),
        sub: "From closed deals",
        color: "text-green-600",
      },
      {
        label: "Average Price",
        value: formatCurrency(overview.averagePrice),
        sub: `Median: ${formatCurrency(overview.medianPrice)}`,
        color: "text-purple-600",
      },
      {
        label: "Price Range",
        value: `${formatCurrency(overview.minPrice)} – ${formatCurrency(overview.maxPrice)}`,
        sub: "Min to max",
        color: "text-orange-600",
      },
      {
        label: "Avg. Price / sqm",
        value: formatCurrency(overview.averagePricePerSqm),
        sub: "Per square meter",
        color: "text-cyan-600",
      },
      {
        label: "Avg. Days on Market",
        value: `${overview.averageDaysOnMarket}`,
        sub: "Days from listing",
        color: "text-rose-600",
      },
    ],
    [overview],
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-lg border bg-card p-4 flex flex-col"
        >
          <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
          <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          <p className="text-xs text-muted-foreground mt-auto pt-1">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}

export default memo(MarketOverview);
