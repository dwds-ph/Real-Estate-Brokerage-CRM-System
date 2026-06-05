import {
  where,
  orderBy,
  limit,
  type QueryConstraint,
  getDocs,
  addDoc,
  collection,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  subscribeToQuery,
  COLLECTIONS,
} from "@/lib/firestore";
import type { AuditLogEntry } from "@/types";

// ─── Real-time listener ─────────────────────────────────────────

export function subscribeAuditLogs(
  orgId: string,
  callback: (logs: AuditLogEntry[]) => void,
) {
  const constraints: QueryConstraint[] = [
    where("orgId", "==", orgId),
    orderBy("timestamp", "desc"),
    limit(200),
  ];

  return subscribeToQuery<AuditLogEntry>(COLLECTIONS.AUDIT_LOGS, constraints, callback);
}

// ─── Create immutable log entry ──────────────────────────────────

export async function createAuditLog(
  data: Omit<AuditLogEntry, "id">,
  userId: string,
): Promise<string> {
  const docRef = await addDoc(
    collection(db, COLLECTIONS.AUDIT_LOGS),
    {
      ...data,
      userId,
      timestamp: Date.now(),
    },
  );
  return docRef.id;
}

// ─── Get logs for a specific entity ──────────────────────────────

export async function getAuditLogsForEntity(
  collectionName: string,
  docId: string,
): Promise<AuditLogEntry[]> {
  const constraints: QueryConstraint[] = [
    where("collection", "==", collectionName),
    where("docId", "==", docId),
    orderBy("timestamp", "desc"),
  ];

  const q = query(collection(db, COLLECTIONS.AUDIT_LOGS), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => {
    const data = { id: d.id, ...d.data() } as unknown as AuditLogEntry;
    return data;
  });
}
