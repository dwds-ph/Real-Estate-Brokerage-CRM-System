import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Project, ProjectStatus } from "@/types";
import ProjectCard from "./ProjectCard";
import ProjectForm from "./ProjectForm";

const STATUS_FILTERS: Array<{ label: string; value: ProjectStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Pre-Selling", value: "pre-selling" },
  { label: "Ongoing", value: "ongoing" },
  { label: "Completed", value: "completed" },
  { label: "On Hold", value: "on-hold" },
];

interface ProjectListProps {
  projects: Project[];
  loading?: boolean;
  onCreateProject: (data: Record<string, unknown>) => Promise<void>;
  onUpdateProject: (id: string, data: Record<string, unknown>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
}

export default function ProjectList({
  projects,
  loading = false,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
}: ProjectListProps) {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const filtered = projects.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !p.name.toLowerCase().includes(q) &&
        !p.developer.toLowerCase().includes(q) &&
        !p.location.city.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    if (editingProject) {
      await onUpdateProject(editingProject.id, data);
    } else {
      await onCreateProject(data);
    }
    setShowForm(false);
    setEditingProject(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-md border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={() => {
              setEditingProject(null);
              setShowForm(true);
            }}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            + New Project
          </button>
        </div>
      </div>

      {/* Project cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <span className="text-4xl mb-3">🏗️</span>
          <p className="font-medium">No projects found</p>
          <p className="text-sm">Create your first project to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => navigate(`/projects/${project.id}`)}
              onEdit={() => handleEdit(project)}
              onDelete={() => onDeleteProject(project.id)}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <ProjectForm
          project={editingProject}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingProject(null);
          }}
        />
      )}
    </div>
  );
}
