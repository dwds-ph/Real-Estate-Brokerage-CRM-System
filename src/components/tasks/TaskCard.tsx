import { cn, formatDate } from "@/lib/utils";
import { type Task, type TaskPriority } from "@/types";

const priorityConfig: Record<TaskPriority, { label: string; dot: string; border: string }> = {
  urgent: { label: "Urgent", dot: "bg-red-500", border: "border-l-red-500" },
  high: { label: "High", dot: "bg-orange-500", border: "border-l-orange-400" },
  medium: { label: "Medium", dot: "bg-yellow-500", border: "border-l-yellow-400" },
  low: { label: "Low", dot: "bg-green-500", border: "border-l-green-400" },
};

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, status: Task["status"]) => void;
  onClick: (task: Task) => void;
}

export default function TaskCard({ task, onStatusChange, onClick }: TaskCardProps) {
  const p = priorityConfig[task.priority];
  const isOverdue = task.dueDate && task.dueDate < Date.now() && task.status !== "done";
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
        <span className={cn("h-2 w-2 rounded-full shrink-0 mt-1.5", p.dot)} title={p.label} />
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
      )}

      {/* Checklist progress */}
      {totalItems > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.round((checkedCount / totalItems) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">
            {checkedCount}/{totalItems}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
        {task.assignedName && (
          <span className="truncate max-w-[100px]" title={task.assignedName}>
            👤 {task.assignedName}
          </span>
        )}
        {task.dueDate && (
          <span className={cn(isOverdue && "text-red-500 font-medium")}>
            {isOverdue ? "⚠️ " : "📅 "}
            {isOverdue ? "Overdue" : formatDate(task.dueDate)}
          </span>
        )}
        {task.relatedTo && (
          <span className="truncate max-w-[80px]">
            🔗 {task.relatedTo.title || task.relatedTo.type}
          </span>
        )}
      </div>

      {/* Quick status toggle */}
      <div className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {(["todo", "in_progress", "done"] as const).map((s) => (
          <button
            key={s}
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(task.id, s);
            }}
            className={cn(
              "flex-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
              task.status === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent",
            )}
          >
            {s === "todo" ? "To Do" : s === "in_progress" ? "Doing" : "Done"}
          </button>
        ))}
      </div>
    </div>
  );
}
