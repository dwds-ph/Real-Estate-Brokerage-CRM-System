import { useState } from "react";
import { LoanCalculator, LoanComparison } from "@/components/loans";

export default function LoanCalculatorPage() {
  const [showComparison] = useState(true);
  const [price, setPrice] = useState(3000000);
  const [downPayment, setDownPayment] = useState(300000);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Loan Calculator</h1>
        <p className="text-sm text-muted-foreground">PH-specific loan calculators — Pag-IBIG, Bank, In-House</p>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-sm">Quick Compare</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Property Price</label>
            <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Down Payment</label>
            <input type="number" value={downPayment} onChange={(e) => setDownPayment(Number(e.target.value))} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          </div>
        </div>
        {showComparison && <LoanComparison propertyPrice={price} downPayment={downPayment} />}
      </div>

      <LoanCalculator />
    </div>
  );
}
