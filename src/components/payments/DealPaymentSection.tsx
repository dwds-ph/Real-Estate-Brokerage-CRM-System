import { useState, useEffect, useCallback } from "react";
import { PaymentSummary } from "./PaymentSummary";
import { PaymentList } from "./PaymentList";
import { PaymentForm } from "./PaymentForm";
import PaymentGatewayForm from "./PaymentGatewayForm";
import { subscribePaymentsForDeal } from "@/services/paymentService";
import { useAuth } from "@/context/AuthContext";
import { type Payment, type Deal } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface DealPaymentSectionProps {
  allDeals: Deal[];
}

export function DealPaymentSection({ allDeals }: DealPaymentSectionProps) {
  const { userProfile } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showGateway, setShowGateway] = useState(false);
  const [gatewayDealId, setGatewayDealId] = useState<string | null>(null);

  if (allDeals.length === 0) {return null;}

  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">💵</span>
          <h2 className="text-lg font-semibold">Payment Schedule</h2>
          <span className="text-xs text-muted-foreground">
            · {allDeals.length} deals
          </span>
        </div>
        <span className="text-muted-foreground text-sm">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className="border-t px-4 py-4 space-y-3">
          {allDeals.map((deal) => (
            <DealPaymentRow
              key={deal.id}
              deal={deal}
              isSelected={selectedDealId === deal.id}
              onToggle={() =>
                setSelectedDealId(selectedDealId === deal.id ? null : deal.id)
              }
              onAddPayment={() => {
                setSelectedDealId(deal.id);
                setShowForm(true);
              }}
              onPayOnline={() => {
                setGatewayDealId(deal.id);
                setShowGateway(true);
              }}
            />
          ))}
        </div>
      )}

      {showForm && selectedDealId && (
        <PaymentForm
          dealId={selectedDealId}
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedDealId(null);
          }}
          onSuccess={() => {}}
        />
      )}

      {showGateway && gatewayDealId && (
        <PaymentGatewayForm
          dealId={gatewayDealId}
          brokerId={userProfile?.brokerId || ""}
          amount={allDeals.find((d) => d.id === gatewayDealId)?.dealPrice || 0}
          open={showGateway}
          onClose={() => {
            setShowGateway(false);
            setGatewayDealId(null);
          }}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}

// ─── Individual Deal Payment Row ──────────────────────────────────

function DealPaymentRow({
  deal,
  isSelected,
  onToggle,
  onAddPayment,
  onPayOnline,
}: {
  deal: Deal;
  isSelected: boolean;
  onToggle: () => void;
  onAddPayment: () => void;
  onPayOnline: () => void;
}) {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const unsub = subscribePaymentsForDeal(deal.id, setPayments);
    return unsub;
  }, [deal.id]);

  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const overdueCount = payments.filter((p) => p.status === "overdue").length;
  const progressPercent =
    deal.dealPrice > 0
      ? Math.min(Math.round((totalPaid / deal.dealPrice) * 100), 100)
      : 0;

  const refresh = useCallback(() => {}, []);

  return (
    <div className="rounded-lg border overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span>🏆</span>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{deal.clientName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {formatCurrency(deal.dealPrice)} · {formatCurrency(totalPaid)}{" "}
              paid ({progressPercent}%)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {overdueCount > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-200">
              {overdueCount} overdue
            </span>
          )}
          <span className="text-muted-foreground text-sm">
            {isSelected ? "▲" : "▼"}
          </span>
        </div>
      </button>

      {isSelected && (
        <div className="border-t px-3 py-3 space-y-3">
          <PaymentSummary payments={payments} />
          <PaymentList payments={payments} onRefresh={refresh} />
          <div className="flex gap-2">
            <button
              onClick={onAddPayment}
              className="flex-1 rounded-lg border-2 border-dashed px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
            >
              + Add Payment Record
            </button>
            <button
              onClick={onPayOnline}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              💳 Pay Online Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
