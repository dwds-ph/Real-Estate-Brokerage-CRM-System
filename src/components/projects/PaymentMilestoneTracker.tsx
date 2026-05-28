import { useState, useEffect } from "react";
import { PaymentMilestone } from "@/types";
import {
  getMilestoneStatusColor,
  getMilestoneStatusLabel,
  subscribeMilestones,
} from "@/services/projectService";
import { formatCurrency } from "@/lib/utils";

interface PaymentMilestoneTrackerProps {
  unitId: string;
  compact?: boolean;
}

export default function PaymentMilestoneTracker({
  unitId,
  compact = false,
}: PaymentMilestoneTrackerProps) {
  const [milestones, setMilestones] = useState<PaymentMilestone[]>([]);

  useEffect(() => {
    if (!unitId) {return;}
    const unsub = subscribeMilestones(unitId, (data) => setMilestones(data));
    return () => unsub();
  }, [unitId]);

  if (milestones.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No payment milestones.</p>
    );
  }

  const totalPaid = milestones
    .filter((m) => m.status === "paid")
    .reduce((sum, m) => sum + m.amount, 0);
  const totalDue = milestones.reduce((sum, m) => sum + m.amount, 0);
  const paidPercent =
    totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Mini progress bar */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <div className="flex-1 h-1.5 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-green-500"
              style={{ width: `${paidPercent}%` }}
            />
          </div>
          <span className="shrink-0">{paidPercent}%</span>
        </div>
        <div className="space-y-1">
          {milestones.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between text-[10px]"
            >
              <span className="truncate flex-1">{m.name}</span>
              <span className="font-medium mx-2">
                {formatCurrency(m.amount)}
              </span>
              <span
                className={`rounded px-1 py-0.5 text-[9px] font-medium ${getMilestoneStatusColor(m.status)}`}
              >
                {getMilestoneStatusLabel(m.status)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-2xl font-bold">{formatCurrency(totalPaid)}</p>
          <p className="text-xs text-muted-foreground">
            Paid of {formatCurrency(totalDue)}
          </p>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{paidPercent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${paidPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {milestones.map((m, i) => (
          <div key={m.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`h-3 w-3 rounded-full border-2 ${
                  m.status === "paid"
                    ? "border-green-500 bg-green-500"
                    : m.status === "overdue"
                      ? "border-red-500 bg-red-500"
                      : "border-gray-300 bg-card"
                }`}
              />
              {i < milestones.length - 1 && (
                <div className="w-px flex-1 bg-border" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Due: {new Date(m.dueDate).toLocaleDateString()}
                    {m.paidDate &&
                      ` · Paid: ${new Date(m.paidDate).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {formatCurrency(m.amount)}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getMilestoneStatusColor(m.status)}`}
                  >
                    {getMilestoneStatusLabel(m.status)}
                  </span>
                </div>
              </div>
              {m.notes && (
                <p className="text-xs text-muted-foreground mt-1">{m.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
