import { useState, useCallback, memo } from "react";
import { useCollection } from "@/hooks/useFirestore";
import {
  createPlan,
  updatePlan,
  deletePlan,
} from "@/services/commissionPlanService";
import { type CommissionPlan } from "@/types";

const PLAN_TYPES: Array<{ value: CommissionPlan["type"]; label: string }> = [
  { value: "fixed", label: "Fixed %" },
  { value: "tiered", label: "Tiered" },
  { value: "escalating", label: "Escalating" },
  { value: "referral", label: "Referral Fee" },
];

const CommissionPlanCard = memo(function CommissionPlanCard({
  plan,
  onEdit,
  onDelete,
}: {
  plan: CommissionPlan;
  onEdit: (plan: CommissionPlan) => void;
  onDelete: (plan: CommissionPlan) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4">
      <div>
        <p className="font-medium text-sm">{plan.name}</p>
        <p className="text-xs text-muted-foreground">
          {PLAN_TYPES.find((t) => t.value === plan.type)?.label ?? plan.type}
          {plan.rules.percent && ` — ${plan.rules.percent}%`}
          {plan.rules.referralFee && ` — ${plan.rules.referralFee}%`}
          {plan.rules.tiers &&
            plan.rules.tiers.length > 0 &&
            ` — ${plan.rules.tiers.length} tiers`}
        </p>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => onEdit(plan)}
          className="rounded px-2 py-1 text-xs hover:bg-muted"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(plan)}
          className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
        >
          Delete
        </button>
      </div>
    </div>
  );
});

export default function CommissionPlanManager() {
  const { data: plans, loading } = useCollection<CommissionPlan>(
    "commissionPlans",
    [],
  );
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CommissionPlan | null>(null);

  const [name, setName] = useState("");
  const [planType, setPlanType] = useState<CommissionPlan["type"]>("fixed");
  const [percent, setPercent] = useState("3");
  const [referralFee, setReferralFee] = useState("2");
  const [minVolume, setMinVolume] = useState("5000000");
  const [tiers, setTiers] = useState<{ minVolume: number; percent: number }[]>(
    [],
  );
  const [submitting, setSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setName("");
    setPlanType("fixed");
    setPercent("3");
    setReferralFee("2");
    setMinVolume("5000000");
    setTiers([]);
    setEditing(null);
  }, []);

  const openEdit = useCallback((plan: CommissionPlan) => {
    setName(plan.name);
    setPlanType(plan.type);
    setPercent(String(plan.rules.percent ?? 3));
    setReferralFee(String(plan.rules.referralFee ?? 2));
    setMinVolume(String(plan.rules.minVolumeForEscalation ?? 5000000));
    setTiers(plan.rules.tiers ?? []);
    setEditing(plan);
    setShowForm(true);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        const rules: CommissionPlan["rules"] = {};
        if (planType === "fixed" || planType === "escalating") {
          rules.percent = Number(percent);
        }
        if (planType === "tiered") {
          rules.tiers = tiers;
        }
        if (planType === "referral") {
          rules.referralFee = Number(referralFee);
        }
        if (planType === "escalating") {
          rules.minVolumeForEscalation = Number(minVolume);
        }

        const data = {
          name,
          type: planType,
          rules,
          assignedTo: editing?.assignedTo ?? [],
          brokerId: editing?.brokerId ?? "",
        };

        if (editing) {
          await updatePlan(editing.id, data);
        } else {
          await createPlan(data);
        }
        resetForm();
        setShowForm(false);
      } finally {
        setSubmitting(false);
      }
    },
    [
      name,
      planType,
      percent,
      referralFee,
      minVolume,
      tiers,
      editing,
      resetForm,
    ],
  );

  const handleDelete = useCallback(async (plan: CommissionPlan) => {
    if (
      // eslint-disable-next-line no-alert
      window.confirm(
        `Delete commission plan "${plan.name}"? This cannot be undone.`,
      )
    ) {
      await deletePlan(plan.id);
    }
  }, []);

  const addTier = useCallback(() => {
    setTiers((prev) => [...prev, { minVolume: 0, percent: 3 }]);
  }, []);

  const updateTier = useCallback(
    (index: number, field: "minVolume" | "percent", value: number) => {
      setTiers((prev) =>
        prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
      );
    },
    [],
  );

  const removeTier = useCallback((index: number) => {
    setTiers((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const sortedPlans = [...plans].sort(
    (a, b) => (b as CommissionPlan).createdAt - (a as CommissionPlan).createdAt,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Commission Plans</h3>
          <p className="text-xs text-muted-foreground">
            Define flat, tiered, or escalating commission structures
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          + New Plan
        </button>
      </div>

      {/* Plans list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : sortedPlans.length === 0 ? (
        <div className="rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          No commission plans defined yet. Create your first plan.
        </div>
      ) : (
        <div className="space-y-2">
          {sortedPlans.map((p) => {
            const plan = p as CommissionPlan;
            return (
              <CommissionPlanCard
                key={plan.id}
                plan={plan}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            );
          })}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
          <div className="w-full max-w-lg rounded-lg bg-card p-6 shadow-xl animate-scale-in">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">
                {editing ? "Edit Plan" : "New Commission Plan"}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Plan Name *
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Standard Agent Commission"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Plan Type *
                </label>
                <select
                  value={planType}
                  onChange={(e) =>
                    setPlanType(e.target.value as CommissionPlan["type"])
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {PLAN_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {(planType === "fixed" || planType === "escalating") && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Commission Percent *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                    value={percent}
                    onChange={(e) => setPercent(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              {planType === "escalating" && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Min Volume for Escalation (₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minVolume}
                    onChange={(e) => setMinVolume(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Commission rate x1.5 when deal exceeds this amount
                  </p>
                </div>
              )}

              {planType === "referral" && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Referral Fee Percent *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                    value={referralFee}
                    onChange={(e) => setReferralFee(e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              {planType === "tiered" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Tiers</label>
                    <button
                      type="button"
                      onClick={addTier}
                      className="text-xs text-primary hover:underline"
                    >
                      + Add Tier
                    </button>
                  </div>
                  {tiers.length === 0 && (
                    <p className="text-xs text-muted-foreground mb-2">
                      No tiers defined. Add at least one tier.
                    </p>
                  )}
                  {tiers.map((tier, i) => (
                    <div
                      key={i}
                      className="mb-2 flex items-center gap-2 rounded-md border bg-muted/30 p-2"
                    >
                      <div className="flex-1">
                        <label className="block text-xs text-muted-foreground mb-0.5">
                          Min Volume (₱)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={tier.minVolume}
                          onChange={(e) =>
                            updateTier(i, "minVolume", Number(e.target.value))
                          }
                          className="w-full rounded border bg-background px-2 py-1 text-xs"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-muted-foreground mb-0.5">
                          Percent
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={tier.percent}
                          onChange={(e) =>
                            updateTier(i, "percent", Number(e.target.value))
                          }
                          className="w-full rounded border bg-background px-2 py-1 text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTier(i)}
                        className="mt-4 text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting
                    ? "Saving..."
                    : editing
                      ? "Update Plan"
                      : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
