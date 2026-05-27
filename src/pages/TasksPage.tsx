import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/hooks/useFirestore";
import {
  createTask,
  updateTaskStatus,
  deleteTask,
  updateTaskChecklist,
} from "@/services/taskService";
import type { Task, ChecklistTemplate } from "@/types";
import { cn } from "@/lib/utils";
import {
  TaskKanbanBoard,
  TaskForm,
  type TaskFormData,
  TaskFilters,
  type TaskFilterValues,
  ChecklistManager,
  ChecklistTemplateManager,
} from "@/components/tasks";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function TasksPage() {
  const { userProfile } = useAuth();
  const brokerId = userProfile?.brokerId || userProfile?.id;

  // ─── Data ──────────────────────────────────────────────────────
  const { data: agents } = useCollection<any>(
    "users",
    brokerId
      ? ([where("brokerId", "==", brokerId)] as any)
      : ([] as any),
  );

  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Listen to tasks
  useEffect(() => {
    if (!brokerId) return;
    const q = query(
      collection(db, "tasks"),
      where("brokerId", "==", brokerId),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task));
      setLoading(false);
    });
    return unsub;
  }, [brokerId]);

  // Listen to checklist templates
  useEffect(() => {
    if (!brokerId) return;
    const q = query(
      collection(db, "checklistTemplates"),
      where("brokerId", "==", brokerId),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setTemplates(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChecklistTemplate));
    });
    return unsub;
  }, [brokerId]);

  // ─── UI state ──────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);
  const [showChecklistPanel, setShowChecklistPanel] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [filters, setFilters] = useState<TaskFilterValues>({
    search: "",
    status: "all",
    priority: "all",
    assignedTo: "",
    overdue: false,
  });

  // ─── Filtering ─────────────────────────────────────────────────
  const filteredTasks = tasks.filter((t) => {
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (!t.title.toLowerCase().includes(s) && !t.description?.toLowerCase().includes(s)) return false;
    }
    if (filters.status !== "all" && t.status !== filters.status) return false;
    if (filters.priority !== "all" && t.priority !== filters.priority) return false;
    if (filters.assignedTo && t.assignedTo !== filters.assignedTo) return false;
    if (filters.overdue && (!t.dueDate || t.dueDate >= Date.now() || t.status === "done")) return false;
    return true;
  });

  // ─── Handlers ──────────────────────────────────────────────────
  const handleCreateTask = useCallback(async (data: TaskFormData) => {
    if (!userProfile || !brokerId) return;
    setSaving(true);
    try {
      await createTask({
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        assignedTo: data.assignedTo || userProfile.id,
        assignedName: data.assignedName || userProfile.displayName,
        createdBy: userProfile.id,
        createdByName: userProfile.displayName,
        brokerId,
        dueDate: data.dueDate ? new Date(data.dueDate).getTime() : undefined,
        checklist: [],
        relatedTo: data.relatedToType
          ? { type: data.relatedToType as any, id: data.relatedToId, title: data.relatedToTitle }
          : undefined,
        tags: data.tags
          ? data.tags.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
        recurring: data.recurring,
      });
      setShowForm(false);
      setEditingTask(null);
    } finally {
      setSaving(false);
    }
  }, [userProfile, brokerId]);

  const handleStatusChange = useCallback(async (taskId: string, status: Task["status"]) => {
    await updateTaskStatus(taskId, status);
  }, []);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setShowChecklistPanel(null);
  }, []);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    await deleteTask(taskId);
    setSelectedTask(null);
  }, []);

  const handleCreateTemplate = useCallback(async (data: { name: string; description: string; items: string[] }) => {
    if (!brokerId || !userProfile) return;
    await addDoc(collection(db, "checklistTemplates"), {
      name: data.name,
      description: data.description,
      items: data.items.map((text) => ({ label: text, required: false })),
      scope: "deal",
      brokerId,
      createdBy: userProfile.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }, [brokerId, userProfile]);

  const handleDeleteTemplate = useCallback(async (id: string) => {
    await deleteDoc(doc(db, "checklistTemplates", id));
  }, []);

  const handleLoadTemplate = useCallback((template: ChecklistTemplate) => {
    setEditingTask((prev) => {
      if (!prev) return prev;
      const existing = prev.checklist || [];
      const newItems = template.items.map((item) => ({
        id: `cl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        text: item.label,
        checked: false,
      }));
      updateTaskChecklist(prev.id, [...existing, ...newItems]);
      return { ...prev, checklist: [...existing, ...newItems] };
    });
  }, []);

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            {tasks.filter((t) => t.status !== "done").length} active ·{" "}
            {tasks.filter((t) => t.status === "done").length} done
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTask(null);
            setShowForm(!showForm);
          }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {showForm ? "✕ Close" : "+ New Task"}
        </button>
      </div>

      {/* New / Edit task form */}
      {showForm && (
        <div className="rounded-lg border bg-card p-4 max-w-lg">
          <h3 className="font-semibold mb-3">
            {editingTask ? "Edit Task" : "Create New Task"}
          </h3>
          <TaskForm
            initial={editingTask || undefined}
            agents={(agents || []) as any}
            onSubmit={handleCreateTask}
            onCancel={() => {
              setShowForm(false);
              setEditingTask(null);
            }}
            saving={saving}
          />
        </div>
      )}

      {/* Filters */}
      <TaskFilters
        agents={(agents || []) as any}
        values={filters}
        onChange={setFilters}
      />

      {/* Main content: Kanban + detail sidebar */}
      <div className="flex gap-4">
        {/* Kanban board */}
        <div className={cn("flex-1", selectedTask && "hidden lg:block")}>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <TaskKanbanBoard
              tasks={filteredTasks}
              onStatusChange={handleStatusChange}
              onTaskClick={handleTaskClick}
            />
          )}
        </div>

        {/* Task detail panel */}
        {selectedTask && (
          <div className="w-full lg:w-96 shrink-0 space-y-3">
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-sm flex-1">{selectedTask.title}</h3>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  ✕
                </button>
              </div>

              {selectedTask.description && (
                <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
              )}

              {/* Meta */}
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">Priority:</span> {selectedTask.priority}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {selectedTask.status.replace("_", " ")}
                </div>
                {selectedTask.assignedName && (
                  <div>
                    <span className="font-medium">Assigned to:</span> {selectedTask.assignedName}
                  </div>
                )}
                {selectedTask.dueDate && (
                  <div>
                    <span className="font-medium">Due:</span>{" "}
                    <span className={cn(selectedTask.dueDate < Date.now() && "text-red-500")}>
                      {new Date(selectedTask.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {selectedTask.relatedTo && (
                  <div className="col-span-2">
                    <span className="font-medium">Related:</span> {selectedTask.relatedTo.type} —{" "}
                    {selectedTask.relatedTo.title || selectedTask.relatedTo.id}
                  </div>
                )}
                {selectedTask.tags && selectedTask.tags.length > 0 && (
                  <div className="col-span-2 flex flex-wrap gap-1">
                    {selectedTask.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted px-2 py-0.5 text-[10px]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setEditingTask(selectedTask);
                    setShowForm(true);
                  }}
                  className="flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowChecklistPanel(showChecklistPanel === selectedTask.id ? null : selectedTask.id)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium",
                    showChecklistPanel === selectedTask.id ? "bg-primary/10 border-primary" : "hover:bg-muted",
                  )}
                >
                  Checklist ({selectedTask.checklist?.length || 0})
                </button>
                <button
                  onClick={() => handleDeleteTask(selectedTask.id)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                >
                  Delete
                </button>
              </div>

              {/* Checklist panel */}
              {showChecklistPanel === selectedTask.id && (
                <div className="border-t pt-3 space-y-3">
                  <ChecklistManager
                    items={selectedTask.checklist || []}
                    onChange={(items) => {
                      updateTaskChecklist(selectedTask.id, items);
                      setSelectedTask({ ...selectedTask, checklist: items });
                    }}
                  />
                  <ChecklistTemplateManager
                    templates={templates}
                    onCreate={handleCreateTemplate}
                    onDelete={handleDeleteTemplate}
                    onLoad={handleLoadTemplate}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
