import { where, orderBy, type QueryConstraint } from "firebase/firestore";
import {
  subscribeToQuery,
  createDocument,
  updateDocument,
  deleteDocument,
  COLLECTIONS,
} from "@/lib/firestore";
import { type Task, type TaskStatus, type ChecklistItem } from "@/types";

// ─── Real-time listeners ─────────────────────────────────────────

export function subscribeTasks(
  brokerId: string | undefined,
  filters?: { assignedTo?: string; status?: TaskStatus },
  callback?: (tasks: Task[]) => void,
) {
  if (!brokerId) {return () => {};}
  const constraints: QueryConstraint[] = [
    where("brokerId", "==", brokerId),
    orderBy("createdAt", "desc"),
  ];
  if (filters?.assignedTo) {
    constraints.unshift(where("assignedTo", "==", filters.assignedTo));
  }
  if (filters?.status) {
    constraints.unshift(where("status", "==", filters.status));
  }
  return subscribeToQuery<Task>(COLLECTIONS.TASKS, constraints, callback ?? (() => {}));
}

export function subscribeTasksByAssignee(
  userId: string | undefined,
  callback?: (tasks: Task[]) => void,
) {
  if (!userId) {return () => {};}
  return subscribeToQuery<Task>(
    COLLECTIONS.TASKS,
    [where("assignedTo", "==", userId), orderBy("createdAt", "desc")],
    callback ?? (() => {}),
  );
}

// ─── CRUD ────────────────────────────────────────────────────────

export async function createTask(
  data: Omit<Task, "id" | "createdAt" | "updatedAt">,
) {
  return createDocument<Task>(COLLECTIONS.TASKS, data as Omit<Task, "id">);
}

export async function updateTask(
  taskId: string,
  data: Partial<Omit<Task, "id" | "createdAt">>,
) {
  return updateDocument<Task>(COLLECTIONS.TASKS, taskId, data);
}

export async function deleteTask(taskId: string) {
  return deleteDocument(COLLECTIONS.TASKS, taskId);
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  return updateDocument<Task>(COLLECTIONS.TASKS, taskId, { status } as Partial<Task>);
}

export async function updateTaskChecklist(
  taskId: string,
  checklist: ChecklistItem[],
) {
  return updateDocument<Task>(COLLECTIONS.TASKS, taskId, { checklist } as Partial<Task>);
}
