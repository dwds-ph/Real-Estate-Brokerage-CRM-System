import { memo, useMemo } from "react";
import { Project } from "@/types";
import {
  getProjectStatusColor,
  getProjectStatusLabel,
} from "@/services/projectService";
import { formatCurrency } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ProjectCard({ project, onClick, onEdit, onDelete }: ProjectCardProps) {
  const sellThrough = useMemo(
    () =>
      project.totalUnits > 0
        ? Math.round(
            ((project.totalUnits - project.availableUnits) /
              project.totalUnits) *
              100,
          )
        : 0,
    [project.totalUnits, project.availableUnits],
  );

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-lg border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{project.name}</h3>
          <p className="text-xs text-muted-foreground truncate">
            {project.developer} · {project.location.city},{" "}
            {project.location.province}
          </p>
        </div>
        <span
          className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${getProjectStatusColor(project.status)}`}
        >
          {getProjectStatusLabel(project.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
        <div>
          <span className="block font-medium text-foreground">
            {project.totalUnits}
          </span>
          <span>Total Units</span>
        </div>
        <div>
          <span className="block font-medium text-foreground">
            {project.availableUnits}
          </span>
          <span>Available</span>
        </div>
        <div>
          <span className="block font-medium text-foreground">
            {project.phases.length}
          </span>
          <span>Phases</span>
        </div>
        <div>
          <span className="block font-medium text-foreground">
            {project.priceRange.min > 0
              ? formatCurrency(project.priceRange.min)
              : "—"}
          </span>
          <span>Starting Price</span>
        </div>
      </div>

      {/* Sell-through bar */}
      <div className="mb-3">
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

      {/* Actions (visible on hover) */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
        >
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default memo(ProjectCard);
