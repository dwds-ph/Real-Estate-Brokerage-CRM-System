import { Unit } from "@/types";
import {
  getUnitStatusColor,
  getUnitStatusLabel,
} from "@/services/projectService";
import { formatCurrency } from "@/lib/utils";

interface UnitCardProps {
  unit: Unit;
  onClick?: () => void;
}

export default function UnitCard({ unit, onClick }: UnitCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg border bg-card p-4 ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-sm">
            {unit.block}-{unit.lot}
          </h3>
          {unit.model && (
            <p className="text-xs text-muted-foreground">{unit.model}</p>
          )}
          {unit.phaseName && (
            <p className="text-[10px] text-muted-foreground">
              Phase: {unit.phaseName}
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getUnitStatusColor(unit.status)}`}
        >
          {getUnitStatusLabel(unit.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1 text-xs">
        <div>
          <span className="text-muted-foreground">Area:</span>{" "}
          <span className="font-medium">{unit.area} sqm</span>
        </div>
        <div>
          <span className="text-muted-foreground">Floor:</span>{" "}
          <span className="font-medium">{unit.floor ?? "—"}</span>
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground">Price:</span>{" "}
          <span className="font-medium">{formatCurrency(unit.price)}</span>
        </div>
      </div>

      {unit.buyerName && (
        <div className="mt-2 border-t pt-2 text-[10px] text-muted-foreground">
          <span>Buyer: {unit.buyerName}</span>
          {unit.agentName && <span> · Agent: {unit.agentName}</span>}
        </div>
      )}
    </div>
  );
}
