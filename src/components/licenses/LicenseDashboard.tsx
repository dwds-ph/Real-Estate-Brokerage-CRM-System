import { License } from "@/types";
import { cn } from "@/lib/utils";

interface LicenseDashboardProps {
  licenses: License[];
}

export default function LicenseDashboard({
  licenses,
}: LicenseDashboardProps) {
  const active = licenses.filter((l) => l.status === "active").length;
  const expiringSoon = licenses.filter(
    (l) => l.status === "expiring-soon",
  ).length;
  const expired = licenses.filter((l) => l.status === "expired").length;
  const renewed = licenses.filter((l) => l.status === "renewed").length;

  const stats = [
    {
      label: "Active",
      value: active,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950",
      border: "border-green-200 dark:border-green-800",
    },
    {
      label: "Expiring Soon",
      value: expiringSoon,
      color: "text-yellow-600",
      bg: "bg-yellow-50 dark:bg-yellow-950",
      border: "border-yellow-200 dark:border-yellow-800",
    },
    {
      label: "Expired",
      value: expired,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950",
      border: "border-red-200 dark:border-red-800",
    },
    {
      label: "Renewed",
      value: renewed,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
      border: "border-blue-200 dark:border-blue-800",
    },
  ];

  const complianceRate =
    licenses.length > 0
      ? Math.round(
          ((active + renewed) / licenses.length) * 100,
        )
      : 100;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className={cn(
              "rounded-lg border p-4",
              s.bg,
              s.border,
            )}
          >
            <p className={cn("text-2xl font-bold", s.color)}>
              {s.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Overall Compliance</p>
          <span
            className={cn("text-sm font-bold", {
              "text-green-600": complianceRate >= 80,
              "text-yellow-600":
                complianceRate >= 50 && complianceRate < 80,
              "text-red-600": complianceRate < 50,
            })}
          >
            {complianceRate}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              complianceRate >= 80
                ? "bg-green-500"
                : complianceRate >= 50
                  ? "bg-yellow-500"
                  : "bg-red-500",
            )}
            style={{ width: `${complianceRate}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {licenses.length} total licenses tracked ·{" "}
          {active + renewed} in good standing
        </p>
      </div>

      {/* Alert for urgent items */}
      {expired > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 p-3">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            ⚠️ {expired} expired license{expired > 1 ? "s" : ""} — renew
            immediately
          </p>
        </div>
      )}
      {expiringSoon > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950 p-3">
          <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
            ⏰ {expiringSoon} license{expiringSoon > 1 ? "s" : ""} expiring
            within 30 days
          </p>
        </div>
      )}
    </div>
  );
}
