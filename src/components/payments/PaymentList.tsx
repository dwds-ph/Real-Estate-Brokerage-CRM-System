import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  getPaymentTypeLabel,
  getPaymentStatusColor,
  markPaymentPaid,
  deletePayment,
} from "@/services/paymentService";
import { type Payment } from "@/types";

interface PaymentListProps {
  payments: Payment[];
  onRefresh: () => void;
}

export function PaymentList({ payments, onRefresh }: PaymentListProps) {
  const handleMarkPaid = async (payment: Payment) => {
    await markPaymentPaid(payment.id);
    onRefresh();
  };

  const handleDelete = async (paymentId: string) => {
    if (!confirm("Delete this payment entry?")) return;
    await deletePayment(paymentId);
    onRefresh();
  };

  if (payments.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No payments recorded yet. Add a payment to start tracking.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="flex items-start justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{payment.label}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  getPaymentStatusColor(payment.status),
                )}
              >
                {payment.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getPaymentTypeLabel(payment.type)} · Due{" "}
              {formatDate(payment.dueDate)}
              {payment.paidDate && ` · Paid ${formatDate(payment.paidDate)}`}
            </p>
            {payment.notes && (
              <p className="text-xs text-muted-foreground mt-1 italic">
                {payment.notes}
              </p>
            )}
            {payment.receiptUrl && (
              <a
                href={payment.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline mt-1 inline-block"
              >
                📎 View Receipt
              </a>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <span className="text-sm font-semibold tabular-nums">
              {formatCurrency(payment.amount)}
            </span>
            <div className="flex flex-col gap-1">
              {payment.status === "pending" || payment.status === "overdue" ? (
                <button
                  onClick={() => handleMarkPaid(payment)}
                  className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 transition-colors"
                  title="Mark as paid"
                >
                  ✓
                </button>
              ) : null}
              <button
                onClick={() => handleDelete(payment.id)}
                className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 transition-colors"
                title="Delete"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
