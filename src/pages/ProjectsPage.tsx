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
  const { data: projects, loading } = useCollection<Project>("projects", []);
  const [viewMode, setViewMode] = useState<"list" | "dashboard">("list");

  const handleCreate = async (data: Record<string, unknown>) => {
    await createProject(data);
  };

  const handleUpdate = async (id: string, data: Record<string, unknown>) => {
    await updateProject(id, data);
  };

  const handleDelete = async (id: string) => {
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
            onClick={() => setViewMode(viewMode === "list" ? "dashboard" : "list")}
            className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
          >
            {viewMode === "list" ? "Developer View" : "List View"}
          </button>
        </div>
      </div>

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
