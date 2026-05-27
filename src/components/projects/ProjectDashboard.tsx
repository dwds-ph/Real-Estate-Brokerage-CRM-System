import { Project } from "@/types";

interface ProjectDashboardProps {
  projects: Project[];
}

export default function ProjectDashboard({
  projects,
}: ProjectDashboardProps) {
  const preSelling = projects.filter((p) => p.status === "pre-selling").length;
  const ongoing = projects.filter((p) => p.status === "ongoing").length;
  const completed = projects.filter((p) => p.status === "completed").length;
  const onHold = projects.filter((p) => p.status === "on-hold").length;

  const totalUnits = projects.reduce((s, p) => s + p.totalUnits, 0);
  const availableUnits = projects.reduce((s, p) => s + p.availableUnits, 0);
  const soldUnits = totalUnits - availableUnits;
  const soldPct = totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0;

  const totalVolume = projects.reduce(
    (s, p) => s + (p.priceRange.min + p.priceRange.max) / 2 * (p.totalUnits - p.availableUnits),
    0,
  );
  const totalPhases = projects.reduce((s, p) => s + p.phases.length, 0);

  const stats = [
    {
      label: "Total Projects",
      value: projects.length,
      sub: `${ongoing} ongoing · ${preSelling} pre-selling`,
      color: "text-blue-600",
    },
    {
      label: "Total Units",
      value: totalUnits,
      sub: `${soldUnits} sold · ${availableUnits} available`,
      color: "text-purple-600",
    },
    {
      label: "Sold Rate",
      value: `${soldPct}%`,
      sub: `${soldUnits} of ${totalUnits} units`,
      color: soldPct >= 50 ? "text-green-600" : "text-yellow-600",
    },
    {
      label: "Total Phases",
      value: totalPhases,
      sub: `Across ${projects.length} projects`,
      color: "text-cyan-600",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            <p className="text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Overall sold progress */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Overall Unit Sales Progress</p>
          <span
            className={`text-sm font-bold ${
              soldPct >= 80
                ? "text-green-600"
                : soldPct >= 50
                  ? "text-yellow-600"
                  : "text-blue-600"
            }`}
          >
            {soldPct}%
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              soldPct >= 80
                ? "bg-green-500"
                : soldPct >= 50
                  ? "bg-yellow-500"
                  : "bg-blue-500"
            }`}
            style={{ width: `${soldPct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {soldUnits} units sold out of {totalUnits} across {projects.length} projects
          · Est. volume: ₱{(totalVolume / 1_000_000).toFixed(0)}M
        </p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-center">
          <p className="text-lg font-bold text-blue-600">{preSelling}</p>
          <p className="text-xs text-blue-600/80">Pre-Selling</p>
        </div>
        <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3 text-center">
          <p className="text-lg font-bold text-green-600">{ongoing}</p>
          <p className="text-xs text-green-600/80">Ongoing</p>
        </div>
        <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3 text-center">
          <p className="text-lg font-bold text-gray-600">{completed}</p>
          <p className="text-xs text-gray-600/80">Completed</p>
        </div>
        <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-3 text-center">
          <p className="text-lg font-bold text-yellow-600">{onHold}</p>
          <p className="text-xs text-yellow-600/80">On Hold</p>
        </div>
      </div>
    </div>
  );
}
