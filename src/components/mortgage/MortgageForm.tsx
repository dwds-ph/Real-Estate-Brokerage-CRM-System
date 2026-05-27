import { useState, useEffect } from "react";
import {
  createMortgage,
  updateMortgage,
  BANKS,
} from "@/services/mortgageService";
import { Mortgage } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface MortgageFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  dealId?: string;
  existingMortgage?: Mortgage | null;
}

export default function MortgageForm({
  open,
  onClose,
  onSuccess,
  dealId,
  existingMortgage,
}: MortgageFormProps) {
  const [bankId, setBankId] = useState("bpi");
  const [bankName, setBankName] = useState("BPI");
  const [loanAmount, setLoanAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (existingMortgage) {
          setBankId(existingMortgage.bankId);
          setBankName(existingMortgage.bankName);
          setLoanAmount(existingMortgage.loanAmount.toString());
          setNotes("");
        } else {
          setBankId("bpi");
          setBankName("BPI");
          setLoanAmount("");
          setNotes("");
        }
        setError(null);
        setSaving(false);
      }, 0);
    }
  }, [open, existingMortgage]);

  const handleBankChange = (id: string) => {
    const bank = BANKS.find((b) => b.id === id);
    setBankId(id);
    setBankName(bank?.name || id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealId && !existingMortgage) return;
    if (!loanAmount || isNaN(Number(loanAmount)) || Number(loanAmount) <= 0) {
      setError("Please enter a valid loan amount");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (existingMortgage) {
        await updateMortgage(existingMortgage.id, {
          bankId,
          bankName,
          loanAmount: Number(loanAmount),
        });
      } else {
        await createMortgage({
          dealId: dealId!,
          bankId,
          bankName,
          loanAmount: Number(loanAmount),
        });
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save mortgage";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const selectedBank = BANKS.find((b) => b.id === bankId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {existingMortgage ? "Edit Mortgage" : "New Mortgage"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bank Selector */}
          <div>
            <label className="mb-1 block text-sm font-medium">Bank</label>
            <div className="grid grid-cols-2 gap-2">
              {BANKS.map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => handleBankChange(bank.id)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    bankId === bank.id
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "hover:bg-muted"
                  }`}
                >
                  <span className="block text-sm font-medium">{bank.name}</span>
                  <span className="block text-[10px] text-muted-foreground mt-0.5">
                    {bank.typicalRate}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Bank Info */}
          {selectedBank && (
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <p>
                <strong>{selectedBank.name}</strong> — Estimated timeline:{" "}
                {selectedBank.estimatedTimelineDays} days
              </p>
              <p>Typical rate: {selectedBank.typicalRate}</p>
            </div>
          )}

          {/* Loan Amount */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Loan Amount (₱)
            </label>
            <input
              type="number"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder="e.g. 3000000"
              min={0}
              required
            />
            {loanAmount &&
              !isNaN(Number(loanAmount)) &&
              Number(loanAmount) > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatCurrency(Number(loanAmount))}
                </p>
              )}
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-sm font-medium">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              rows={2}
              placeholder="Optional notes..."
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              disabled={saving || !loanAmount}
            >
              {saving
                ? "Saving..."
                : existingMortgage
                  ? "Update"
                  : "Create Mortgage"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
