import { cn } from "@/lib/utils";
import { type TaskPriority, type TaskStatus } from "@/types";

export interface TaskFilterValues {
  search: string;
  status: TaskStatus | "all";
  priority: TaskPriority | "all";
  assignedTo: string;
  overdue: boolean;
}

interface TaskFiltersProps {
  agents: { id: string; displayName: string }[];
  values: TaskFilterValues;
  onChange: (values: TaskFilterValues) => void;
}

export default function TaskFilters({ agents, values, onChange }: TaskFiltersProps) {
  const update = (patch: Partial<TaskFilterValues>) => onChange({ ...values, ...patch });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">🔍</span>
        <input
          type="text"
          value={values.search}
          onChange={(e) => update({ search: e.target.value })}
          placeholder="Search tasks..."
          className="w-full rounded-lg border bg-background pl-8 pr-3 py-2 text-sm"
        />
      </div>

      {/* Status filter */}
      <select
        value={values.status}
        onChange={(e) => update({ status: e.target.value as TaskStatus | "all" })}
        className="rounded-lg border bg-background px-3 py-2 text-sm"
      >
        <option value="all">All Status</option>
        <option value="todo">📋 To Do</option>
        <option value="in_progress">🔄 In Progress</option>
        <option value="done">✅ Done</option>
      </select>

      {/* Priority filter */}
      <select
        value={values.priority}
        onChange={(e) => update({ priority: e.target.value as TaskPriority | "all" })}
        className="rounded-lg border bg-background px-3 py-2 text-sm"
      >
        <option value="all">All Priority</option>
        <option value="urgent">🔴 Urgent</option>
        <option value="high">🟠 High</option>
        <option value="medium">🟡 Medium</option>
        <option value="low">🟢 Low</option>
      </select>

      {/* Assignee filter */}
      <select
        value={values.assignedTo}
        onChange={(e) => update({ assignedTo: e.target.value })}
        className="rounded-lg border bg-background px-3 py-2 text-sm max-w-[150px]"
      >
        <option value="">All Agents</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>
            {a.displayName}
          </option>
        ))}
      </select>

      {/* Overdue toggle */}
      <button
        onClick={() => update({ overdue: !values.overdue })}
        className={cn(
          "rounded-lg border px-3 py-2 text-sm transition-colors",
          values.overdue
            ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300"
            : "bg-card hover:bg-muted",
        )}
      >
        ⏰ Overdue
      </button>
    </div>
  );
}
