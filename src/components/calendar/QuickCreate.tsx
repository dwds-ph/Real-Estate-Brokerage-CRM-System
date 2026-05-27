import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createDoc } from "@/hooks/useFirestore";

export interface QuickCreateProps {
  open: boolean;
  onClose: () => void;
}

type FormMode = "none" | "viewing" | "task" | "reminder";

export default function QuickCreate({ open, onClose }: QuickCreateProps) {
  const { userProfile } = useAuth();
  const [mode, setMode] = useState<FormMode>("none");
  const [saving, setSaving] = useState(false);

  // Viewing form
  const [viewingForm, setViewingForm] = useState({
    leadId: "",
    listingId: "",
    scheduledAt: "",
    notes: "",
  });

  // Task form
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium" as "high" | "medium" | "low",
    dueDate: "",
  });

  // Reminder form
  const [reminderForm, setReminderForm] = useState({
    title: "",
    note: "",
    date: "",
  });

  const resetForms = () => {
    setViewingForm({ leadId: "", listingId: "", scheduledAt: "", notes: "" });
    setTaskForm({
      title: "",
      description: "",
      priority: "medium",
      dueDate: "",
    });
    setReminderForm({ title: "", note: "", date: "" });
    setMode("none");
  };

  const handleClose = () => {
    resetForms();
    onClose();
  };

  const handleScheduleViewing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setSaving(true);
    try {
      await createDoc("viewings", {
        ...viewingForm,
        scheduledAt: new Date(viewingForm.scheduledAt).getTime(),
        agentId: userProfile.id,
        status: "scheduled",
        photos: [],
      });
      handleClose();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setSaving(true);
    try {
      await createDoc("tasks", {
        ...taskForm,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).getTime() : null,
        agentId: userProfile.id,
        createdBy: userProfile.id,
        status: "pending",
        recurring: "none",
      });
      handleClose();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setSaving(true);
    try {
      // Create as a task with the reminder info
      await createDoc("tasks", {
        title: reminderForm.title,
        description: reminderForm.note || "Quick reminder",
        priority: "medium",
        dueDate: reminderForm.date
          ? new Date(reminderForm.date).getTime()
          : Date.now() + 86400000,
        agentId: userProfile.id,
        createdBy: userProfile.id,
        status: "pending",
        recurring: "none",
      });
      handleClose();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Quick Create</h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Mode buttons */}
        {mode === "none" && (
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setMode("viewing")}
              className="flex flex-col items-center gap-2 rounded-lg border bg-background p-4 hover:bg-muted transition-colors"
            >
              <span className="text-2xl">📅</span>
              <span className="text-xs font-medium">Schedule Viewing</span>
            </button>
            <button
              onClick={() => setMode("task")}
              className="flex flex-col items-center gap-2 rounded-lg border bg-background p-4 hover:bg-muted transition-colors"
            >
              <span className="text-2xl">✅</span>
              <span className="text-xs font-medium">Create Task</span>
            </button>
            <button
              onClick={() => setMode("reminder")}
              className="flex flex-col items-center gap-2 rounded-lg border bg-background p-4 hover:bg-muted transition-colors"
            >
              <span className="text-2xl">🔔</span>
              <span className="text-xs font-medium">Add Reminder</span>
            </button>
          </div>
        )}

        {/* Viewing form */}
        {mode === "viewing" && (
          <form onSubmit={handleScheduleViewing} className="space-y-4">
            <h3 className="font-medium text-sm">Schedule Viewing</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Lead ID</label>
              <input
                type="text"
                required
                value={viewingForm.leadId}
                onChange={(e) =>
                  setViewingForm({ ...viewingForm, leadId: e.target.value })
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="Lead document ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Listing ID
              </label>
              <input
                type="text"
                required
                value={viewingForm.listingId}
                onChange={(e) =>
                  setViewingForm({ ...viewingForm, listingId: e.target.value })
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="Listing document ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={viewingForm.scheduledAt}
                onChange={(e) =>
                  setViewingForm({
                    ...viewingForm,
                    scheduledAt: e.target.value,
                  })
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={viewingForm.notes}
                onChange={(e) =>
                  setViewingForm({ ...viewingForm, notes: e.target.value })
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("none")}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Scheduling..." : "Schedule"}
              </button>
            </div>
          </form>
        )}

        {/* Task form */}
        {mode === "task" && (
          <form onSubmit={handleCreateTask} className="space-y-4">
            <h3 className="font-medium text-sm">Create Task</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                required
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, title: e.target.value })
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="Task title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={taskForm.description}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, description: e.target.value })
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Priority
                </label>
                <select
                  value={taskForm.priority}
                  onChange={(e) =>
                    setTaskForm({
                      ...taskForm,
                      priority: e.target.value as "high" | "medium" | "low",
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
                <label className="block text-sm font-medium mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, dueDate: e.target.value })
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("none")}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        )}

        {/* Reminder form */}
        {mode === "reminder" && (
          <form onSubmit={handleAddReminder} className="space-y-4">
            <h3 className="font-medium text-sm">Add Reminder</h3>
            <div>
              <label className="block text-sm font-medium mb-1">
                Reminder Title
              </label>
              <input
                type="text"
                required
                value={reminderForm.title}
                onChange={(e) =>
                  setReminderForm({ ...reminderForm, title: e.target.value })
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="Reminder title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Note</label>
              <textarea
                value={reminderForm.note}
                onChange={(e) =>
                  setReminderForm({ ...reminderForm, note: e.target.value })
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={reminderForm.date}
                onChange={(e) =>
                  setReminderForm({ ...reminderForm, date: e.target.value })
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("none")}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Adding..." : "Add Reminder"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
