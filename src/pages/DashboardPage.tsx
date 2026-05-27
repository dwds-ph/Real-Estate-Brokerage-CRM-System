import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/hooks/useFirestore";
import { Lead, Listing, Viewing, Deal, TaskItem, Payout, License, Payment, Tour } from "@/types";
import { formatCurrency, timeAgo, getLeadStatusColor, cn } from "@/lib/utils";
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

  const isBroker = userProfile?.role === "broker";
  const myLeads = isBroker
    ? leads
    : leads.filter((l) => l.assignedTo === userProfile?.id);
  const myTasks = tasks.filter(
    (t) => t.agentId === userProfile?.id && t.status === "pending",
  );
  const upcomingViewings = viewings
    .filter((v) => v.status === "scheduled")
    .sort((a, b) => a.scheduledAt - b.scheduledAt)
    .slice(0, 5);
  const closedDeals = deals.filter((d) => d.status === "closed");
  const totalCommission = payouts
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount, 0);

  // ─── Smart Reminders ──────────────────────────────────────────
  const now = Date.now();
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

  const todayTours = tours.filter(
    (t) =>
      (t as Tour).status === "confirmed" &&
      new Date((t as Tour).scheduledDate).toDateString() === new Date().toDateString(),
  );

  const staleDeals = deals.filter(
    (d) =>
      d.status === "pending" &&
      d.createdAt < now - SEVEN_DAYS &&
      d.createdAt > 0,
  );

  const urgentItems = [
    ...expiringLicenses.slice(0, 3).map((l) => ({
      icon: "🆔",
      label: `License expiring: ${(l as License).licenseNumber}`,
      days: Math.ceil(((l as License).expiryDate - now) / 86400000).toString(),
      href: "/licenses",
    })),
    ...overduePayments.slice(0, 3).map((p) => ({
      icon: "💵",
      label: `Overdue payment: ${(p as Payment).label}`,
      days: `₱${(p as Payment).amount.toLocaleString()}`,
      href: "/deals",
    })),
    ...todayTours.slice(0, 3).map((t) => ({
      icon: "📍",
      label: `Tour today: ${(t as Tour).title}`,
      days: "Today",
      href: "/tours",
    })),
    ...staleDeals.slice(0, 3).map((d) => ({
      icon: "🏆",
      label: `Stale deal: ${d.clientName}`,
      days: `${Math.ceil((now - d.createdAt) / 86400000)}d`,
      href: "/deals",
    })),
  ];

  const totalUrgent =
    expiringLicenses.length +
    overduePayments.length +
    todayTours.length +
    staleDeals.length;

  const leadsByStatus = [
    "new",
    "contacted",
    "viewed",
    "negotiating",
    "closed",
    "lost",
  ].map((status) => ({
    status,
    count: myLeads.filter((l) => l.status === status).length,
  }));

  const leadsBySource = ["facebook", "manual", "referral", "walk-in"].map(
    (source) => ({
      source,
      count: myLeads.filter((l) => l.source === source).length,
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isBroker ? "Broker Command Center" : "My Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {userProfile?.displayName}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Leads</p>
          <p className="text-2xl font-bold">{myLeads.length}</p>
          <div className="mt-2 flex gap-1">
            {leadsByStatus.map((s) => (
              <div
                key={s.status}
                className="h-1.5 flex-1 rounded-full bg-muted"
                title={`${s.status}: ${s.count}`}
              >
                <div
                  className={cn("h-full rounded-full", {
                    "bg-blue-500": s.status === "new",
                    "bg-yellow-500": s.status === "contacted",
                    "bg-purple-500": s.status === "viewed",
                    "bg-orange-500": s.status === "negotiating",
                    "bg-green-500": s.status === "closed",
                    "bg-red-500": s.status === "lost",
                  })}
                  style={{
                    width: `${myLeads.length > 0 ? (s.count / myLeads.length) * 100 : 0}%`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Active Listings</p>
          <p className="text-2xl font-bold">
            {listings.filter((l) => l.status === "available").length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {listings.length} total
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Upcoming Viewings</p>
          <p className="text-2xl font-bold">{upcomingViewings.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {viewings.length} total
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Commission Earned</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totalCommission)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {closedDeals.length} closed deals
          </p>
        </div>
      </div>

      {isBroker && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total Agents</p>
            <p className="text-2xl font-bold">
              {leads.filter((l) => l.assignedTo).length > 0
                ? new Set(leads.map((l) => l.assignedTo)).size
                : 0}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Commission Forecast</p>
            <p className="text-2xl font-bold text-yellow-600">
              {formatCurrency(
                deals
                  .filter((d) => d.status === "pending")
                  .reduce((s, d) => s + d.dealPrice * 0.03, 0),
              )}
            </p>
          </div>
        </div>
      )}

      {/* ⚠️ Needs Attention */}
      {totalUrgent > 0 && (
        <div className="rounded-lg border border-red-200 bg-card p-6 dark:border-red-900">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚠️</span>
            <h2 className="text-lg font-semibold">Needs Attention</h2>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300">
              {totalUrgent} items
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {urgentItems.map((item, i) => (
              <button
                key={i}
                onClick={() => navigate(item.href)}
                className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-left text-sm hover:bg-muted/50 transition-colors"
              >
                <span className="text-lg shrink-0">{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.days}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Status */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Pipeline Status</h2>
          <div className="space-y-3">
            {leadsByStatus.map((s) => (
              <div key={s.status} className="flex items-center gap-3">
                <span className="w-24 text-xs capitalize text-muted-foreground">
                  {s.status}
                </span>
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", {
                      "bg-blue-500": s.status === "new",
                      "bg-yellow-500": s.status === "contacted",
                      "bg-purple-500": s.status === "viewed",
                      "bg-orange-500": s.status === "negotiating",
                      "bg-green-500": s.status === "closed",
                      "bg-red-500": s.status === "lost",
                    })}
                    style={{
                      width: `${myLeads.length > 0 ? (s.count / myLeads.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-medium">
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Sources */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Lead Sources</h2>
          <div className="space-y-3">
            {leadsBySource.map((s) => (
              <div key={s.source} className="flex items-center gap-3">
                <span className="w-24 text-xs capitalize text-muted-foreground">
                  {s.source === "facebook"
                    ? "📘"
                    : s.source === "manual"
                      ? "✍️"
                      : s.source === "referral"
                        ? "🤝"
                        : "🚶"}{" "}
                  {s.source}
                </span>
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${myLeads.length > 0 ? (s.count / myLeads.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-medium">
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Viewings + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">📅 Upcoming Viewings</h2>
          {upcomingViewings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No upcoming viewings
            </p>
          ) : (
            <div className="space-y-2">
              {upcomingViewings.map((v) => (
                <div key={v.id} className="rounded-lg bg-muted p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {new Date(v.scheduledAt).toLocaleDateString()}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(v.scheduledAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Listing: {v.listingId}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">✅ Pending Tasks</h2>
          {myTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending tasks</p>
          ) : (
            <div className="space-y-2">
              {myTasks.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg bg-muted p-3 text-sm flex items-center gap-2"
                >
                  <span
                    className={cn("h-2 w-2 rounded-full", {
                      "bg-red-500": t.priority === "high",
                      "bg-yellow-500": t.priority === "medium",
                      "bg-green-500": t.priority === "low",
                    })}
                  />
                  <span>{t.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Leads */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Leads</h2>
        {myLeads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leads yet</p>
        ) : (
          <div className="space-y-2">
            {[...myLeads]
              .sort((a, b) => b.createdAt - a.createdAt)
              .slice(0, 5)
              .map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between rounded-lg bg-muted p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {lead.source} • {timeAgo(lead.createdAt)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      getLeadStatusColor(lead.status),
                    )}
                  >
                    {lead.status}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Activity Feed */}
      <div className="rounded-lg border bg-card p-6">
        <ActivityFeed compact />
      </div>

      {/* Broker-specific: Leaderboard */}
      {isBroker && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">🏆 Agent Leaderboard</h2>
          <p className="text-sm text-muted-foreground">
            Coming soon — sortable by leads, closings, and commissions
          </p>
        </div>
      )}
    </div>
  );
}
