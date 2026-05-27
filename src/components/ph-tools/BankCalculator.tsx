import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface BankCalculatorProps {}

const BANKS = [
  {
    id: "bpi",
    name: "BPI",
    rates: {
      "1": "7.5",
      "3": "8.0",
      "5": "8.5",
      "10": "9.0",
      "15": "9.5",
      "20": "10.0",
    },
  },
  {
    id: "bdo",
    name: "BDO",
    rates: {
      "1": "7.25",
      "3": "7.75",
      "5": "8.25",
      "10": "8.75",
      "15": "9.25",
      "20": "9.75",
    },
  },
  {
    id: "metrobank",
    name: "Metrobank",
    rates: {
      "1": "7.5",
      "3": "8.0",
      "5": "8.5",
      "10": "9.0",
      "15": "9.5",
      "20": "10.0",
    },
  },
  {
    id: "security-bank",
    name: "Security Bank",
    rates: {
      "1": "7.25",
      "3": "7.75",
      "5": "8.25",
      "10": "8.75",
      "15": "9.5",
      "20": "10.25",
    },
  },
  {
    id: "eastwest",
    name: "EastWest",
    rates: {
      "1": "7.5",
      "3": "8.0",
      "5": "8.5",
      "10": "9.25",
      "15": "9.75",
      "20": "10.5",
    },
  },
];

export function BankCalculator(_props: BankCalculatorProps) {
  const [bankId, setBankId] = useState("bpi");
  const [loanAmount, setLoanAmount] = useState("2500000");
  const [termIdx, setTermIdx] = useState("10");

  const bank = BANKS.find((b) => b.id === bankId);
  const rateStr = bank?.rates[termIdx as keyof typeof bank.rates] || "8.5";
  const rate = Number(rateStr);
  const monthlyRate = rate / 100 / 12;
  const numPayments = Number(termIdx) * 12;
  const amount = Number(loanAmount);

  const monthlyAmort =
    amount > 0 && monthlyRate > 0
      ? (amount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : amount / numPayments;

  const totalInterest = monthlyAmort * numPayments - amount;
  const totalPayment = monthlyAmort * numPayments;

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">🏦</span>
        <h3 className="text-lg font-semibold">Bank Financing Calculator</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Bank</label>
          <select
            value={bankId}
            onChange={(e) => setBankId(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            {BANKS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            Loan Amount (₱)
          </label>
          <input
            type="number"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Term (years)</label>
          <select
            value={termIdx}
            onChange={(e) => setTermIdx(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="1">1 year</option>
            <option value="3">3 years</option>
            <option value="5">5 years</option>
            <option value="10">10 years</option>
            <option value="15">15 years</option>
            <option value="20">20 years</option>
          </select>
        </div>
      </div>
      {bank && (
        <div className="rounded-lg bg-primary/5 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Bank</span>
            <span className="font-semibold">{bank.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Interest Rate</span>
            <span className="font-semibold">{rate}% p.a.</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Loan Amount</span>
            <span>{formatCurrency(amount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Interest Payable</span>
            <span className="text-destructive">
              {formatCurrency(totalInterest)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Payment</span>
            <span>{formatCurrency(totalPayment)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Monthly Amortization</span>
            <span className="text-primary">{formatCurrency(monthlyAmort)}</span>
          </div>
        </div>
      )}
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Rate Comparison Across Banks ({termIdx}-yr term)
        </summary>
        <div className="mt-2 space-y-1">
          {BANKS.map((b) => {
            const r = b.rates[termIdx as keyof typeof b.rates];
            const mRate = Number(r) / 100 / 12;
            const nPay = Number(termIdx) * 12;
            const mAmort =
              amount > 0 && mRate > 0
                ? (amount * (mRate * Math.pow(1 + mRate, nPay))) /
                  (Math.pow(1 + mRate, nPay) - 1)
                : amount / nPay;
            return (
              <div
                key={b.id}
                className={`flex justify-between text-xs py-1 border-b ${b.id === bankId ? "font-semibold text-primary" : "text-muted-foreground"}`}
              >
                <span>{b.name}</span>
                <span>
                  {r}% → {formatCurrency(mAmort)}/mo
                </span>
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground mt-1">
            * Rates are estimates. Actual rates depend on bank evaluation and
            prevailing rates.
          </p>
        </div>
      </details>
    </div>
  );
}
