import { LocationData, formatCurrency, formatCompactCurrency } from "@/lib/marketReport";

interface LocationAnalysisProps {
  locations: LocationData[];
}

export default function LocationAnalysis({
  locations,
}: LocationAnalysisProps) {
  if (locations.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        No location data available
      </div>
    );
  }

  const maxCount = Math.max(...locations.map((l) => l.count));
  const uniqueProvinces = [...new Set(locations.map((l) => l.province))];

  return (
    <div className="space-y-6">
      {/* Province summary */}
      {uniqueProvinces.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {uniqueProvinces.map((province) => {
            const provinceLocations = locations.filter(
              (l) => l.province === province,
            );
            const totalListings = provinceLocations.reduce(
              (s, l) => s + l.count,
              0,
            );
            const totalVolume = provinceLocations.reduce(
              (s, l) => s + l.totalVolume,
              0,
            );
            return (
              <div
                key={province}
                className="rounded-lg border bg-card px-4 py-3 flex-1 min-w-[200px]"
              >
                <p className="font-medium text-sm">{province || "Unknown"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalListings} listings ·{" "}
                  {formatCompactCurrency(totalVolume)} volume
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* City breakdown */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left font-medium">City</th>
                <th className="px-3 py-2 text-left font-medium">Province</th>
                <th className="px-3 py-2 text-right font-medium">
                  Listings
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  Avg Price
                </th>
                <th className="px-3 py-2 text-right font-medium">Volume</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => {
                const barWidth =
                  maxCount > 0
                    ? Math.max((loc.count / maxCount) * 100, 3)
                    : 0;
                return (
                  <tr
                    key={loc.city}
                    className="border-b last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-3 py-2 font-medium">{loc.city}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {loc.province}
                    </td>
                    <td className="px-3 py-2 text-right">{loc.count}</td>
                    <td className="px-3 py-2 text-right">
                      {formatCurrency(loc.averagePrice)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatCompactCurrency(loc.totalVolume)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="h-4 rounded bg-muted overflow-hidden">
                        <div
                          className="h-full rounded bg-primary/60"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
