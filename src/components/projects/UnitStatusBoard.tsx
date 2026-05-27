import { useState } from "react";
import { Unit } from "@/types";
import UnitCard from "./UnitCard";

interface UnitStatusBoardProps {
  units: Unit[];
  onUnitClick?: (unit: Unit) => void;
}

const COLUMNS = [
  { key: "available" as const, label: "Available" },
  { key: "reserved" as const, label: "Reserved" },
  { key: "under-contract" as const, label: "Under Contract" },
  { key: "sold" as const, label: "Sold" },
  { key: "blocked" as const, label: "Blocked" },
];

export default function UnitStatusBoard({
  units,
  onUnitClick,
}: UnitStatusBoardProps) {
  const [expandedColumn, setExpandedColumn] = useState<string | null>(null);

  const grouped = COLUMNS.map((col) => ({
    ...col,
    items: units.filter((u) => u.status === col.key),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      {grouped.map((col) => (
        <div key={col.key} className="rounded-lg border bg-card">
          {/* Column header */}
          <div
            className="flex items-center justify-between px-3 py-2 border-b cursor-pointer md:cursor-default"
            onClick={() =>
              setExpandedColumn(expandedColumn === col.key ? null : col.key)
            }
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold">{col.label}</span>
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                {col.items.length}
              </span>
            </div>
            <span className="md:hidden text-xs text-muted-foreground">
              {expandedColumn === col.key ? "▲" : "▼"}
            </span>
          </div>

          {/* Items - responsive: on mobile only show expanded column, on desktop show all */}
          <div
            className={`p-2 space-y-2 ${expandedColumn && expandedColumn !== col.key ? "hidden md:block" : ""}`}
          >
            {col.items.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-4">
                No units
              </p>
            ) : (
              col.items.map((unit) => (
                <UnitCard
                  key={unit.id}
                  unit={unit}
                  onClick={() => onUnitClick?.(unit)}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
