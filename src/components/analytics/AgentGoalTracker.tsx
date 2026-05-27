import { formatCurrency, cn } from "@/lib/utils";

interface Props {
  goal: any;
  progress: { dealsClosed: number; commission: number; dealProgress: number; commissionProgress: number };
}

export default function AgentGoalTracker({ goal, progress }: Props) {
  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{goal.agentName || "Agent"}</p>
          <p className="text-[10px] text-muted-foreground capitalize">{goal.period}</p>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">
          {Math.round(progress.dealProgress * 100)}%
        </span>
      </div>

      <div className="flex gap-2 h-2">
        <div className="flex-1 rounded-full bg-muted overflow-hidden">
          <div className={cn("h-full rounded-full bg-primary transition-all", progress.dealProgress >= 1 && "bg-green-500")} style={{ width: `${Math.min(progress.dealProgress * 100, 100)}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
        <div>Deals: {progress.dealsClosed}/{goal.targetDeals}</div>
        <div>Commission: {formatCurrency(progress.commission)}/{formatCurrency(goal.targetCommission)}</div>
      </div>
    </div>
  );
}
