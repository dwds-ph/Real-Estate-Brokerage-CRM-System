import { useState } from 'react';
import { useCollection } from '@/hooks/useFirestore';
import { Deal, Payout } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

function calcCommission(dealPrice: number, percent: number): number {
  return dealPrice * (percent / 100);
}

function calcTax(amount: number): { vat: number; withholding: number } {
  return {
    vat: amount * 0.12,
    withholding: amount * 0.01,
  };
}

export default function CommissionsPage() {
  const { data: deals, loading: dealsLoading } = useCollection<Deal>('deals', []);
  const { data: payouts } = useCollection<Payout>('payouts', []);
  const [showCalc, setShowCalc] = useState(false);
  const [calcPrice, setCalcPrice] = useState('');
  const [calcPercent, setCalcPercent] = useState('3');


  const closedDeals = deals.filter((d) => (d as Deal).status === 'closed');

  const commissionAmount = calcPrice && calcPercent
    ? calcCommission(Number(calcPrice), Number(calcPercent))
    : 0;
  const tax = commissionAmount ? calcTax(commissionAmount) : { vat: 0, withholding: 0 };
  const netCommission = commissionAmount - tax.vat - tax.withholding;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Commissions</h1>
          <p className="text-muted-foreground">
            {closedDeals.length} closed deals | ₱{closedDeals.reduce((sum, d) => sum + (d as Deal).dealPrice, 0).toLocaleString()} total volume
          </p>
        </div>
        <button onClick={() => setShowCalc(!showCalc)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          {showCalc ? 'Close' : '🧮 Commission Calculator'}
        </button>
      </div>

      {/* Calculator */}
      {showCalc && (
        <div className="rounded-lg border bg-card p-6 space-y-4 max-w-md">
          <h3 className="font-semibold">Commission Estimator</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Deal Price (₱)</label>
              <input type="number" value={calcPrice} onChange={(e) => setCalcPrice(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Commission %</label>
              <input type="number" value={calcPercent} onChange={(e) => setCalcPercent(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Gross Commission</span><span className="font-semibold">{formatCurrency(commissionAmount)}</span></div>
            <div className="flex justify-between text-destructive"><span>VAT (12%)</span><span>-{formatCurrency(tax.vat)}</span></div>
            <div className="flex justify-between text-destructive"><span>Withholding Tax (1%)</span><span>-{formatCurrency(tax.withholding)}</span></div>
            <div className="flex justify-between border-t pt-2 font-bold"><span>Net Commission</span><span>{formatCurrency(netCommission)}</span></div>
          </div>
        </div>
      )}

      {/* Commission Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Commission Earned</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(
              payouts
                .filter((p) => (p as Payout).status === 'paid')
                .reduce((sum, p) => sum + (p as Payout).amount, 0)
            )}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {formatCurrency(
              payouts
                .filter((p) => (p as Payout).status === 'pending')
                .reduce((sum, p) => sum + (p as Payout).amount, 0)
            )}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Approved (awaiting payment)</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(
              payouts
                .filter((p) => (p as Payout).status === 'approved')
                .reduce((sum, p) => sum + (p as Payout).amount, 0)
            )}
          </p>
        </div>
      </div>

      {/* Closed Deals */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Closed Deals</h2>
        {dealsLoading ? (
          <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : closedDeals.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">No closed deals yet</div>
        ) : (
          <div className="space-y-2">
            {closedDeals.map((d) => {
              const deal = d as Deal;
              return (
                <div key={deal.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{deal.clientName}</p>
                      <p className="text-xs text-muted-foreground">{deal.clientContact}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(deal.dealPrice)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(deal.createdAt)}</p>
                    </div>
                  </div>
                  {deal.commission && (
                    <div className="mt-2 flex gap-4 text-xs text-muted-foreground border-t pt-2">
                      <span>Total: {formatCurrency(deal.commission.total)}</span>
                      <span>Agent: {formatCurrency(deal.commission.agentShare)}</span>
                      <span>Broker: {formatCurrency(deal.commission.brokerShare)}</span>
                      {deal.coBroking?.enabled && <span>Co-broker: {formatCurrency(deal.commission.agent2Share || 0)}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
