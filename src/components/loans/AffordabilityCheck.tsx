import { memo } from "react";
import { type AffordabilityResult } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";

interface Props {
  result: AffordabilityResult | null;
}

const colors = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
};
const labels = {
  green: "Affordable",
  yellow: "Borderline",
  red: "Overextended",
};

const AffordabilityCheck = memo(function AffordabilityCheck({ result }: Props) {
  if (!result) return null;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Affordability Check</h4>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            result.level === "green"
              ? "bg-green-100 text-green-700"
              : result.level === "yellow"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700",
          )}
        >
          {labels[result.level]}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            colors[result.level],
          )}
          style={{ width: `${Math.min(result.debtToIncomeRatio * 100, 100)}%` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">DTI Ratio:</span>{" "}
          {(result.debtToIncomeRatio * 100).toFixed(1)}%
        </div>
        <div>
          <span className="text-muted-foreground">Max Loan:</span>{" "}
          {formatCurrency(result.maxLoanAmount)}
        </div>
        <div>
          <span className="text-muted-foreground">Max Property:</span>{" "}
          {formatCurrency(result.maxPropertyPrice)}
        </div>
        <div>
          <span className="text-muted-foreground">Monthly:</span>{" "}
          {formatCurrency(result.monthlyPayment)}
        </div>
      </div>
    </div>
  );
});

export default AffordabilityCheck;
