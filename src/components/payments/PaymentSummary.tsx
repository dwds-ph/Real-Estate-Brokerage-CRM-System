import { formatCurrency } from "@/lib/utils";
import { type Payment } from "@/types";

interface PaymentSummaryProps {
  payments: Payment[];
}

export function PaymentSummary({ payments }: PaymentSummaryProps) {
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments
    .filter((p) => p.status === "pending" || p.status === "overdue")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalOverdue = payments
    .filter((p) => p.status === "overdue")
    .reduce((sum, p) => sum + p.amount, 0);
  const overdueCount = payments.filter((p) => p.status === "overdue").length;
  const paidCount = payments.filter((p) => p.status === "paid").length;

  if (payments.length === 0) {return null;}

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div className="rounded-lg border bg-card p-3">
        <p className="text-xs text-muted-foreground">Total Payments</p>
        <p className="text-lg font-bold">{formatCurrency(totalAmount)}</p>
        <p className="text-xs text-muted-foreground">
          {payments.length} entries
        </p>
      </div>
      <div className="rounded-lg border bg-card p-3">
        <p className="text-xs text-muted-foreground">Paid</p>
        <p className="text-lg font-bold text-green-600">
          {formatCurrency(totalPaid)}
        </p>
        <p className="text-xs text-muted-foreground">
          {paidCount} of {payments.length} paid
        </p>
      </div>
      <div className="rounded-lg border bg-card p-3">
        <p className="text-xs text-muted-foreground">Pending</p>
        <p className="text-lg font-bold text-yellow-600">
          {formatCurrency(totalPending)}
        </p>
        <p className="text-xs text-muted-foreground">
          {payments.length - paidCount} remaining
        </p>
      </div>
      <div
        className={`rounded-lg border bg-card p-3 ${
          overdueCount > 0 ? "ring-2 ring-red-300 dark:ring-red-700" : ""
        }`}
      >
        <p className="text-xs text-muted-foreground">
          Overdue {overdueCount > 0 && `(${overdueCount})`}
        </p>
        <p className="text-lg font-bold text-red-600">
          {formatCurrency(totalOverdue)}
        </p>
        {overdueCount > 0 && (
          <p className="text-xs text-red-500 font-medium">⚠ Action required</p>
        )}
      </div>
    </div>
  );
}
