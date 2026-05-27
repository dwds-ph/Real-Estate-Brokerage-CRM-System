import { useState } from "react";
import { ProjectPhase } from "@/types";

interface PhaseFormProps {
  phase?: ProjectPhase | null;
  onSubmit: (data: Record<string, unknown>) => void;
  onClose: () => void;
}

export default function PhaseForm({ phase, onSubmit, onClose }: PhaseFormProps) {
  const [name, setName] = useState(phase?.name ?? "");
  const [totalUnits, setTotalUnits] = useState(phase?.totalUnits ?? 0);
  const [availableUnits, setAvailableUnits] = useState(phase?.availableUnits ?? 0);
  const [priceMin, setPriceMin] = useState(phase?.priceRange.min ?? 0);
  const [priceMax, setPriceMax] = useState(phase?.priceRange.max ?? 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: phase?.id ?? crypto.randomUUID(),
      name,
      status: phase?.status ?? "pre-selling",
      totalUnits: Number(totalUnits),
      availableUnits: Number(availableUnits),
      priceRange: { min: Number(priceMin), max: Number(priceMax) },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
        <h3 className="text-base font-semibold mb-4">{phase ? "Edit Phase" : "Add Phase"}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">Phase Name *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Total Units *</label>
              <input
                type="number"
                min="0"
                required
                value={totalUnits}
                onChange={(e) => setTotalUnits(Number(e.target.value))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Available *</label>
              <input
                type="number"
                min="0"
                required
                value={availableUnits}
                onChange={(e) => setAvailableUnits(Number(e.target.value))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Price Min (₱)</label>
              <input
                type="number"
                min="0"
                value={priceMin}
                onChange={(e) => setPriceMin(Number(e.target.value))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Price Max (₱)</label>
              <input
                type="number"
                min="0"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted">Cancel</button>
            <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
