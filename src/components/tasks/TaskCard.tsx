import { memo, useMemo } from "react";
import { cn, formatDate } from "@/lib/utils";
import { type Task, type TaskPriority } from "@/types";

const priorityConfig: Record<
  TaskPriority,
  { label: string; dot: string; border: string }
> = {
  urgent: { label: "Urgent", dot: "bg-red-500", border: "border-l-red-500" },
  high: { label: "High", dot: "bg-orange-500", border: "border-l-orange-400" },
  medium: {
    label: "Medium",
    dot: "bg-yellow-500",
    border: "border-l-yellow-400",
  },
  low: { label: "Low", dot: "bg-green-500", border: "border-l-green-400" },
};

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, status: Task["status"]) => void;
  onClick: (task: Task) => void;
}

function TaskCard({ task, onStatusChange, onClick }: TaskCardProps) {
  const p = priorityConfig[task.priority];
  const now = useMemo(() => Date.now(), []); // eslint-disable-line react-hooks/purity
  const isOverdue =
    task.dueDate && task.dueDate < now && task.status !== "done";
  const checkedCount = task.checklist?.filter((c) => c.checked).length ?? 0;
  const totalItems = task.checklist?.length ?? 0;

  return (
    <div
      className={cn(
        "group rounded-lg border bg-card p-3 cursor-pointer hover:shadow-md transition-all border-l-4",
        p.border,
        task.status === "done" && "opacity-60",
      )}
      onClick={() => onClick(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(task);
        }
      }}
    >
      {/* Title & Priority */}
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "text-sm font-medium line-clamp-2 flex-1",
            task.status === "done" && "line-through",
          )}
        >
          {task.title}
        </p>
        <span
          className={cn(
            "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
            p.dot === "bg-red-500" && "bg-red-100 text-red-700",
            p.dot === "bg-orange-500" && "bg-orange-100 text-orange-700",
            p.dot === "bg-yellow-500" && "bg-yellow-100 text-yellow-700",
            p.dot === "bg-green-500" && "bg-green-100 text-green-700",
          )}
        >
          {p.label}
        </span>
      </div>

      {/* Due Date */}
      {task.dueDate && (
        <p
          className={cn(
            "mt-2 text-xs text-muted-foreground",
            isOverdue && "font-semibold text-red-500",
          )}
        >
          {isOverdue ? "⚠ Overdue: " : "Due: "}
          {formatDate(task.dueDate)}
        </p>
      )}

      {/* Checklist Progress */}
      {totalItems > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(checkedCount / totalItems) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">
            {checkedCount}/{totalItems}
          </span>
        </div>
      )}

      {/* Assignee & Status */}
      <div className="mt-2 flex items-center justify-between">
        {task.assignedName ? (
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
              {task.assignedName.charAt(0).toUpperCase()}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {task.assignedName}
            </span>
          </div>
        ) : (
          <div />
        )}

        {/* Status Actions */}
        <div className="flex gap-1">
          {(["todo", "in_progress", "done"] as const).map((s) => (
            <button
              key={s}
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(task.id, s);
              }}
              className={cn(
                "rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors",
                task.status === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent",
              )}
            >
              {s === "todo" ? "Todo" : s === "in_progress" ? "Doing" : "Done"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(TaskCard);
