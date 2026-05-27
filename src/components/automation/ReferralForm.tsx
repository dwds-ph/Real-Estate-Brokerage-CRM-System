import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createReferral } from "@/services/referralService";

interface Props {
  dealId: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function ReferralForm({ dealId, onSuccess, onClose }: Props) {
  const { userProfile } = useAuth();
  const [referrerName, setReferrerName] = useState("");
  const [referrerContact, setReferrerContact] = useState("");
  const [referralFee, setReferralFee] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !referrerName.trim() || !referralFee) return;
    setSaving(true);
    setError(null);
    try {
      await createReferral({
        dealId,
        referrerName: referrerName.trim(),
        referrerContact: referrerContact.trim(),
        referralFee: Number(referralFee),
        status: "pending",
      });
      setSuccess(true);
      setReferrerName("");
      setReferrerContact("");
      setReferralFee("");
      onSuccess?.();
    } catch (err) {
      setError("Failed to save referral");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg border bg-card p-4 text-center">
        <p className="text-sm text-green-600 dark:text-green-400 mb-2">
          ✅ Referral logged successfully!
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-primary hover:underline"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="text-sm font-semibold">Log Referral</h3>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div>
        <label className="block text-xs font-medium mb-1">
          Referrer Name *
        </label>
        <input
          type="text"
          required
          value={referrerName}
          onChange={(e) => setReferrerName(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          placeholder="e.g. Juan dela Cruz"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Contact Info</label>
        <input
          type="text"
          value={referrerContact}
          onChange={(e) => setReferrerContact(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          placeholder="Phone or email"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">
          Referral Fee (₱) *
        </label>
        <input
          type="number"
          required
          min="0"
          value={referralFee}
          onChange={(e) => setReferralFee(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          placeholder="e.g. 50000"
        />
      </div>
      <div className="flex gap-2 justify-end">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-3 py-1.5 text-xs hover:bg-muted"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Saving..." : "Log Referral"}
        </button>
      </div>
    </form>
  );
}
