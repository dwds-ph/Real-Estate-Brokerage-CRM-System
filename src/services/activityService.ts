import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  limit,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type ActivityLog } from "@/types";

// ─── Real-time listeners ─────────────────────────────────────────

export function subscribeActivityForLead(
  leadId: string | undefined,
  callback?: (activities: ActivityLog[]) => void,
) {
  if (!leadId) return () => {};
  const q = query(
    collection(db, "activityLogs"),
    where("leadId", "==", leadId),
    orderBy("createdAt", "desc"),
    limit(50),
  );
  return onSnapshot(q, (snapshot) => {
    const activities = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as ActivityLog,
    );
    callback?.(activities);
  });
}

export function subscribeActivityForDeal(
  dealId: string | undefined,
  callback?: (activities: ActivityLog[]) => void,
) {
  if (!dealId) return () => {};
  const q = query(
    collection(db, "activityLogs"),
    where("dealId", "==", dealId),
    orderBy("createdAt", "desc"),
    limit(50),
  );
  return onSnapshot(q, (snapshot) => {
    const activities = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as ActivityLog,
    );
    callback?.(activities);
  });
}

export function subscribeRecentActivity(
  brokerId: string | undefined,
  callback?: (activities: ActivityLog[]) => void,
) {
  if (!brokerId) return () => {};
  const constraints: QueryConstraint[] = [
    where("createdBy", "==", brokerId),
    orderBy("createdAt", "desc"),
    limit(20),
  ];
  const q = query(collection(db, "activityLogs"), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const activities = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as ActivityLog,
    );
    callback?.(activities);
  });
}

// ─── CRUD ────────────────────────────────────────────────────────

export async function createActivityLog(
  data: Omit<ActivityLog, "id" | "createdAt">,
) {
  const docRef = await addDoc(collection(db, "activityLogs"), {
    ...data,
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function deleteActivityLog(logId: string) {
  await deleteDoc(doc(db, "activityLogs", logId));
}
