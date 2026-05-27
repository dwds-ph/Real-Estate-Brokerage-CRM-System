import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type Task, type TaskStatus, type ChecklistItem } from "@/types";

// ─── Real-time listeners ─────────────────────────────────────────

export function subscribeTasks(
  brokerId: string | undefined,
  filters?: { assignedTo?: string; status?: TaskStatus },
  callback?: (tasks: Task[]) => void,
) {
  if (!brokerId) return () => {};
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
  const q = query(collection(db, "tasks"), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Task,
    );
    callback?.(tasks);
  });
}

export function subscribeTasksByAssignee(
  userId: string | undefined,
  callback?: (tasks: Task[]) => void,
) {
  if (!userId) return () => {};
  const q = query(
    collection(db, "tasks"),
    where("assignedTo", "==", userId),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Task,
    );
    callback?.(tasks);
  });
}

// ─── CRUD ────────────────────────────────────────────────────────

export async function createTask(
  data: Omit<Task, "id" | "createdAt" | "updatedAt">,
) {
  const now = Date.now();
  const docRef = await addDoc(collection(db, "tasks"), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateTask(
  taskId: string,
  data: Partial<Omit<Task, "id" | "createdAt">>,
) {
  await updateDoc(doc(db, "tasks", taskId), {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteTask(taskId: string) {
  await deleteDoc(doc(db, "tasks", taskId));
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  await updateDoc(doc(db, "tasks", taskId), {
    status,
    updatedAt: Date.now(),
  });
}

export async function updateTaskChecklist(
  taskId: string,
  checklist: ChecklistItem[],
) {
  await updateDoc(doc(db, "tasks", taskId), {
    checklist,
    updatedAt: Date.now(),
  });
}
