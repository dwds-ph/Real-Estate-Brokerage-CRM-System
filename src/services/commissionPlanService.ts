import { orderBy, type QueryConstraint } from "firebase/firestore";
import {
  subscribeToQuery,
  createDocument,
  updateDocument,
  deleteDocument,
  COLLECTIONS,
} from "@/lib/firestore";
import { type CommissionPlan } from "@/types";

// ─── Commission Plans: Real-time listeners ────────────────────────────

export function subscribePlans(callback: (plans: CommissionPlan[]) => void) {
  const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
  return subscribeToQuery<CommissionPlan>(COLLECTIONS.COMMISSION_PLANS, constraints, callback);
}

// ─── Commission Plans: CRUD ───────────────────────────────────────────

export async function createPlan(
  data: Omit<CommissionPlan, "id" | "createdAt" | "updatedAt">,
) {
  return createDocument<CommissionPlan>(COLLECTIONS.COMMISSION_PLANS, data);
}

export async function updatePlan(planId: string, data: Partial<CommissionPlan>) {
  await updateDocument<CommissionPlan>(COLLECTIONS.COMMISSION_PLANS, planId, data);
}

export async function deletePlan(planId: string) {
  await deleteDocument(COLLECTIONS.COMMISSION_PLANS, planId);
}
