import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLeads, useCollection, updateDocById } from "@/hooks/useFirestore";
import { Lead, LeadStatus, Deal, Mortgage } from "@/types";
import { formatCurrency, timeAgo, getScoreColor, cn } from "@/lib/utils";
import MortgageTracker from "@/components/mortgage/MortgageTracker";
import MortgageForm from "@/components/mortgage/MortgageForm";
import ReferralForm from "@/components/automation/ReferralForm";
import ReferralDashboard from "@/components/automation/ReferralDashboard";
import ChecklistWidget from "@/components/automation/ChecklistWidget";

const COLUMNS: { status: LeadStatus; label: string; color: string }[] = [
  { status: "new", label: "New", color: "border-t-blue-500" },
  { status: "contacted", label: "Contacted", color: "border-t-yellow-500" },
  { status: "viewed", label: "Viewed", color: "border-t-purple-500" },
  { status: "negotiating", label: "Negotiating", color: "border-t-orange-500" },
  { status: "closed", label: "Closed", color: "border-t-green-500" },
  { status: "lost", label: "Lost", color: "border-t-red-500" },
];

export default function DealsPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { data: allLeads, loading } = useLeads(userProfile?.id);
  const { data: allDeals } = useCollection<Deal>("deals");
  const { data: allMortgages } = useCollection<Mortgage>("mortgages");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [mortgageExpanded, setMortgageExpanded] = useState(false);
  const [expandedMortgageDeal, setExpandedMortgageDeal] = useState<
    string | null
  >(null);
  const [showMortgageForm, setShowMortgageForm] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | undefined>(
    undefined,
  );
  const [referralExpanded, setReferralExpanded] = useState(false);
  const [referralDealId, setReferralDealId] = useState<string | null>(null);
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [checklistExpanded, setChecklistExpanded] = useState(false);
  const [checklistDealId, setChecklistDealId] = useState<string | null>(null);

  const isBroker = userProfile?.role === "broker";

  // Map mortgages to deals
  const dealsWithMortgages = useMemo(() => {
    return allDeals
      .filter((deal) => allMortgages.some((m) => m.dealId === deal.id))
      .map((deal) => ({
        deal,
        mortgages: allMortgages.filter((m) => m.dealId === deal.id),
      }));
  }, [allDeals, allMortgages]);

  // Deals without mortgages (for "add mortgage" quick actions)
  const dealsWithoutMortgages = useMemo(() => {
    return allDeals.filter(
      (deal) => !allMortgages.some((m) => m.dealId === deal.id),
    );
  }, [allDeals, allMortgages]);

  const handleDragStart = (leadId: string) => {
    setDraggingId(leadId);
  };

  const handleDrop = useCallback(
    async (newStatus: LeadStatus) => {
      if (!draggingId) return;
      const now = Date.now();
      const lead = allLeads.find((l) => l.id === draggingId) as Lead;
      await updateDocById("leads", draggingId, {
        status: newStatus,
        activityTimeline: [
          ...(lead?.activityTimeline || []),
          {
            action: `Moved to ${newStatus}`,
            timestamp: now,
            by: userProfile?.displayName || "Unknown",
          },
        ],
      });
      setDraggingId(null);
    },
    [draggingId, allLeads, userProfile],
  );

  const getLeadsByStatus = (status: LeadStatus) =>
    allLeads.filter((l) => (l as Lead).status === status) as Lead[];

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deal Pipeline</h1>
          <p className="text-muted-foreground">
            {allLeads.length} total leads across {COLUMNS.length} stages
          </p>
        </div>
        <button
          onClick={() => navigate("/leads")}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + New Lead
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto">
        {COLUMNS.map((col) => {
          const columnLeads = getLeadsByStatus(col.status);
          return (
            <div
              key={col.status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.status)}
              className={cn(
                "rounded-lg border bg-card/50 min-h-[400px] flex flex-col",
                col.color,
                "border-t-2",
              )}
            >
              {/* Column Header */}
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold capitalize">
                    {col.label}
                  </h3>
                  <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                    {columnLeads.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {columnLeads.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-muted-foreground">
                      Drop leads here
                    </p>
                  </div>
                ) : (
                  columnLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => handleDragStart(lead.id)}
                      onClick={() => navigate(`/leads/${lead.id}`)}
                      className={cn(
                        "rounded-lg border bg-card p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow",
                        draggingId === lead.id && "opacity-50",
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium">{lead.name}</p>
                        <span
                          className={cn(
                            "text-xs font-medium",
                            getScoreColor(lead.score),
                          )}
                        >
                          {lead.score === "hot"
                            ? "🔥"
                            : lead.score === "warm"
                              ? "👋"
                              : "❄️"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {lead.propertyInterest && (
                          <p className="text-xs text-muted-foreground truncate">
                            🏠 {lead.propertyInterest}
                          </p>
                        )}
                        {lead.budget && (
                          <p className="text-xs text-muted-foreground">
                            💰 {formatCurrency(lead.budget)}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          📋 {lead.source}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {timeAgo(lead.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Broker Overview */}
      {isBroker && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Broker Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
            {COLUMNS.map((col) => {
              const count = getLeadsByStatus(col.status).length;
              return (
                <div key={col.status} className="space-y-1">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {col.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Mortgage Tracker Section ───────────────────────────────── */}
      <div className="rounded-lg border bg-card">
        {/* Section Header */}
        <button
          onClick={() => setMortgageExpanded(!mortgageExpanded)}
          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🏦</span>
            <h2 className="text-lg font-semibold">Mortgage Tracker</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {dealsWithMortgages.length} with mortgages
            </span>
          </div>
          <span className="text-muted-foreground text-sm">
            {mortgageExpanded ? "▲" : "▼"}
          </span>
        </button>

        {/* Content */}
        {mortgageExpanded && (
          <div className="border-t px-4 py-4 space-y-4">
            {/* Deals with mortgages */}
            {dealsWithMortgages.length === 0 &&
              dealsWithoutMortgages.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No deals created yet. Close a lead to create a deal first.
                </div>
              )}

            {dealsWithMortgages.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Deals with Mortgages
                </h3>
                {dealsWithMortgages.map(({ deal, mortgages }) => (
                  <div
                    key={deal.id}
                    className="rounded-lg border overflow-hidden"
                  >
                    {/* Deal header */}
                    <button
                      onClick={() =>
                        setExpandedMortgageDeal(
                          expandedMortgageDeal === deal.id ? null : deal.id,
                        )
                      }
                      className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span>🏆</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {deal.clientName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {formatCurrency(deal.dealPrice)} · {deal.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {mortgages.map((m) => (
                          <span
                            key={m.id}
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-medium",
                              m.status === "ongoing" &&
                                "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
                              m.status === "approved" &&
                                "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
                              m.status === "rejected" &&
                                "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
                            )}
                          >
                            {m.bankName}: {m.status}
                          </span>
                        ))}
                        <span className="text-muted-foreground text-sm">
                          {expandedMortgageDeal === deal.id ? "▲" : "▼"}
                        </span>
                      </div>
                    </button>

                    {/* Expanded mortgage detail */}
                    {expandedMortgageDeal === deal.id && (
                      <div className="border-t px-3 py-3 space-y-4">
                        {mortgages.map((mortgage) => (
                          <MortgageTracker
                            key={mortgage.id}
                            mortgage={mortgage}
                            onUpdate={() => {
                              setExpandedMortgageDeal(null);
                              setTimeout(
                                () => setExpandedMortgageDeal(deal.id),
                                0,
                              );
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Deals without mortgages */}
            {dealsWithoutMortgages.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Add Mortgage to Deal
                </h3>
                <div className="flex flex-wrap gap-2">
                  {dealsWithoutMortgages.slice(0, 5).map((deal) => (
                    <button
                      key={deal.id}
                      onClick={() => {
                        setSelectedDealId(deal.id);
                        setShowMortgageForm(true);
                      }}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      + {deal.clientName.slice(0, 20)}
                    </button>
                  ))}
                  {dealsWithoutMortgages.length > 5 && (
                    <span className="text-xs text-muted-foreground self-center">
                      +{dealsWithoutMortgages.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* View all link */}
            <div className="text-center pt-2">
              <button
                onClick={() => navigate("/mortgages")}
                className="text-sm text-primary hover:underline"
              >
                View All Mortgages →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mortgage Form Modal */}
      <MortgageForm
        open={showMortgageForm}
        onClose={() => {
          setShowMortgageForm(false);
          setSelectedDealId(undefined);
        }}
        onSuccess={() => {
          // Data refreshes via real-time listener
        }}
        dealId={selectedDealId}
      />

      {/* ─── Referral Section ──────────────────────────────────────── */}
      <div className="rounded-lg border bg-card">
        <button
          onClick={() => setReferralExpanded(!referralExpanded)}
          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🤝</span>
            <h2 className="text-lg font-semibold">Referral Tracking</h2>
          </div>
          <span className="text-muted-foreground text-sm">
            {referralExpanded ? "▲" : "▼"}
          </span>
        </button>

        {referralExpanded && (
          <div className="border-t px-4 py-4 space-y-4">
            {/* Dashboard */}
            <ReferralDashboard />

            {/* Quick referral form */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Add Referral to a Deal
              </h3>
              {showReferralForm ? (
                <ReferralForm
                  dealId={referralDealId || allDeals[0]?.id || ""}
                  onSuccess={() => setShowReferralForm(false)}
                  onClose={() => setShowReferralForm(false)}
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allDeals.slice(0, 5).map((deal) => (
                    <button
                      key={deal.id}
                      onClick={() => {
                        setReferralDealId(deal.id);
                        setShowReferralForm(true);
                      }}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      + {deal.clientName.slice(0, 20)}
                    </button>
                  ))}
                  {allDeals.length > 5 && (
                    <span className="text-xs text-muted-foreground self-center">
                      +{allDeals.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Checklist Section ──────────────────────────────────────── */}
      <div className="rounded-lg border bg-card">
        <button
          onClick={() => setChecklistExpanded(!checklistExpanded)}
          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <h2 className="text-lg font-semibold">Deal Checklists</h2>
          </div>
          <span className="text-muted-foreground text-sm">
            {checklistExpanded ? "▲" : "▼"}
          </span>
        </button>

        {checklistExpanded && (
          <div className="border-t px-4 py-4 space-y-4">
            {allDeals.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No deals yet. Close a lead to create a deal first.
              </div>
            ) : (
              <div className="space-y-3">
                {allDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="rounded-lg border overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setChecklistDealId(
                          checklistDealId === deal.id ? null : deal.id,
                        )
                      }
                      className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span>🏆</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {deal.clientName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {formatCurrency(deal.dealPrice)} · {deal.status}
                          </p>
                        </div>
                      </div>
                      <span className="text-muted-foreground text-sm">
                        {checklistDealId === deal.id ? "▲" : "▼"}
                      </span>
                    </button>

                    {checklistDealId === deal.id && (
                      <div className="border-t px-3 py-3">
                        <ChecklistWidget scopeType="deal" scopeId={deal.id} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="text-center pt-2">
              <button
                onClick={() => navigate("/checklist-templates")}
                className="text-sm text-primary hover:underline"
              >
                Manage Checklist Templates →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
