import { useState } from "react";
import { Deal } from "@/types";
import ReferralDashboard from "@/components/automation/ReferralDashboard";
import ReferralForm from "@/components/automation/ReferralForm";

export interface DealReferralSectionProps {
  allDeals: Deal[];
}

export function DealReferralSection({ allDeals }: DealReferralSectionProps) {
  const [referralExpanded, setReferralExpanded] = useState(false);
  const [referralDealId, setReferralDealId] = useState<string | null>(null);
  const [showReferralForm, setShowReferralForm] = useState(false);

  return (
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
  );
}
