import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PagIbigCalculatorProps {}

export function PagIbigCalculator(_props: PagIbigCalculatorProps) {
  const [price, setPrice] = useState("3000000");
  const [downPaymentPct, setDownPaymentPct] = useState("20");
  const [term, setTerm] = useState("30");
  const [rate, setRate] = useState("6.5");

  const loanAmount =
    Number(price) - (Number(price) * Number(downPaymentPct)) / 100;
  const monthlyRate = Number(rate) / 100 / 12;
  const numPayments = Number(term) * 12;
  const monthlyAmort =
    loanAmount > 0 && monthlyRate > 0
      ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : loanAmount / numPayments;

  const maxLoanTiers = [
    { tier: "Up to ₱2M", maxAmount: 2000000, interest: "6.0%" },
    { tier: "₱2M – ₱3M", maxAmount: 3000000, interest: "6.5%" },
    { tier: "₱3M – ₱4.5M", maxAmount: 4500000, interest: "7.0%" },
    { tier: "₱4.5M – ₱6M", maxAmount: 6000000, interest: "7.5%" },
    { tier: "₱6M – ₱10M", maxAmount: 10000000, interest: "8.0%" },
  ];

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">🏠</span>
        <h3 className="text-lg font-semibold">Pag-IBIG Loan Calculator</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">
            Property Price (₱)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            Down Payment (%)
          </label>
          <input
            type="number"
            value={downPaymentPct}
            onChange={(e) => setDownPaymentPct(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            Loan Term (years)
          </label>
          <select
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="5">5 years</option>
            <option value="10">10 years</option>
            <option value="15">15 years</option>
            <option value="20">20 years</option>
            <option value="25">25 years</option>
            <option value="30">30 years</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            Interest Rate (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="rounded-lg bg-primary/5 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Loan Amount</span>
          <span className="font-semibold">{formatCurrency(loanAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Down Payment</span>
          <span>
            {formatCurrency((Number(price) * Number(downPaymentPct)) / 100)}
          </span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>Monthly Amortization</span>
          <span className="text-primary">{formatCurrency(monthlyAmort)}</span>
        </div>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Pag-IBIG Max Loanable Amount Reference
        </summary>
        <div className="mt-2 space-y-1">
          {maxLoanTiers.map((t) => (
            <div
              key={t.tier}
              className="flex justify-between text-xs text-muted-foreground border-b py-1"
            >
              <span>{t.tier}</span>
              <span>
                Max: {formatCurrency(t.maxAmount)} @ {t.interest}
              </span>
            </div>
          ))}
          <p className="text-xs text-muted-foreground mt-1">
            * Actual rates depend on Pag-IBIG prevailing rate. Check latest on
            pagibigfund.gov.ph
          </p>
        </div>
      </details>
    </div>
  );
}
