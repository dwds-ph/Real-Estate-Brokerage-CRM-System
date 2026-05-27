import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createPayment } from "@/services/paymentService";
import { type PaymentType } from "@/types";
import { uploadFile } from "@/hooks/useFirestore";

interface PaymentFormProps {
  dealId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const paymentTypes: {
  value: PaymentType;
  label: string;
  placeholder: string;
}[] = [
  {
    value: "reservation-fee",
    label: "Reservation Fee",
    placeholder: "e.g. 20,000",
  },
  {
    value: "down-payment",
    label: "Down Payment",
    placeholder: "e.g. 500,000",
  },
  {
    value: "equity",
    label: "Equity",
    placeholder: "e.g. 200,000",
  },
  {
    value: "full-payment",
    label: "Full Payment",
    placeholder: "e.g. 3,000,000",
  },
  {
    value: "move-in-fee",
    label: "Move-In Fee",
    placeholder: "e.g. 50,000",
  },
  {
    value: "other",
    label: "Other",
    placeholder: "Enter amount",
  },
];

export function PaymentForm({
  dealId,
  open,
  onClose,
  onSuccess,
}: PaymentFormProps) {
  const { userProfile } = useAuth();
  const [type, setType] = useState<PaymentType>("reservation-fee");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id || !amount || !dueDate) return;

    setSaving(true);
    try {
      let receiptUrl: string | undefined;
      if (receiptFile) {
        receiptUrl = await uploadFile(
          `payments/${dealId}/${Date.now()}_${receiptFile.name}`,
          receiptFile,
        );
      }

      await createPayment(
        dealId,
        {
          type,
          label:
            label ||
            paymentTypes.find((pt) => pt.value === type)?.label ||
            type,
          amount: Number(amount.replace(/,/g, "")),
          dueDate: new Date(dueDate).getTime(),
          notes: notes || undefined,
          receiptUrl,
        },
        userProfile.id,
      );

      setAmount("");
      setDueDate("");
      setNotes("");
      setReceiptFile(null);
      setLabel("");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to create payment:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Add Payment</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Type */}
          <div>
            <label className="text-sm font-medium">Payment Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PaymentType)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              required
            >
              {paymentTypes.map((pt) => (
                <option key={pt.value} value={pt.value}>
                  {pt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Label */}
          <div>
            <label className="text-sm font-medium">Label (optional)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. 1st Reservation Payment"
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm font-medium">Amount (₱)</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={
                paymentTypes.find((pt) => pt.value === type)?.placeholder ||
                "Enter amount"
              }
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              required
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="text-sm font-medium">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              required
            />
          </div>

          {/* Receipt */}
          <div>
            <label className="text-sm font-medium">Receipt (optional)</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              className="mt-1 w-full text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !amount || !dueDate}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Add Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
