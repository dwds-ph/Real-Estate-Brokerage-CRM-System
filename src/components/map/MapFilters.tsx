import { cn } from "@/lib/utils";
import { PROPERTY_TYPE_ICONS } from "./MapMarker";

// ─── Types ──────────────────────────────────────────────────────────

export interface MapFiltersState {
  propertyTypes: string[];
  statuses: string[];
  floodRisks: string[];
  priceMin: number;
  priceMax: number;
}

export interface FilterOptions {
  propertyTypes: string[];
  statuses: string[];
  floodRisks: string[];
  priceMin: number;
  priceMax: number;
}

export interface MapFiltersProps {
  filters: MapFiltersState;
  onFilterChange: (key: keyof MapFiltersState, value: string) => void;
  onReset: () => void;
  filterOptions: FilterOptions;
  totalGeocoded: number;
  totalListings: number;
  geocoding: boolean;
  showFilterPanel: boolean;
}

// ─── MapFilters Component ───────────────────────────────────────────

export function MapFilters({
  filters,
  onFilterChange,
  onReset,
  filterOptions,
  totalGeocoded,
  totalListings,
  geocoding,
  showFilterPanel,
}: MapFiltersProps) {
  if (!showFilterPanel) return null;

  return (
    <div className="absolute top-12 right-3 z-[1000] rounded-lg border bg-card shadow-lg p-4 w-64 max-h-[60vh] overflow-y-auto space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Filters</h3>
        <button
          onClick={onReset}
          className="text-xs text-primary hover:underline"
        >
          Reset
        </button>
      </div>

      {/* Property Type */}
      {filterOptions.propertyTypes.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">
            Property Type
          </p>
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.propertyTypes.map((t) => (
              <button
                key={t}
                onClick={() => onFilterChange("propertyTypes", t)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs border transition-colors",
                  filters.propertyTypes.includes(t)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card hover:bg-muted",
                )}
              >
                {PROPERTY_TYPE_ICONS[t] || "🏠"} {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      {filterOptions.statuses.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">
            Status
          </p>
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.statuses.map((s) => (
              <button
                key={s}
                onClick={() => onFilterChange("statuses", s)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs border transition-colors",
                  filters.statuses.includes(s)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card hover:bg-muted",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Flood Risk */}
      {filterOptions.floodRisks.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">
            Flood Risk
          </p>
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.floodRisks.map((r) => (
              <button
                key={r}
                onClick={() => onFilterChange("floodRisks", r)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs border transition-colors",
                  filters.floodRisks.includes(r)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card hover:bg-muted",
                )}
              >
                🌊 {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Geocoding status */}
      <div className="border-t pt-2">
        <p className="text-xs text-muted-foreground">
          {totalGeocoded}/{totalListings} geocoded
          {geocoding && <span className="ml-1 animate-pulse">⏳</span>}
        </p>
      </div>
    </div>
  );
}
