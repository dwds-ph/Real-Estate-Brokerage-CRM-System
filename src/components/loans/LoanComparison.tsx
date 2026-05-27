import { useMemo } from "react";
import { computeComparison } from "@/lib/loanEngine";
import { formatCurrency } from "@/lib/utils";

interface Props {
  propertyPrice: number;
  downPayment: number;
}

export default function LoanComparison({ propertyPrice, downPayment }: Props) {
  const results = useMemo(() => computeComparison(propertyPrice, downPayment), [propertyPrice, downPayment]);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="px-3 py-2 text-left">Loan Type</th>
            <th className="px-3 py-2 text-right">Rate</th>
            <th className="px-3 py-2 text-right">Term</th>
            <th className="px-3 py-2 text-right">Monthly</th>
            <th className="px-3 py-2 text-right">Total Interest</th>
            <th className="px-3 py-2 text-right">Total Cost</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.loanType} className="border-t">
              <td className="px-3 py-2 font-medium capitalize">{r.loanType === "pagibig" ? "Pag-IBIG" : r.loanType === "bank" ? "Bank" : "In-House"}</td>
              <td className="px-3 py-2 text-right">{r.rate}%</td>
              <td className="px-3 py-2 text-right">{r.term} yrs</td>
              <td className="px-3 py-2 text-right font-medium text-primary">{formatCurrency(r.monthlyPayment)}</td>
              <td className="px-3 py-2 text-right text-red-500">{formatCurrency(r.totalInterest)}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(r.totalCost)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
