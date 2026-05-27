import { useState } from "react";
import { type GoalPeriod } from "@/types";

interface Props {
  onSubmit: (data: {
    targetDeals: number;
    targetCommission: number;
    period: GoalPeriod;
    periodStart: number;
    periodEnd: number;
  }) => void;
  onCancel: () => void;
  initial?: Partial<import("@/types").AgentGoal>;
}

export default function GoalForm({ onSubmit, onCancel, initial }: Props) {
  const [targetDeals, setTargetDeals] = useState(initial?.targetDeals || 10);
  const [targetCommission, setTargetCommission] = useState(
    initial?.targetCommission || 500000,
  );
  const [period, setPeriod] = useState<GoalPeriod>(
    initial?.period || "monthly",
  );
  const [startDate, setStartDate] = useState(
    initial?.periodStart
      ? new Date(initial.periodStart).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  );
  const months = 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(startDate).getTime();
    const end = start + months * 30 * 86400000;
    onSubmit({
      targetDeals,
      targetCommission,
      period,
      periodStart: start,
      periodEnd: end,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="goal-deals"
            className="block text-xs font-medium mb-1"
          >
            Target Deals
          </label>
          <input
            id="goal-deals"
            type="number"
            value={targetDeals}
            onChange={(e) => setTargetDeals(Number(e.target.value))}
            className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
            required
          />
        </div>
        <div>
          <label
            htmlFor="goal-commission"
            className="block text-xs font-medium mb-1"
          >
            Target Commission (PHP)
          </label>
          <input
            id="goal-commission"
            type="number"
            value={targetCommission}
            onChange={(e) => setTargetCommission(Number(e.target.value))}
            className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="goal-period"
            className="block text-xs font-medium mb-1"
          >
            Period
          </label>
          <select
            id="goal-period"
            value={period}
            onChange={(e) => setPeriod(e.target.value as GoalPeriod)}
            className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="goal-start"
            className="block text-xs font-medium mb-1"
          >
            Start Date
          </label>
          <input
            id="goal-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
        >
          Save Goal
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-4 py-1.5 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
