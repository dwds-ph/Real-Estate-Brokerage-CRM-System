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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type AgentGoal } from "@/types";

export function subscribeGoals(brokerId: string | undefined, callback: (goals: AgentGoal[]) => void) {
  if (!brokerId) return () => {};
  const q = query(collection(db, "goals"), where("brokerId", "==", brokerId), orderBy("periodStart", "desc"));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AgentGoal)));
}

export async function createGoal(data: Omit<AgentGoal, "id" | "createdAt" | "updatedAt">) {
  const now = Date.now();
  const docRef = await addDoc(collection(db, "goals"), { ...data, createdAt: now, updatedAt: now });
  return docRef.id;
}

export async function updateGoal(id: string, data: Partial<AgentGoal>) {
  await updateDoc(doc(db, "goals", id), { ...data, updatedAt: Date.now() });
}

export async function deleteGoal(id: string) {
  await deleteDoc(doc(db, "goals", id));
}
