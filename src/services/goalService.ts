import { where, orderBy } from "firebase/firestore";
import {
  subscribeToQuery,
  createDocument,
  updateDocument,
  deleteDocument,
  COLLECTIONS,
} from "@/lib/firestore";
import { type AgentGoal } from "@/types";

export function subscribeGoals(brokerId: string | undefined, callback: (goals: AgentGoal[]) => void) {
  if (!brokerId) return () => {};
  return subscribeToQuery<AgentGoal>(
    COLLECTIONS.GOALS,
    [where("brokerId", "==", brokerId), orderBy("periodStart", "desc")],
    callback,
  );
}

export async function createGoal(data: Omit<AgentGoal, "id" | "createdAt" | "updatedAt">) {
  return createDocument<AgentGoal>(COLLECTIONS.GOALS, data);
}

export async function updateGoal(id: string, data: Partial<AgentGoal>) {
  return updateDocument<AgentGoal>(COLLECTIONS.GOALS, id, data);
}

export async function deleteGoal(id: string) {
  return deleteDocument(COLLECTIONS.GOALS, id);
}
