import { useState } from "react";
import { Project, ProjectPhase } from "@/types";

interface ProjectFormProps {
  project?: Project | null;
  onSubmit: (data: Omit<Project, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onClose: () => void;
}

const defaultPhase = (): ProjectPhase => ({
  id: crypto.randomUUID(),
  name: "",
  status: "pre-selling",
  totalUnits: 0,
  availableUnits: 0,
  priceRange: { min: 0, max: 0 },
});

export default function ProjectForm({
  project,
  onSubmit,
  onClose,
}: ProjectFormProps) {
  const [name, setName] = useState(project?.name ?? "");
  const [developer, setDeveloper] = useState(project?.developer ?? "");
  const [developerContact, setDeveloperContact] = useState(
    project?.developerContact ?? "",
  );
  const [address, setAddress] = useState(project?.location.address ?? "");
  const [city, setCity] = useState(project?.location.city ?? "");
  const [province, setProvince] = useState(project?.location.province ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [status, setStatus] = useState(project?.status ?? "pre-selling");
  const [projectType, setProjectType] = useState(
    project?.projectType ?? "subdivision",
  );
  const [totalUnits, setTotalUnits] = useState(project?.totalUnits ?? 0);
  const [availableUnits, setAvailableUnits] = useState(
    project?.availableUnits ?? 0,
  );
  const [priceMin, setPriceMin] = useState(project?.priceRange.min ?? 0);
  const [priceMax, setPriceMax] = useState(project?.priceRange.max ?? 0);
  const [phases, setPhases] = useState<ProjectPhase[]>(project?.phases ?? []);
  const [commissionRate, setCommissionRate] = useState(
    project?.commissionRate ?? 0,
  );
  const [amenities, setAmenities] = useState(
    project?.amenities.join(", ") ?? "",
  );
  const [submitting, setSubmitting] = useState(false);

  const handleAddPhase = () => {
    setPhases([...phases, defaultPhase()]);
  };

  const handleRemovePhase = (index: number) => {
    setPhases(phases.filter((_, i) => i !== index));
  };

  const handlePhaseChange = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    const updated = phases.map((p, i) => {
      if (i !== index) return p;
      if (field.startsWith("price.")) {
        const key = field.split(".")[1];
        return { ...p, priceRange: { ...p.priceRange, [key]: Number(value) } };
      }
      return { ...p, [field]: value };
    });
    setPhases(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        name,
        developer,
        developerContact: developerContact || undefined,
        location: { address, city, province },
        description,
        status,
        projectType,
        totalUnits: Number(totalUnits),
        availableUnits: Number(availableUnits),
        priceRange: { min: Number(priceMin), max: Number(priceMax) },
        phases,
        amenities: amenities
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        media: project?.media ?? [],
        commissionRate: commissionRate ? Number(commissionRate) : undefined,
        assignedTo: project?.assignedTo ?? [],
        createdBy: project?.createdBy ?? "",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {project ? "Edit Project" : "New Project"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">
                Project Name *
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Developer *
              </label>
              <input
                required
                value={developer}
                onChange={(e) => setDeveloper(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Developer Contact
              </label>
              <input
                value={developerContact}
                onChange={(e) => setDeveloperContact(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status *</label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as
                      | "pre-selling"
                      | "ongoing"
                      | "completed"
                      | "on-hold",
                  )
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="pre-selling">Pre-Selling</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Project Type *
              </label>
              <select
                value={projectType}
                onChange={(e) =>
                  setProjectType(
                    e.target.value as
                      | "subdivision"
                      | "condo"
                      | "commercial"
                      | "mixed-use",
                  )
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="subdivision">Subdivision</option>
                <option value="condo">Condo</option>
                <option value="commercial">Commercial</option>
                <option value="mixed-use">Mixed-Use</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-3">
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City *</label>
              <input
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Province *
              </label>
              <input
                required
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Commission Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Units & Pricing */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Total Units *
              </label>
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
              <label className="block text-sm font-medium mb-1">
                Available *
              </label>
              <input
                type="number"
                min="0"
                required
                value={availableUnits}
                onChange={(e) => setAvailableUnits(Number(e.target.value))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Price Min (₱)
              </label>
              <input
                type="number"
                min="0"
                value={priceMin}
                onChange={(e) => setPriceMin(Number(e.target.value))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Price Max (₱)
              </label>
              <input
                type="number"
                min="0"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Phases */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Phases</label>
              <button
                type="button"
                onClick={handleAddPhase}
                className="text-xs text-primary hover:underline"
              >
                + Add Phase
              </button>
            </div>
            {phases.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No phases defined yet.
              </p>
            )}
            {phases.map((phase, i) => (
              <div
                key={phase.id}
                className="mb-2 rounded-md border bg-muted/30 p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">Phase {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePhase(i)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    placeholder="Name"
                    value={phase.name}
                    onChange={(e) =>
                      handlePhaseChange(i, "name", e.target.value)
                    }
                    className="rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="number"
                    placeholder="Units"
                    min="0"
                    value={phase.totalUnits}
                    onChange={(e) =>
                      handlePhaseChange(i, "totalUnits", Number(e.target.value))
                    }
                    className="rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="number"
                    placeholder="Price Min"
                    min="0"
                    value={phase.priceRange.min}
                    onChange={(e) =>
                      handlePhaseChange(i, "price.min", e.target.value)
                    }
                    className="rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="number"
                    placeholder="Price Max"
                    min="0"
                    value={phase.priceRange.max}
                    onChange={(e) =>
                      handlePhaseChange(i, "price.max", e.target.value)
                    }
                    className="rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Amenities (comma-separated)
            </label>
            <input
              value={amenities}
              onChange={(e) => setAmenities(e.target.value)}
              placeholder="Clubhouse, Swimming Pool, Basketball Court"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
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
                : project
                  ? "Update Project"
                  : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
