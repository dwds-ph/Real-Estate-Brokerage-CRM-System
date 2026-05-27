import { useState, useMemo } from "react";
import { type LoanType, type LoanInput } from "@/types";
import { computeAmortization, checkAffordability, pagibigDefaults, bankDefaults, inHouseDefaults } from "@/lib/loanEngine";
import { formatCurrency, cn } from "@/lib/utils";
import AmortizationSchedule from "./AmortizationSchedule";
import AffordabilityCheck from "./AffordabilityCheck";

export default function LoanCalculator() {
  const [loanType, setLoanType] = useState<LoanType>("pagibig");
  const [propertyPrice, setPropertyPrice] = useState(3000000);
  const [downPayment, setDownPayment] = useState(300000);
  const [loanTerm, setLoanTerm] = useState(20);
  const [grossIncome, setGrossIncome] = useState(80000);
  const [existingDebts, setExistingDebts] = useState(0);
  const [showSchedule, setShowSchedule] = useState(false);

  const defaults = loanType === "pagibig" ? pagibigDefaults() : loanType === "bank" ? bankDefaults() : inHouseDefaults();

  const input: LoanInput = { loanType, propertyPrice, downPayment, loanTerm, annualRate: defaults.rate, grossIncome: grossIncome || undefined, existingDebts: existingDebts || undefined };

  const schedule = useMemo(() => computeAmortization(input), [input.loanType, input.propertyPrice, input.downPayment, input.loanTerm, input.annualRate]);
  const affordability = useMemo(() => checkAffordability(input), [input]);
  const monthlyPayment = schedule[0]?.payment || 0;
  const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);

  return (
    <div className="space-y-4">
      {/* Loan Type Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {(["pagibig", "bank", "in-house"] as const).map((t) => (
          <button key={t} onClick={() => setLoanType(t)} className={cn("flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors", loanType === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {t === "pagibig" ? "Pag-IBIG" : t === "bank" ? "Bank Financing" : "In-House"}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Property Price</label>
          <input type="number" value={propertyPrice} onChange={(e) => setPropertyPrice(Number(e.target.value))} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Down Payment</label>
          <input type="number" value={downPayment} onChange={(e) => setDownPayment(Number(e.target.value))} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Loan Term (years)</label>
          <input type="number" value={loanTerm} onChange={(e) => setLoanTerm(Math.min(Number(e.target.value), defaults.maxTerm))} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          <p className="text-[10px] text-muted-foreground mt-0.5">Max: {defaults.maxTerm} yrs @ {defaults.rate}%</p>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Annual Rate (%)</label>
          <input type="number" value={defaults.rate} disabled className="w-full rounded-lg border bg-muted px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Monthly Gross Income</label>
          <input type="number" value={grossIncome} onChange={(e) => setGrossIncome(Number(e.target.value))} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Existing Monthly Debts</label>
          <input type="number" value={existingDebts} onChange={(e) => setExistingDebts(Number(e.target.value))} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Monthly Payment</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(monthlyPayment)}</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Total Interest</p>
          <p className="text-lg font-bold">{formatCurrency(totalInterest)}</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Loan Amount</p>
          <p className="text-lg font-bold">{formatCurrency(propertyPrice - downPayment)}</p>
        </div>
      </div>

      {/* Affordability */}
      <AffordabilityCheck result={affordability} />

      {/* Amortization Toggle */}
      <button onClick={() => setShowSchedule(!showSchedule)} className="text-sm text-primary hover:underline">
        {showSchedule ? "Hide" : "Show"} Amortization Schedule ({schedule.length} payments)
      </button>
      {showSchedule && <AmortizationSchedule rows={schedule} />}
    </div>
  );
}
