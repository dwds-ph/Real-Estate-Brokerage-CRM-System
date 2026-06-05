import { useState } from "react";
import { useCollection } from "@/hooks/useFirestore";
import { Deal, Payout, AppUser } from "@/types";
import { computeFullBreakdown } from "@/lib/commissionEngine";
import { formatCurrency } from "@/lib/utils";
import { getVirtualListStyle } from "@/lib/virtualList";
import CommissionBreakdownView from "@/components/commissions/CommissionBreakdown";
import AgentCommissionSummary from "@/components/commissions/AgentCommissionSummary";
import CommissionPlanManager from "@/components/commissions/CommissionPlanManager";

type Tab = "overview" | "plans" | "calculator" | "agents";

export default function CommissionsPage() {
  const {
    data: deals,
    loading: dealsLoading,
    error: dealsError,
  } = useCollection<Deal>("deals", []);
  const { data: payouts, error: payoutsError } = useCollection<Payout>(
    "payouts",
    [],
  );
  const { data: agents, error: agentsError } = useCollection<AppUser>(
    "users",
    [],
  );

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  const closedDeals = deals.filter(
    (d) => (d as Deal).status === "closed",
  ) as Deal[];
  const sortedDeals = [...closedDeals].sort(
    (a, b) => b.createdAt - a.createdAt,
  );

  const totalVolume = closedDeals.reduce((s, d) => s + d.dealPrice, 0);
  const totalPaid = payouts
    .filter((p) => (p as Payout).status === "paid")
    .reduce((s, p) => s + (p as Payout).amount, 0);
  const totalPending = payouts
    .filter((p) => (p as Payout).status === "pending")
    .reduce((s, p) => s + (p as Payout).amount, 0);
  const totalApproved = payouts
    .filter((p) => (p as Payout).status === "approved")
    .reduce((s, p) => s + (p as Payout).amount, 0);
  const dataError = dealsError || payoutsError || agentsError;

  const agentList = agents.map((a) => ({
    id: (a as AppUser).id,
    displayName: (a as AppUser).displayName,
  }));

  const tabs: Array<{ id: Tab; label: string; icon: string }> = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "plans", label: "Plans", icon: "📋" },
    { id: "calculator", label: "Calculator", icon: "🧮" },
    { id: "agents", label: "Agents", icon: "👤" },
  ];

  // Calculator state
  const [calcPrice, setCalcPrice] = useState("");
  const [calcPercent, setCalcPercent] = useState("3");
  const [calcBrokerSplit, setCalcBrokerSplit] = useState("30");
  const [calcAgentSplit, setCalcAgentSplit] = useState("70");
  const [calcCoBroking, setCalcCoBroking] = useState(false);
  const [calcCoBrokingSplit, setCalcCoBrokingSplit] = useState("50");
  const [calcReferral, setCalcReferral] = useState(false);
  const [calcReferralPct, setCalcReferralPct] = useState("0");

  const calcBreakdown =
    calcPrice && calcPercent
      ? computeFullBreakdown({
          dealPrice: Number(calcPrice),
          customPercent: Number(calcPercent),
          splitConfig: {
            brokerRate: Number(calcBrokerSplit) / 100,
            agentRate: Number(calcAgentSplit) / 100,
            coBroking: calcCoBroking
              ? {
                  enabled: true,
                  agent2Id: "",
                  agent2Name: "",
                  splitPercent: Number(calcCoBrokingSplit),
                }
              : undefined,
            referralPercent: calcReferral ? Number(calcReferralPct) : undefined,
            referralName: calcReferral ? "Referral Partner" : undefined,
          },
        })
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Commissions</h1>
          <p className="text-sm text-muted-foreground">
            {closedDeals.length} closed deals | ₱{totalVolume.toLocaleString()}{" "}
            total volume | ₱{totalPaid.toLocaleString()} paid
          </p>
        </div>
      </div>

      {dataError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-medium text-sm">Error loading commission data</p>
          <p className="text-xs mt-1">{dataError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-xs font-medium underline underline-offset-2 hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">Total Volume</p>
              <p className="text-xl font-bold">{formatCurrency(totalVolume)}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">Total Paid</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(totalPaid)}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-xl font-bold text-yellow-600">
                {formatCurrency(totalPending)}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">Approved</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(totalApproved)}
              </p>
            </div>
          </div>

          {/* Closed Deals Table */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Closed Deals</h2>
            {dealsLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : sortedDeals.length === 0 ? (
              <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
                No closed deals yet
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-12rem)]">
                {sortedDeals.map((deal, index) => {
                  const isSelected = selectedDealId === deal.id;
                  return (
                    <div key={deal.id} style={getVirtualListStyle(index, 88)}>
                      <button
                        onClick={() =>
                          setSelectedDealId(isSelected ? null : deal.id)
                        }
                        className="w-full rounded-lg border bg-card p-4 text-left hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">
                              {deal.clientName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {deal.clientContact}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">
                              {formatCurrency(deal.dealPrice)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(deal.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {deal.commission && (
                          <div className="mt-1.5 flex gap-3 text-xs text-muted-foreground border-t pt-1.5">
                            <span>
                              Gross: {formatCurrency(deal.commission.total)}
                            </span>
                            <span>
                              Agent:{" "}
                              {formatCurrency(deal.commission.agentShare)}
                            </span>
                            <span>
                              Broker:{" "}
                              {formatCurrency(deal.commission.brokerShare)}
                            </span>
                            {deal.coBroking?.enabled && (
                              <span>
                                Co:{" "}
                                {formatCurrency(
                                  deal.commission.agent2Share ?? 0,
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </button>

                      {/* Expanded breakdown */}
                      {isSelected && (
                        <div className="mt-2">
                          <CommissionBreakdownView
                            breakdown={computeFullBreakdown({
                              dealPrice: deal.dealPrice,
                              dealId: deal.id,
                              dealClientName: deal.clientName,
                            })}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Tab: Plans */}
      {activeTab === "plans" && (
        <div className="rounded-lg border bg-card p-6">
          <CommissionPlanManager />
        </div>
      )}

      {/* Tab: Calculator */}
      {activeTab === "calculator" && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-4">Commission Estimator</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Deal Price (₱)
                  </label>
                  <input
                    type="number"
                    value={calcPrice}
                    onChange={(e) => setCalcPrice(e.target.value)}
                    placeholder="e.g. 5000000"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Commission %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={calcPercent}
                    onChange={(e) => setCalcPercent(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">
                  Split Configuration
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-0.5">
                      Broker Split (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={calcBrokerSplit}
                      onChange={(e) => setCalcBrokerSplit(e.target.value)}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-0.5">
                      Agent Split (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={calcAgentSplit}
                      onChange={(e) => setCalcAgentSplit(e.target.value)}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={calcCoBroking}
                    onChange={(e) => setCalcCoBroking(e.target.checked)}
                    className="rounded"
                  />
                  Co-Broking Split
                </label>
                {calcCoBroking && (
                  <div className="ml-6">
                    <label className="block text-xs text-muted-foreground mb-0.5">
                      Split to Co-Broker (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={calcCoBrokingSplit}
                      onChange={(e) => setCalcCoBrokingSplit(e.target.value)}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={calcReferral}
                    onChange={(e) => setCalcReferral(e.target.checked)}
                    className="rounded"
                  />
                  Referral Fee
                </label>
                {calcReferral && (
                  <div className="ml-6">
                    <label className="block text-xs text-muted-foreground mb-0.5">
                      Referral (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={calcReferralPct}
                      onChange={(e) => setCalcReferralPct(e.target.value)}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            {calcBreakdown ? (
              <CommissionBreakdownView breakdown={calcBreakdown} />
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border bg-muted/30 p-8 text-sm text-muted-foreground">
                Enter a deal price to see the breakdown
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Agents */}
      {activeTab === "agents" && (
        <div className="rounded-lg border bg-card p-6">
          <AgentCommissionSummary
            deals={closedDeals}
            payouts={payouts as Payout[]}
            agents={agentList}
          />
        </div>
      )}
    </div>
  );
}
