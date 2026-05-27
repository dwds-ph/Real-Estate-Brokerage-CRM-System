import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTasks, createDoc, updateDocById } from "@/hooks/useFirestore";
import { TaskItem } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import { addDays, addWeeks, addMonths } from "date-fns";

export default function TasksPage() {
  const { userProfile } = useAuth();
  const { data: tasks, loading } = useTasks(userProfile?.id);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("pending");

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskItem["priority"],
    dueDate: "",
    recurring: "none" as TaskItem["recurring"],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    await createDoc("tasks", {
      ...form,
      dueDate: form.dueDate ? new Date(form.dueDate).getTime() : null,
      agentId: userProfile.id,
      createdBy: userProfile.id,
      status: "pending",
    });
    setForm({
      title: "",
      description: "",
      priority: "medium",
      dueDate: "",
      recurring: "none",
    });
    setShowForm(false);
  };

  const handleToggle = async (task: TaskItem) => {
    const newStatus = task.status === "done" ? "pending" : "done";
    await updateDocById("tasks", task.id, {
      status: newStatus,
    });

    // If marked as done and has recurring, auto-create next instance
    if (
      newStatus === "done" &&
      task.recurring &&
      task.recurring !== "none" &&
      task.dueDate
    ) {
      let nextDue: Date;
      const due = new Date(task.dueDate);
      switch (task.recurring) {
        case "daily":
          nextDue = addDays(due, 1);
          break;
        case "weekly":
          nextDue = addWeeks(due, 1);
          break;
        case "monthly":
          nextDue = addMonths(due, 1);
          break;
        default:
          nextDue = addWeeks(due, 1);
      }
      await createDoc("tasks", {
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        dueDate: nextDue.getTime(),
        agentId: task.agentId,
        createdBy: task.createdBy,
        status: "pending",
        recurring: task.recurring,
        relatedTo: task.relatedTo || null,
      });
    }
  };

  const filtered = tasks
    .filter((t) => filter === "all" || (t as TaskItem).status === filter)
    .sort((a, b) => {
      const pa =
        (a as TaskItem).priority === "high"
          ? 0
          : (a as TaskItem).priority === "medium"
            ? 1
            : 2;
      const pb =
        (b as TaskItem).priority === "high"
          ? 0
          : (b as TaskItem).priority === "medium"
            ? 1
            : 2;
      return pa - pb;
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">
            {tasks.filter((t) => (t as TaskItem).status === "pending").length}{" "}
            pending
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {showForm ? "Cancel" : "+ New Task"}
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["pending", "all", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium border capitalize",
              filter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card hover:bg-muted",
            )}
          >
            {f} (
            {
              tasks.filter((t) => f === "all" || (t as TaskItem).status === f)
                .length
            }
            )
          </button>
        ))}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border bg-card p-6 space-y-4 max-w-md"
        >
          <h3 className="font-semibold">New Task</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm({
                    ...form,
                    priority: e.target.value as TaskItem["priority"],
                  })
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Recurring</label>
            <select
              value={form.recurring}
              onChange={(e) =>
                setForm({
                  ...form,
                  recurring: e.target.value as TaskItem["recurring"],
                })
              }
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Create Task
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          No tasks
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const task = t as TaskItem;
            return (
              <div
                key={task.id}
                className={cn(
                  "rounded-lg border bg-card p-4 flex items-center gap-3",
                  task.status === "done" && "opacity-60",
                )}
              >
                <input
                  type="checkbox"
                  checked={task.status === "done"}
                  onChange={() => handleToggle(task)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        task.status === "done" && "line-through",
                      )}
                    >
                      {task.title}
                    </p>
                    <span
                      className={cn("rounded-full px-2 py-0.5 text-xs", {
                        "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300":
                          task.priority === "high",
                        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300":
                          task.priority === "medium",
                        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300":
                          task.priority === "low",
                      })}
                    >
                      {task.priority}
                    </span>
                    {task.recurring && task.recurring !== "none" && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                        ↻ {task.recurring}
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {task.description}
                    </p>
                  )}
                  {task.dueDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Due: {formatDate(task.dueDate)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
