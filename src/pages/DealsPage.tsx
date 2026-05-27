import { useNavigate } from "react-router-dom";

import { useDealsPage } from "@/hooks/useDealsPage";
import { formatCurrency } from "@/lib/utils";
import { LeadStatus } from "@/types";
import ChecklistWidget from "@/components/automation/ChecklistWidget";
import { DealKanban } from "@/components/deals/DealKanban";
import { DealMortgageSection } from "@/components/deals/DealMortgageSection";
import { DealReferralSection } from "@/components/deals/DealReferralSection";
import MortgageForm from "@/components/mortgage/MortgageForm";
import { DealPaymentSection } from "@/components/payments/DealPaymentSection";

export default function DealsPage() {
  const navigate = useNavigate();
  const {
    allLeads,
    allDeals,
    allMortgages,
    loading,
    draggingId,
    isBroker,
    showMortgageForm,
    setShowMortgageForm,
    selectedDealId,
    setSelectedDealId,
    checklistExpanded,
    setChecklistExpanded,
    checklistDealId,
    setChecklistDealId,
    handleDragStart,
    handleDrop,
  } = useDealsPage();

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
            {allLeads.length} total leads across 6 stages
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
      <DealKanban
        allLeads={allLeads}
        draggingId={draggingId}
        onDragStart={handleDragStart}
        onDrop={handleDrop}
        onNavigate={navigate}
      />

      {/* Broker Overview */}
      {isBroker && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Broker Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
            {(
              [
                "new",
                "contacted",
                "viewed",
                "negotiating",
                "closed",
                "lost",
              ] as LeadStatus[]
            ).map((status) => {
              const count = allLeads.filter((l) => l.status === status).length;
              return (
                <div key={status} className="space-y-1">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {status}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mortgage Tracker Section */}
      <DealMortgageSection
        allDeals={allDeals}
        allMortgages={allMortgages}
        onAddMortgage={(dealId: string) => {
          setSelectedDealId(dealId);
          setShowMortgageForm(true);
        }}
        onNavigate={navigate}
      />

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

      {/* Payment Schedule Section */}
      <DealPaymentSection allDeals={allDeals} />

      {/* Referral Section */}
      <DealReferralSection allDeals={allDeals} />

      {/* Checklist Section */}
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
