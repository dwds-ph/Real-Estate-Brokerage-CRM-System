import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  Timestamp,
  type QueryConstraint,
  type Unsubscribe,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type Payout } from "@/types";

// ─── Real-time listeners ─────────────────────────────────────────

export function subscribePayouts(
  brokerId: string | undefined,
  callback: (payouts: Payout[]) => void,
): Unsubscribe {
  if (!brokerId) return () => {};

  const constraints: QueryConstraint[] = [
    where("brokerId", "==", brokerId),
    orderBy("createdAt", "desc"),
  ];

  const q = query(collection(db, "payouts"), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const payouts = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Payout,
    );
    callback(payouts);
  });
}

export function subscribePendingPayouts(
  brokerId: string | undefined,
  callback: (payouts: Payout[]) => void,
): Unsubscribe {
  if (!brokerId) return () => {};

  const constraints: QueryConstraint[] = [
    where("brokerId", "==", brokerId),
    where("status", "in", ["pending", "approved"]),
    orderBy("createdAt", "desc"),
  ];

  const q = query(collection(db, "payouts"), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const payouts = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Payout,
    );
    callback(payouts);
  });
}

// ─── Status updates ──────────────────────────────────────────────

export async function updatePayoutStatus(
  payoutId: string,
  status: Payout["status"],
  userId?: string,
) {
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: Date.now(),
  };

  if (status === "approved") {
    updateData.approvedAt = Date.now();
    if (userId) updateData.approvedBy = userId;
  }

  if (status === "paid") {
    updateData.paidAt = Date.now();
    if (userId) updateData.paidBy = userId;
  }

  await updateDoc(doc(db, "payouts", payoutId), updateData);
}

// ─── Bulk operations ─────────────────────────────────────────────

export async function bulkUpdatePayoutStatus(
  payoutIds: string[],
  status: Payout["status"],
  userId?: string,
) {
  if (payoutIds.length === 0) return;

  const batch = writeBatch(db);
  const now = Date.now();

  payoutIds.forEach((payoutId) => {
    const ref = doc(db, "payouts", payoutId);
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: now,
    };

    if (status === "approved") {
      updateData.approvedAt = now;
      if (userId) updateData.approvedBy = userId;
    }

    if (status === "paid") {
      updateData.paidAt = now;
      if (userId) updateData.paidBy = userId;
    }

    batch.update(ref, updateData);
  });

  await batch.commit();
}

// ─── Delete ──────────────────────────────────────────────────────

export async function deletePayout(payoutId: string) {
  await deleteDoc(doc(db, "payouts", payoutId));
}
