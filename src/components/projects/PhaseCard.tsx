import { ProjectPhase } from "@/types";
import {
  getProjectStatusColor,
  getProjectStatusLabel,
} from "@/services/projectService";
import { formatCurrency } from "@/lib/utils";

interface PhaseCardProps {
  phase: ProjectPhase;
}

export default function PhaseCard({ phase }: PhaseCardProps) {
  const sellThrough =
    phase.totalUnits > 0
      ? Math.round(
          ((phase.totalUnits - phase.availableUnits) / phase.totalUnits) * 100,
        )
      : 0;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">{phase.name}</h3>
          {phase.launchDate && (
            <p className="text-[10px] text-muted-foreground">
              Launched {new Date(phase.launchDate).toLocaleDateString()}
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getProjectStatusColor(phase.status)}`}
        >
          {getProjectStatusLabel(phase.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div>
          <span className="block font-medium">{phase.totalUnits}</span>
          <span className="text-muted-foreground">Total Units</span>
        </div>
        <div>
          <span className="block font-medium">{phase.availableUnits}</span>
          <span className="text-muted-foreground">Available</span>
        </div>
        <div>
          <span className="block font-medium">
            {phase.priceRange.min > 0
              ? formatCurrency(phase.priceRange.min)
              : "—"}
          </span>
          <span className="text-muted-foreground">Min Price</span>
        </div>
        <div>
          <span className="block font-medium">
            {phase.priceRange.max > 0
              ? formatCurrency(phase.priceRange.max)
              : "—"}
          </span>
          <span className="text-muted-foreground">Max Price</span>
        </div>
      </div>

      {/* Sell-through bar */}
      <div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
          <span>Sell-through</span>
          <span>{sellThrough}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(sellThrough, 100)}%` }}
          />
        </div>
      </div>

      {phase.targetCompletion && (
        <p className="mt-2 text-[10px] text-muted-foreground">
          Target completion:{" "}
          {new Date(phase.targetCompletion).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
