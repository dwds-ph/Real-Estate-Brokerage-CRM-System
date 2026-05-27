import { useState, useEffect } from "react";
import {
  type Task, type TaskPriority, type TaskStatus
} from "@/types";

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

export default function TaskForm({ initial, agents, onSubmit, onCancel, saving }: TaskFormProps) {
  const [form, setForm] = useState<TaskFormData>(emptyFormData);

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title,
        description: initial.description || "",
        priority: initial.priority,
        status: initial.status,
        dueDate: initial.dueDate ? new Date(initial.dueDate).toISOString().split("T")[0] : "",
        assignedTo: initial.assignedTo,
        assignedName: initial.assignedName || "",
        relatedToType: initial.relatedTo?.type || "",
        relatedToId: initial.relatedTo?.id || "",
        relatedToTitle: initial.relatedTo?.title || "",
        tags: (initial.tags || []).join(", "),
        recurring: initial.recurring || "none",
      });
    }
  }, [initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Title *</label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          placeholder="What needs to be done?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          rows={3}
          placeholder="Optional details..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🟠 High</option>
            <option value="urgent">🔴 Urgent</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="todo">📋 To Do</option>
            <option value="in_progress">🔄 In Progress</option>
            <option value="done">✅ Done</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Due Date</label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Recurring</label>
          <select
            value={form.recurring}
            onChange={(e) => setForm({ ...form, recurring: e.target.value as TaskFormData["recurring"] })}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="none">None</option>
            <option value="daily">↻ Daily</option>
            <option value="weekly">↻ Weekly</option>
            <option value="monthly">↻ Monthly</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Assign To</label>
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
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
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
        <label className="block text-sm font-medium mb-1">Link to</label>
        <div className="grid grid-cols-3 gap-2">
          <select
            value={form.relatedToType}
            onChange={(e) =>
              setForm({
                ...form,
                relatedToType: e.target.value as TaskFormData["relatedToType"],
              })
            }
            className="rounded-lg border bg-background px-2 py-2 text-sm"
          >
            <option value="">None</option>
            <option value="lead">Lead</option>
            <option value="deal">Deal</option>
            <option value="listing">Listing</option>
            <option value="project">Project</option>
          </select>
          <input
            type="text"
            value={form.relatedToId}
            onChange={(e) => setForm({ ...form, relatedToId: e.target.value })}
            placeholder="ID"
            className="rounded-lg border bg-background px-2 py-2 text-sm"
          />
          <input
            type="text"
            value={form.relatedToTitle}
            onChange={(e) => setForm({ ...form, relatedToTitle: e.target.value })}
            placeholder="Title"
            className="rounded-lg border bg-background px-2 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
        <input
          type="text"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          placeholder="e.g., follow-up, paperwork, client-meeting"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : initial ? "Update Task" : "Create Task"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
