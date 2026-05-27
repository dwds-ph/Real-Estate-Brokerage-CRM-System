import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type CommissionPlan } from "@/types";

// ─── Commission Plans: Real-time listeners ────────────────────────────

export function subscribePlans(callback: (plans: CommissionPlan[]) => void) {
  const q = query(collection(db, "commissionPlans"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const plans = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as CommissionPlan,
    );
    callback(plans);
  });
}

// ─── Commission Plans: CRUD ───────────────────────────────────────────

export async function createPlan(
  data: Omit<CommissionPlan, "id" | "createdAt" | "updatedAt">,
) {
  const now = Date.now();
  const docRef = await addDoc(collection(db, "commissionPlans"), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updatePlan(planId: string, data: Partial<CommissionPlan>) {
  await updateDoc(doc(db, "commissionPlans", planId), {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deletePlan(planId: string) {
  await deleteDoc(doc(db, "commissionPlans", planId));
}
