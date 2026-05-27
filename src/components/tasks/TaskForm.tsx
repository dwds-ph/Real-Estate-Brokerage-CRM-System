/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { type Task, type TaskPriority, type TaskStatus } from "@/types";

export interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  assignedTo: string;
  assignedName: string;
  relatedToType: "" | "lead" | "deal" | "listing" | "project";
  relatedToId: string;
  relatedToTitle: string;
  tags: string;
  recurring: "none" | "daily" | "weekly" | "monthly";
}

interface TaskFormProps {
  initial?: Task;
  agents: { id: string; displayName: string }[];
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export const emptyFormData: TaskFormData = {
  title: "",
  description: "",
  priority: "medium",
  status: "todo",
  dueDate: "",
  assignedTo: "",
  assignedName: "",
  relatedToType: "",
  relatedToId: "",
  relatedToTitle: "",
  tags: "",
  recurring: "none",
};

export default function TaskForm({
  initial,
  agents,
  onSubmit,
  onCancel,
  saving,
}: TaskFormProps) {
  const [form, setForm] = useState<TaskFormData>(() =>
    initial
      ? {
          title: initial.title,
          description: initial.description || "",
          priority: initial.priority,
          status: initial.status,
          dueDate: initial.dueDate
            ? new Date(initial.dueDate).toISOString().split("T")[0]
            : "",
          assignedTo: initial.assignedTo,
          assignedName: initial.assignedName || "",
          relatedToType: initial.relatedTo?.type || "",
          relatedToId: initial.relatedTo?.id || "",
          relatedToTitle: initial.relatedTo?.title || "",
          tags: (initial.tags || []).join(", "),
          recurring: initial.recurring || "none",
        }
      : emptyFormData,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium">Title *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium">Priority</label>
          <select
            value={form.priority}
            onChange={(e) =>
              setForm({ ...form, priority: e.target.value as TaskPriority })
            }
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium">Status</label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as TaskStatus })
            }
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium">Due Date</label>
        <input
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium">Assign To</label>
        <select
          value={form.assignedTo}
          onChange={(e) => {
            const agent = agents.find((a) => a.id === e.target.value);
            setForm({
              ...form,
              assignedTo: e.target.value,
              assignedName: agent?.displayName || "",
            });
          }}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Unassigned</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.displayName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium">Related To</label>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={form.relatedToType}
            onChange={(e) =>
              setForm({
                ...form,
                relatedToType: e.target.value as TaskFormData["relatedToType"],
              })
            }
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">None</option>
            <option value="lead">Lead</option>
            <option value="deal">Deal</option>
            <option value="listing">Listing</option>
            <option value="project">Project</option>
          </select>
          <input
            type="text"
            value={form.relatedToTitle}
            onChange={(e) =>
              setForm({ ...form, relatedToTitle: e.target.value })
            }
            placeholder="Entity ID or name"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          placeholder="e.g., follow-up, urgent, client-meeting"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : initial ? "Update Task" : "Create Task"}
        </button>
      </div>
    </form>
  );
}
