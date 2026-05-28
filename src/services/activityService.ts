import {
  where,
  orderBy,
  limit,
  type QueryConstraint,
} from "firebase/firestore";
import {
  subscribeToQuery,
  createDocument,
  deleteDocument,
  COLLECTIONS,
} from "@/lib/firestore";
import { type ActivityLog } from "@/types";

// ─── Real-time listeners ─────────────────────────────────────────

export function subscribeActivityForLead(
  leadId: string | undefined,
  callback?: (activities: ActivityLog[]) => void,
) {
  if (!leadId) return () => {};

  const constraints: QueryConstraint[] = [
    where("leadId", "==", leadId),
    orderBy("createdAt", "desc"),
    limit(50),
  ];

  return subscribeToQuery<ActivityLog>(
    COLLECTIONS.ACTIVITY_LOGS,
    constraints,
    (activities) => callback?.(activities),
  );
}

export function subscribeActivityForDeal(
  dealId: string | undefined,
  callback?: (activities: ActivityLog[]) => void,
) {
  if (!dealId) return () => {};

  const constraints: QueryConstraint[] = [
    where("dealId", "==", dealId),
    orderBy("createdAt", "desc"),
    limit(50),
  ];

  return subscribeToQuery<ActivityLog>(
    COLLECTIONS.ACTIVITY_LOGS,
    constraints,
    (activities) => callback?.(activities),
  );
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

  return subscribeToQuery<ActivityLog>(
    COLLECTIONS.ACTIVITY_LOGS,
    constraints,
    (activities) => callback?.(activities),
  );
}

// ─── CRUD ────────────────────────────────────────────────────────

export async function createActivityLog(
  data: Omit<ActivityLog, "id" | "createdAt">,
) {
  return createDocument<ActivityLog>(COLLECTIONS.ACTIVITY_LOGS, data);
}

export async function deleteActivityLog(logId: string) {
  await deleteDocument(COLLECTIONS.ACTIVITY_LOGS, logId);
}
