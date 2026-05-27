import { useMemo } from "react";
import { Project, Unit, PaymentMilestone } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface DeveloperDashboardProps {
  projects: Project[];
  units: Unit[];
  milestones: PaymentMilestone[];
  loading?: boolean;
}

export default function DeveloperDashboard({
  projects,
  units,
  milestones,
  loading = false,
}: DeveloperDashboardProps) {
  const stats = useMemo(() => {
    const activeProjects = projects.filter((p) => p.status === "ongoing" || p.status === "pre-selling");
    const totalSold = units.filter((u) => u.status === "sold").length;
    const totalReserved = units.filter((u) => u.status === "reserved" || u.status === "under-contract").length;
    const totalRevenue = units
      .filter((u) => u.status === "sold")
      .reduce((sum, u) => sum + u.price, 0);
    const overdueMilestones = milestones.filter((m) => m.status === "overdue");
    const totalPending = milestones
      .filter((m) => m.status === "pending")
      .reduce((sum, m) => sum + m.amount, 0);

    // Revenue by project
    const revenueByProject = projects.map((p) => {
      const projectUnits = units.filter((u) => u.projectId === p.id && u.status === "sold");
      const revenue = projectUnits.reduce((sum, u) => sum + u.price, 0);
      return { name: p.name, revenue, unitCount: projectUnits.length };
    }).sort((a, b) => b.revenue - a.revenue);

    return {
      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      totalUnits: units.length,
      totalSold,
      totalReserved,
      totalRevenue,
      averagePrice: totalSold > 0 ? Math.round(totalRevenue / totalSold) : 0,
      sellThrough: units.length > 0 ? Math.round((totalSold / units.length) * 100) : 0,
      overdueMilestones: overdueMilestones.length,
      totalPending,
      revenueByProject,
    };
  }, [projects, units, milestones]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-2xl font-bold">{stats.activeProjects}</p>
          <p className="text-xs text-muted-foreground">Active Projects</p>
          <p className="text-[10px] text-muted-foreground">of {stats.totalProjects} total</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-2xl font-bold">{stats.totalSold}</p>
          <p className="text-xs text-muted-foreground">Units Sold</p>
          <p className="text-[10px] text-muted-foreground">{stats.totalReserved} reserved</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
          <p className="text-xs text-muted-foreground">Total Revenue</p>
          <p className="text-[10px] text-muted-foreground">Avg: {formatCurrency(stats.averagePrice)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-2xl font-bold">{stats.sellThrough}%</p>
          <p className="text-xs text-muted-foreground">Sell-Through Rate</p>
          <p className="text-[10px] text-muted-foreground">{stats.totalUnits} total units</p>
        </div>
      </div>

      {/* Sell-through progress */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Overall Sell-Through</h3>
          <span className="text-xs text-muted-foreground">{stats.sellThrough}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(stats.sellThrough, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{stats.totalSold} sold</span>
          <span>{stats.totalReserved} reserved</span>
          <span>{stats.totalUnits - stats.totalSold - stats.totalReserved} available</span>
        </div>
      </div>

      {/* Revenue by project */}
      {stats.revenueByProject.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">Revenue by Project</h3>
          <div className="space-y-2">
            {stats.revenueByProject.map((p) => {
              const maxRevenue = stats.revenueByProject[0]?.revenue || 1;
              const barWidth = Math.max(5, (p.revenue / maxRevenue) * 100);
              return (
                <div key={p.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="truncate flex-1">{p.name}</span>
                    <span className="font-medium">{formatCurrency(p.revenue)}</span>
                    <span className="text-muted-foreground ml-2">({p.unitCount} units)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Alerts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-4">
          <p className="text-lg font-bold text-red-600">{stats.overdueMilestones}</p>
          <p className="text-xs text-red-600">Overdue Payments</p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 p-4">
          <p className="text-lg font-bold text-yellow-600">{formatCurrency(stats.totalPending)}</p>
          <p className="text-xs text-yellow-600">Pending Collections</p>
        </div>
      </div>
    </div>
  );
}
