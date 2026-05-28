import {
  where,
  orderBy,
  writeBatch,
  doc,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  subscribeToQuery,
  updateDocument,
  deleteDocument,
  COLLECTIONS,
  type Unsubscribe,
} from "@/lib/firestore";
import { type Payout } from "@/types";

// ─── Real-time listeners ─────────────────────────────────────────

export function subscribePayouts(
  brokerId: string | undefined,
  callback: (payouts: Payout[]) => void,
  onError?: (error: string) => void,
): Unsubscribe {
  if (!brokerId) {return () => {};}

  const constraints: QueryConstraint[] = [
    where("brokerId", "==", brokerId),
    orderBy("createdAt", "desc"),
  ];

  return subscribeToQuery<Payout>(COLLECTIONS.PAYOUTS, constraints, callback, onError);
}

export function subscribePendingPayouts(
  brokerId: string | undefined,
  callback: (payouts: Payout[]) => void,
): Unsubscribe {
  if (!brokerId) {return () => {};}

  const constraints: QueryConstraint[] = [
    where("brokerId", "==", brokerId),
    where("status", "in", ["pending", "approved"]),
    orderBy("createdAt", "desc"),
  ];

  return subscribeToQuery<Payout>(COLLECTIONS.PAYOUTS, constraints, callback);
}

// ─── Status updates ──────────────────────────────────────────────

export async function updatePayoutStatus(
  payoutId: string,
  status: Payout["status"],
  userId?: string,
) {
  const updateData: Record<string, unknown> = {
    status,
  };

  if (status === "approved") {
    updateData.approvedAt = Date.now();
    if (userId) {updateData.approvedBy = userId;}
  }

  if (status === "paid") {
    updateData.paidAt = Date.now();
    if (userId) {updateData.paidBy = userId;}
  }

  await updateDocument(COLLECTIONS.PAYOUTS, payoutId, updateData as Partial<Payout>);
}

// ─── Bulk operations ─────────────────────────────────────────────

export async function bulkUpdatePayoutStatus(
  payoutIds: string[],
  status: Payout["status"],
  userId?: string,
) {
  if (payoutIds.length === 0) {return;}

  const batch = writeBatch(db);
  const now = Date.now();

  payoutIds.forEach((payoutId) => {
    const ref = doc(db, COLLECTIONS.PAYOUTS, payoutId);
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: now,
    };

    if (status === "approved") {
      updateData.approvedAt = now;
      if (userId) {updateData.approvedBy = userId;}
    }

    if (status === "paid") {
      updateData.paidAt = now;
      if (userId) {updateData.paidBy = userId;}
    }

    batch.update(ref, updateData);
  });

  await batch.commit();
}

// ─── Delete ──────────────────────────────────────────────────────

export async function deletePayout(payoutId: string) {
  await deleteDocument(COLLECTIONS.PAYOUTS, payoutId);
}
