import {
  PropertyTypeBreakdown,
  StatusBreakdown,
  formatCurrency,
  getPropertyTypeColor,
  getStatusColor,
} from "@/lib/marketReport";

interface PropertyBreakdownProps {
  propertyTypes: PropertyTypeBreakdown[];
  statusBreakdown: StatusBreakdown[];
}

export default function PropertyBreakdown({
  propertyTypes,
  statusBreakdown,
}: PropertyBreakdownProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Property Type Distribution */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold mb-4">
          By Property Type
        </h3>
        {propertyTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data</p>
        ) : (
          <div className="space-y-3">
            {propertyTypes.map((t) => (
              <div key={t.type}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{t.label}</span>
                  <span className="text-muted-foreground">
                    {t.count} ({t.percentage}%)
                  </span>
                </div>
                <div className="h-5 rounded bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded ${getPropertyTypeColor(t.type)} transition-all duration-500`}
                    style={{ width: `${t.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Avg: {formatCurrency(t.averagePrice)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Distribution */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold mb-4">
          By Status
        </h3>
        {statusBreakdown.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data</p>
        ) : (
          <div className="space-y-3">
            {statusBreakdown.map((s) => (
              <div key={s.status}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{s.label}</span>
                  <span className="text-muted-foreground">
                    {s.count} ({s.percentage}%)
                  </span>
                </div>
                <div className="h-5 rounded bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded ${getStatusColor(s.status)} transition-all duration-500`}
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Donut-style summary cards */}
      <div className="rounded-lg border bg-card p-4 md:col-span-2">
        <h3 className="text-sm font-semibold mb-4">Quick Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {propertyTypes.map((t) => (
            <div
              key={t.type}
              className="flex flex-col items-center rounded-lg bg-muted/30 p-3"
            >
              <span className="text-lg font-bold">{t.count}</span>
              <span className="text-xs text-muted-foreground text-center">
                {t.label}
              </span>
              <div
                className={`mt-2 h-1.5 w-full rounded-full ${getPropertyTypeColor(t.type)}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
