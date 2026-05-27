import { useState, useCallback, memo } from "react";
import { Project, ProjectPhase, ProjectStatus } from "@/types";
import { updateProject } from "@/services/projectService";
import {
  getProjectStatusLabel,
  computePhaseSoldPercentage,
} from "@/services/projectService";
import { cn } from "@/lib/utils";

interface ProjectPhaseManagerProps {
  project: Project;
  onUpdated: (project: Project) => void;
}

function genId(): string {
  return `phase_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const ProjectPhaseCard = memo(function ProjectPhaseCard({
  phase,
  index,
  onUpdate,
  onRemove,
}: {
  phase: ProjectPhase;
  index: number;
  onUpdate: (id: string, updates: Partial<ProjectPhase>) => void;
  onRemove: (id: string) => void;
}) {
  const soldPct = computePhaseSoldPercentage(phase);
  const statusOptions: ProjectStatus[] = [
    "pre-selling",
    "ongoing",
    "completed",
    "on-hold",
  ];

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {index + 1}
          </span>
          <input
            type="text"
            value={phase.name}
            onChange={(e) => onUpdate(phase.id, { name: e.target.value })}
            className="rounded border-0 bg-transparent px-1 py-0.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={phase.status}
            onChange={(e) =>
              onUpdate(phase.id, {
                status: e.target.value as ProjectStatus,
              })
            }
            className="rounded-lg border bg-background px-2 py-1 text-xs"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {getProjectStatusLabel(s)}
              </option>
            ))}
          </select>
          <button
            onClick={() => onRemove(phase.id)}
            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded p-1"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-0.5">
            Total Units
          </label>
          <input
            type="number"
            min={0}
            value={phase.totalUnits}
            onChange={(e) =>
              onUpdate(phase.id, {
                totalUnits: parseInt(e.target.value) || 0,
              })
            }
            className="w-full rounded border bg-background px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-0.5">
            Available
          </label>
          <input
            type="number"
            min={0}
            value={phase.availableUnits}
            onChange={(e) =>
              onUpdate(phase.id, {
                availableUnits: parseInt(e.target.value) || 0,
              })
            }
            className="w-full rounded border bg-background px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-0.5">
            Min Price
          </label>
          <input
            type="number"
            min={0}
            step={100000}
            value={phase.priceRange.min}
            onChange={(e) =>
              onUpdate(phase.id, {
                priceRange: {
                  ...phase.priceRange,
                  min: parseInt(e.target.value) || 0,
                },
              })
            }
            className="w-full rounded border bg-background px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-0.5">
            Max Price
          </label>
          <input
            type="number"
            min={0}
            step={100000}
            value={phase.priceRange.max}
            onChange={(e) =>
              onUpdate(phase.id, {
                priceRange: {
                  ...phase.priceRange,
                  max: parseInt(e.target.value) || 0,
                },
              })
            }
            className="w-full rounded border bg-background px-2 py-1 text-sm"
          />
        </div>
      </div>

      {/* Sold progress */}
      {phase.totalUnits > 0 && (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">
              {phase.totalUnits - phase.availableUnits} of {phase.totalUnits}{" "}
              sold
            </span>
            <span className="font-medium">{soldPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                soldPct >= 80
                  ? "bg-green-500"
                  : soldPct >= 50
                    ? "bg-yellow-500"
                    : "bg-blue-500",
              )}
              style={{ width: `${soldPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
});

export default function ProjectPhaseManager({
  project,
  onUpdated,
}: ProjectPhaseManagerProps) {
  const [phases, setPhases] = useState<ProjectPhase[]>(project.phases);
  const [saving, setSaving] = useState(false);

  const addPhase = useCallback(() => {
    setPhases((prev) => [
      ...prev,
      {
        id: genId(),
        name: `Phase ${prev.length + 1}`,
        status: "pre-selling",
        totalUnits: 0,
        availableUnits: 0,
        priceRange: { min: 0, max: 0 },
      },
    ]);
  }, []);

  const updatePhase = useCallback(
    (id: string, updates: Partial<ProjectPhase>) => {
      setPhases((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      );
    },
    [],
  );

  const removePhase = useCallback((id: string) => {
    if (window.confirm("Remove this phase?")) {
      setPhases((prev) => prev.filter((p) => p.id !== id));
    }
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await updateProject(project.id, { phases });
      onUpdated({ ...project, phases });
    } finally {
      setSaving(false);
    }
  }, [project, phases, onUpdated]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Project Phases</h3>
        <div className="flex gap-2">
          <button
            onClick={addPhase}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            + Add Phase
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Phases"}
          </button>
        </div>
      </div>

      {phases.length === 0 ? (
        <div className="rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          No phases added yet. Click "Add Phase" to start.
        </div>
      ) : (
        <div className="space-y-3">
          {phases.map((phase, i) => (
            <ProjectPhaseCard
              key={phase.id}
              phase={phase}
              index={i}
              onUpdate={updatePhase}
              onRemove={removePhase}
            />
          ))}
        </div>
      )}
    </div>
  );
}
