import { useState } from "react";
import { useCollection } from "@/hooks/useFirestore";
import {
  createProject,
  updateProject,
  deleteProject,
} from "@/services/projectService";
import { Project } from "@/types";
import ProjectList from "@/components/projects/ProjectList";

export default function ProjectsPage() {
  const {
    data: projects,
    loading,
    error,
  } = useCollection<Project>("projects", []);
  const [viewMode, setViewMode] = useState<"list" | "dashboard">("list");

  const handleCreate = async (
    data: Omit<Project, "id" | "createdAt" | "updatedAt">,
  ) => {
    await createProject(data);
  };

  const handleUpdate = async (id: string, data: Partial<Project>) => {
    await updateProject(id, data);
  };

  const handleDelete = async (id: string) => {
    // eslint-disable-next-line no-alert
    if (window.confirm("Delete this project? This cannot be undone.")) {
      await deleteProject(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage subdivisions, condos, and developments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setViewMode(viewMode === "list" ? "dashboard" : "list")
            }
            className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
          >
            {viewMode === "list" ? "Developer View" : "List View"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-medium text-sm">Error loading projects</p>
          <p className="text-xs mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-xs font-medium underline underline-offset-2 hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      <ProjectList
        projects={projects as Project[]}
        loading={loading}
        onCreateProject={handleCreate}
        onUpdateProject={handleUpdate}
        onDeleteProject={handleDelete}
      />
    </div>
  );
}
