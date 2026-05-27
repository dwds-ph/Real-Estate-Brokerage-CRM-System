import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { type Task, type TaskStatus } from "@/types";
import TaskCard from "./TaskCard";

interface TaskKanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
}

const columns: { status: TaskStatus; label: string; color: string }[] = [
  { status: "todo", label: "To Do", color: "border-t-blue-500" },
  { status: "in_progress", label: "In Progress", color: "border-t-amber-500" },
  { status: "done", label: "Done", color: "border-t-emerald-500" },
];

function TaskKanbanBoard({
  tasks,
  onStatusChange,
  onTaskClick,
}: TaskKanbanBoardProps) {
  const taskMap = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    tasks.forEach((t) => {
      if (map[t.status]) {
        map[t.status].push(t);
      }
    });
    return map;
  }, [tasks]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((col) => {
        const colTasks = taskMap[col.status];
        return (
          <div
            key={col.status}
            className={cn(
              "rounded-lg border bg-card/50 border-t-4 min-h-[200px] flex flex-col",
              col.color,
            )}
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">
                  {colTasks.length}
                </span>
              </div>
            </div>

            {/* Task list */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
              {colTasks.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
                  No tasks
                </div>
              ) : (
                colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={onStatusChange}
                    onClick={onTaskClick}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default memo(TaskKanbanBoard);
