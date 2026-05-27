import { useAuth } from "@/context/AuthContext";
import { useAnalyticsPage } from "@/hooks/useAnalyticsPage";
import { cn, formatCurrency } from "@/lib/utils";
import ConversionFunnel from "@/components/analytics/ConversionFunnel";
import AgentPerformanceBoard from "@/components/analytics/AgentPerformanceBoard";
import ExpenseVsCommission from "@/components/analytics/ExpenseVsCommission";
import ListingPerformance from "@/components/analytics/ListingPerformance";
import SourceAnalytics from "@/components/analytics/SourceAnalytics";
import DateRangePicker from "@/components/analytics/DateRangePicker";

const TABS = [
  { id: "funnel", label: "Funnel", icon: "🔽" },
  { id: "agents", label: "Agent Performance", icon: "👤" },
  { id: "pnl", label: "P&L", icon: "📊" },
  { id: "listings", label: "Listings", icon: "🏠" },
  { id: "sources", label: "Sources", icon: "📡" },
];

function exportToCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function AnalyticsPage() {
  const { userProfile } = useAuth();
  const {
    activeTab,
    setActiveTab,
    dateRange,
    setDateRange,
    leads,
    deals,
    viewings,
    listings,
    expenses,
    agents,
    effectiveAgents,
    myLeads,
    isLoading,
    hasData,
    isBroker,
  } = useAnalyticsPage();

  const handleExport = () => {
    switch (activeTab) {
      case "funnel": {
        const headers = ["Stage", "Count"];
        const rows = [
          "new",
          "contacted",
          "viewed",
          "negotiating",
          "closed",
        ].map((stage) => [
          stage,
          String(leads.filter((l) => l.status === stage).length),
        ]);
        exportToCSV("lead-funnel", headers, rows);
        break;
      }
      case "agents": {
        const headers = [
          "Agent",
          "Leads",
          "Deals Closed",
          "Commission",
          "Conversion Rate",
          "Avg Response Time",
        ];
        const rows = (isBroker ? agents : effectiveAgents).map((a) => {
          const agentLeads = leads.filter((l) => l.assignedTo === a.id);
          const agentDeals = deals.filter(
            (d) => d.status === "closed" && d.createdBy === a.id,
          );
          const commission = agentDeals.reduce(
            (s, d) => s + (d.commission?.agentShare || 0),
            0,
          );
          const convRate =
            agentLeads.length > 0
              ? Math.round((agentDeals.length / agentLeads.length) * 100) + "%"
              : "0%";
          return [
            a.displayName,
            String(agentLeads.length),
            String(agentDeals.length),
            formatCurrency(commission),
            convRate,
            "—",
          ];
        });
        exportToCSV("agent-performance", headers, rows);
        break;
      }
      case "pnl": {
        const headers = ["Agent", "Expenses", "Commission", "Net", "ROI"];
        const rows = (isBroker ? agents : effectiveAgents).map((a) => {
          const fromTs = new Date(dateRange.from).getTime();
          const toTs = new Date(dateRange.to + "T23:59:59").getTime();
          const agentExpenses = expenses
            .filter(
              (e) => e.agentId === a.id && e.date >= fromTs && e.date <= toTs,
            )
            .reduce((s, e) => s + e.amount, 0);
          const agentCommission = deals
            .filter(
              (d) =>
                d.createdBy === a.id &&
                d.status === "closed" &&
                d.createdAt >= fromTs &&
                d.createdAt <= toTs,
            )
            .reduce((s, d) => s + (d.commission?.agentShare || 0), 0);
          const net = agentCommission - agentExpenses;
          const roi =
            agentExpenses > 0
              ? ((net / agentExpenses) * 100).toFixed(0) + "%"
              : "∞";
          return [
            a.displayName,
            formatCurrency(agentExpenses),
            formatCurrency(agentCommission),
            formatCurrency(net),
            roi,
          ];
        });
        exportToCSV("pnl-report", headers, rows);
        break;
      }
      case "listings": {
        const headers = [
          "Listing",
          "Views",
          "Inquiries",
          "Viewings Done",
          "Days on Market",
          "Converted",
        ];
        const rows = listings.map((l) => {
          const listingViewings = viewings.filter(
            (v) => v.listingId === l.id && v.status === "done",
          );
          const converted = deals.some(
            (d) => d.listingId === l.id && d.status === "closed",
          )
            ? "Yes"
            : "No";
          const dom = Math.floor(
            (Date.now() - l.createdAt) / (24 * 60 * 60 * 1000),
          );
          return [
            l.title,
            String(l.views || 0),
            String(l.inquiries || 0),
            String(listingViewings.length),
            `${dom}d`,
            converted,
          ];
        });
        exportToCSV("listing-performance", headers, rows);
        break;
      }
      case "sources": {
        const sources = ["facebook", "manual", "referral", "walk-in"];
        const headers = [
          "Source",
          "Total Leads",
          "Closed Deals",
          "Conversion Rate",
        ];
        const rows = sources.map((src) => {
          const srcLeads = leads.filter((l) => l.source === src);
          const closed = srcLeads.filter((l) => l.status === "closed").length;
          const rate =
            srcLeads.length > 0
              ? Math.round((closed / srcLeads.length) * 100) + "%"
              : "0%";
          return [src, String(srcLeads.length), String(closed), rate];
        });
        exportToCSV("source-analytics", headers, rows);
        break;
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground">
            {isBroker
              ? "Full business insights at a glance"
              : "Your performance overview"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button
            onClick={handleExport}
            disabled={!hasData}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              hasData
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((tab) => {
          // Agents can only see their own performance
          if (
            !isBroker &&
            tab.id !== "agents" &&
            tab.id !== "funnel" &&
            tab.id !== "sources" &&
            tab.id !== "listings"
          ) {
            return null;
          }
          // For non-broker, only show relevant tabs
          if (!isBroker && tab.id === "pnl") {
            return null;
          }
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30",
              )}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {isLoading ? (
          <div className="flex justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {activeTab === "funnel" && (
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Lead Conversion Funnel
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Track how leads progress through each stage of the pipeline
                </p>
                <ConversionFunnel leads={myLeads} isLoading={isLoading} />
              </div>
            )}

            {activeTab === "agents" && (
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Agent Performance
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Click column headers to sort.{" "}
                  {isBroker
                    ? "Showing all agents."
                    : "Showing your metrics only."}
                </p>
                <AgentPerformanceBoard
                  leads={leads}
                  deals={deals}
                  agents={effectiveAgents}
                  isLoading={isLoading}
                  currentUserId={userProfile?.id}
                  isBroker={isBroker}
                />
              </div>
            )}

            {activeTab === "pnl" && isBroker && (
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Profit & Loss Report
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Expenses claimed vs commission earned per agent
                </p>
                <ExpenseVsCommission
                  expenses={expenses}
                  deals={deals}
                  agents={agents}
                  dateRange={dateRange}
                  loading={isLoading}
                  isBroker={isBroker}
                  currentUserId={userProfile?.id}
                />
              </div>
            )}

            {activeTab === "listings" && (
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Listing Performance
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Views, inquiries, viewings, and conversion metrics per listing
                </p>
                <ListingPerformance
                  listings={listings}
                  viewings={viewings}
                  deals={deals}
                  loading={isLoading}
                />
              </div>
            )}

            {activeTab === "sources" && (
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Lead Source Analytics
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Conversion performance by acquisition channel
                </p>
                <SourceAnalytics leads={leads} loading={isLoading} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
