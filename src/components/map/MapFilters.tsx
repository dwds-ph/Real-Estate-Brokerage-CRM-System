import { type MapFilters } from "@/types";
export type MapFiltersState = MapFilters & {
  priceMin: number;
  priceMax: number;
  propertyTypes: string[];
  statuses: string[];
  floodRisks: string[];
};

interface Props {
  filters: MapFilters;
  onChange: (f: MapFilters) => void;
}

export default function MapFilters({ filters, onChange }: Props) {
  const update = (patch: Partial<MapFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="space-y-3 p-3">
      <div>
        <label className="block text-xs font-medium mb-1">Property Type</label>
        <select value={filters.propertyType} onChange={(e) => update({ propertyType: e.target.value })} className="w-full rounded-lg border bg-background px-2 py-1.5 text-sm">
          <option value="">All Types</option>
          <option value="condo">Condo</option>
          <option value="house-lot">House & Lot</option>
          <option value="lot-only">Lot Only</option>
          <option value="commercial">Commercial</option>
          <option value="foreclosed">Foreclosed</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Status</label>
        <select value={filters.status} onChange={(e) => update({ status: e.target.value })} className="w-full rounded-lg border bg-background px-2 py-1.5 text-sm">
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="under-option">Under Option</option>
          <option value="sold">Sold</option>
          <option value="rented">Rented</option>
          <option value="off-market">Off Market</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium mb-1">Min Price</label>
          <input type="number" value={filters.minPrice || ""} onChange={(e) => update({ minPrice: Number(e.target.value) || 0 })} className="w-full rounded-lg border bg-background px-2 py-1.5 text-sm" placeholder="0" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Max Price</label>
          <input type="number" value={filters.maxPrice || ""} onChange={(e) => update({ maxPrice: Number(e.target.value) || 0 })} className="w-full rounded-lg border bg-background px-2 py-1.5 text-sm" placeholder="Any" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Location</label>
        <input type="text" value={filters.location} onChange={(e) => update({ location: e.target.value })} className="w-full rounded-lg border bg-background px-2 py-1.5 text-sm" placeholder="Search location..." aria-label="Search location" />
      </div>
    </div>
  );
}
