import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/hooks/useFirestore";
import {
  Lead,
  Listing,
  Viewing,
  Deal,
  TaskItem,
  Payout,
  License,
  Payment,
  Tour,
} from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import ActivityFeed from "@/components/automation/ActivityFeed";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { data: leads } = useCollection<Lead>("leads", []);
  const { data: listings } = useCollection<Listing>("listings", []);
  const { data: viewings } = useCollection<Viewing>("viewings", []);
  const { data: deals } = useCollection<Deal>("deals", []);
  const { data: tasks } = useCollection<TaskItem>("tasks", []);
  const { data: payouts } = useCollection<Payout>("payouts", []);
  const { data: licenses } = useCollection<License>("licenses", []);
  const { data: payments } = useCollection<Payment>("payments", []);
  const { data: tours } = useCollection<Tour>("tours", []);

  // ─── KPIs ─────────────────────────────────────────────────────────
  const totalLeads = leads.length;
  const activeListings = listings.filter(
    (l) => l.status === "available",
  ).length;
  const upcomingViewings = viewings.filter(
    (v) => v.status === "scheduled",
  ).length;
  const totalCommission = payouts
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount, 0);

  // ─── Smart Reminders ──────────────────────────────────────────
  const now = useMemo(() => Date.now(), []); // eslint-disable-line react-hooks/purity
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

  const expiringLicenses = licenses.filter(
    (l) =>
      (l as License).status === "active" &&
      (l as License).expiryDate > now &&
      (l as License).expiryDate < now + THIRTY_DAYS,
  );

  const overduePayments = payments.filter(
    (p) => (p as Payment).status === "overdue",
  );

  const todayTours = tours.filter((t) => {
    const tourDate = (t as Tour).scheduledDate;
    return tourDate && tourDate >= now && tourDate < now + 86400000;
  });

  const staleDeals = deals.filter(
    (d) =>
      (d as Deal).status === "pending" &&
      (d as Deal).updatedAt &&
      (d as Deal).updatedAt < now - SEVEN_DAYS,
  );

  const urgentCount =
    expiringLicenses.length +
    overduePayments.length +
    todayTours.length +
    staleDeals.length;

  // ─── Lead Pipeline ─────────────────────────────────────────────────
  const pipelineStages = [
    {
      label: "New",
      count: leads.filter((l) => l.status === "new").length,
      color: "bg-blue-500",
    },
    {
      label: "Contacted",
      count: leads.filter((l) => l.status === "contacted").length,
      color: "bg-yellow-500",
    },
    {
      label: "Viewed",
      count: leads.filter((l) => l.status === "viewed").length,
      color: "bg-purple-500",
    },
    {
      label: "Negotiating",
      count: leads.filter((l) => l.status === "negotiating").length,
      color: "bg-orange-500",
    },
    {
      label: "Closed",
      count: leads.filter((l) => l.status === "closed" || l.status === "lost")
        .length,
      color: "bg-green-500",
    },
  ];

  const totalPipeline = pipelineStages.reduce((s, st) => s + st.count, 0);

  // ─── Lead Sources ─────────────────────────────────────────────────
  const sourceColors: Record<string, string> = {
    facebook: "bg-blue-500",
    referral: "bg-green-500",
    "walk-in": "bg-yellow-500",
    website: "bg-purple-500",
    call: "bg-orange-500",
    sms: "bg-pink-500",
    email: "bg-teal-500",
    "open-house": "bg-indigo-500",
    event: "bg-red-500",
    other: "bg-gray-500",
  };

  const sourceCounts = leads.reduce(
    (acc, l) => {
      const src = (l as Lead).source || "other";
      acc[src] = (acc[src] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalSourceLeads = Object.values(sourceCounts).reduce(
    (s, c) => s + c,
    0,
  );

  // ─── Upcoming Viewings ─────────────────────────────────────────────
  const upcomingViewingsList = viewings
    .filter((v) => (v as Viewing).status === "scheduled")
    .sort(
      (a, b) =>
        ((a as Viewing).scheduledAt || 0) - ((b as Viewing).scheduledAt || 0),
    )
    .slice(0, 5);

  // ─── Pending Tasks ─────────────────────────────────────────────────
  const pendingTasks = tasks
    .filter((t) => (t as TaskItem).status !== "done")
    .sort(
      (a, b) =>
        ((a as TaskItem).dueDate || Infinity) -
        ((b as TaskItem).dueDate || Infinity),
    )
    .slice(0, 5);

  // ─── Activity Feed ──────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {userProfile && (
          <p className="text-sm text-muted-foreground">
            Welcome back, {userProfile.displayName || "User"}
          </p>
        )}
      </div>

      {/* Needs Attention */}
      {urgentCount > 0 && (
        <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <h2 className="font-semibold text-red-800">Needs Attention</h2>
            <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              {urgentCount}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {expiringLicenses.length > 0 && (
              <button
                onClick={() => navigate("/licenses")}
                className="rounded-lg border bg-white px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                📄 {expiringLicenses.length} license
                {expiringLicenses.length > 1 ? "s" : ""} expiring soon
              </button>
            )}
            {overduePayments.length > 0 && (
              <button
                onClick={() => navigate("/deals")}
                className="rounded-lg border bg-white px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                💰 {overduePayments.length} overdue payment
                {overduePayments.length > 1 ? "s" : ""}
              </button>
            )}
            {todayTours.length > 0 && (
              <button
                onClick={() => navigate("/tours")}
                className="rounded-lg border bg-white px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                🚗 {todayTours.length} tour{staleDeals.length > 1 ? "s" : ""}{" "}
                today
              </button>
            )}
            {staleDeals.length > 0 && (
              <button
                onClick={() => navigate("/deals")}
                className="rounded-lg border bg-white px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                📋 {staleDeals.length} stale deal
                {staleDeals.length > 1 ? "s" : ""} (7+ days)
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Total Leads
          </p>
          <p className="mt-1 text-2xl font-bold">{totalLeads}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Active Listings
          </p>
          <p className="mt-1 text-2xl font-bold">{activeListings}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Upcoming Viewings
          </p>
          <p className="mt-1 text-2xl font-bold">{upcomingViewings}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Commission Earned
          </p>
          <p className="mt-1 text-2xl font-bold">
            {formatCurrency(totalCommission)}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Lead Pipeline */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">Lead Pipeline</h2>
          <div className="space-y-2">
            {pipelineStages.map((stage) => (
              <div key={stage.label} className="flex items-center gap-2">
                <span className="w-20 text-xs text-muted-foreground">
                  {stage.label}
                </span>
                <div className="h-4 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      stage.color,
                    )}
                    style={{
                      width:
                        totalPipeline > 0
                          ? `${(stage.count / totalPipeline) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
                <span className="w-6 text-right text-xs font-medium">
                  {stage.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Sources */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">Lead Sources</h2>
          <div className="space-y-2">
            {Object.entries(sourceCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([source, count]) => (
                <div key={source} className="flex items-center gap-2">
                  <span className="w-20 text-xs capitalize text-muted-foreground">
                    {source.replace("-", " ")}
                  </span>
                  <div className="h-4 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        sourceColors[source] || "bg-gray-500",
                      )}
                      style={{
                        width:
                          totalSourceLeads > 0
                            ? `${(count / totalSourceLeads) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs font-medium">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Views Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Upcoming Viewings */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Upcoming Viewings</h2>
            <button
              onClick={() => navigate("/tours")}
              className="text-xs text-primary hover:underline"
            >
              View all
            </button>
          </div>
          {upcomingViewingsList.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No upcoming viewings
            </p>
          ) : (
            <div className="space-y-2">
              {upcomingViewingsList.map((v) => {
                const viewing = v as Viewing;
                return (
                  <div
                    key={viewing.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 p-2"
                  >
                    <div>
                      <p className="text-xs font-medium">Property Viewing</p>
                      <p className="text-[10px] text-muted-foreground">
                        {viewing.scheduledAt
                          ? new Date(viewing.scheduledAt).toLocaleString()
                          : "No date"}
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                      {viewing.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending Tasks */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Pending Tasks</h2>
            <button
              onClick={() => navigate("/tasks")}
              className="text-xs text-primary hover:underline"
            >
              View all
            </button>
          </div>
          {pendingTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground">No pending tasks</p>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map((t) => {
                const task = t as TaskItem;
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 p-2"
                  >
                    <div>
                      <p className="text-xs font-medium">{task.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {task.dueDate
                          ? `Due: ${new Date(task.dueDate).toLocaleDateString()}`
                          : "No due date"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        task.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700",
                      )}
                    >
                      {task.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">Recent Activity</h2>
        <ActivityFeed />
      </div>
    </div>
  );
}
