import { useState, useMemo } from "react";
import { Deal, Mortgage } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import MortgageTracker from "@/components/mortgage/MortgageTracker";

export interface DealMortgageSectionProps {
  allDeals: Deal[];
  allMortgages: Mortgage[];
  onAddMortgage: (dealId: string) => void;
  onNavigate: (path: string) => void;
}

export function DealMortgageSection({
  allDeals,
  allMortgages,
  onAddMortgage,
  onNavigate,
}: DealMortgageSectionProps) {
  const [mortgageExpanded, setMortgageExpanded] = useState(false);
  const [expandedMortgageDeal, setExpandedMortgageDeal] = useState<
    string | null
  >(null);

  // Map mortgages to deals
  const dealsWithMortgages = useMemo(() => {
    return allDeals
      .filter((deal) => allMortgages.some((m) => m.dealId === deal.id))
      .map((deal) => ({
        deal,
        mortgages: allMortgages.filter((m) => m.dealId === deal.id),
      }));
  }, [allDeals, allMortgages]);

  // Deals without mortgages
  const dealsWithoutMortgages = useMemo(() => {
    return allDeals.filter(
      (deal) => !allMortgages.some((m) => m.dealId === deal.id),
    );
  }, [allDeals, allMortgages]);

  return (
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
          {/* Empty state */}
          {dealsWithMortgages.length === 0 &&
            dealsWithoutMortgages.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No deals created yet. Close a lead to create a deal first.
              </div>
            )}

          {/* Deals with mortgages */}
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
                    onClick={() => onAddMortgage(deal.id)}
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
              onClick={() => onNavigate("/mortgages")}
              className="text-sm text-primary hover:underline"
            >
              View All Mortgages →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
