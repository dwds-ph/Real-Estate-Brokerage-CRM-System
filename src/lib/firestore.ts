/**
 * Shared Firestore helpers — eliminates duplicate patterns across all services.
 *
 * Every service in this codebase repeats the same snapshot mapping:
 *   `snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T)`
 *
 * This module provides a single source of truth for that pattern plus
 * common CRUD operations with consistent error handling and timestamps.
 */
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  type QueryConstraint,
  type FirestoreError,
  type DocumentData,
  type DocumentSnapshot,
  type QuerySnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Types ───────────────────────────────────────────────────────────

export interface FirestoreEntity {
  id: string;
}

export type TimestampedEntity = FirestoreEntity & {
  createdAt: number;
  updatedAt: number;
};

export type ListenerError = string | null;

export interface AsyncResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// ─── Snapshot Mapper ─────────────────────────────────────────────────

/**
 * Maps a Firestore QuerySnapshot to an array of typed entities.
 * This is THE single source of truth — every service should use this.
 */
export function snapshotToEntities<T extends FirestoreEntity>(
  snapshot: QuerySnapshot<DocumentData, DocumentData>,
  transform?: (data: Record<string, unknown>, id: string) => T,
): T[] {
  return snapshot.docs.map((d) => {
    const data = { id: d.id, ...d.data() };
    return (transform ? transform(data, d.id) : data) as unknown as T;
  });
}

/**
 * Maps a single DocumentSnapshot to a typed entity (or null if not found).
 */
export function snapshotToEntity<T extends FirestoreEntity>(
  docSnap: DocumentSnapshot<DocumentData, DocumentData>,
): T | null {
  if (!docSnap.exists()) {return null;}
  return { id: docSnap.id, ...docSnap.data() } as unknown as T;
}

// ─── Generic Subscriber ──────────────────────────────────────────────

export type Unsubscribe = () => void;

/**
 * Subscribe to a Firestore query with consistent snapshot mapping.
 * Returns an unsubscribe function.
 */
export function subscribeToQuery<T extends FirestoreEntity>(
  collectionName: string,
  constraints: QueryConstraint[],
  onData: (entities: T[]) => void,
  onError?: (error: string) => void,
): Unsubscribe {
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshotToEntities<T>(snapshot));
    },
    (err: FirestoreError) => {
      // eslint-disable-next-line no-console
      console.error(`[firestore] subscribeToQuery(${collectionName}) error:`, err.message);
      onError?.(err.message);
    },
  );
}

/**
 * Subscribe to ALL documents in a collection.
 */
export function subscribeToCollection<T extends FirestoreEntity>(
  collectionName: string,
  onData: (entities: T[]) => void,
  onError?: (error: string) => void,
): Unsubscribe {
  return subscribeToQuery<T>(collectionName, [], onData, onError);
}

// ─── Generic CRUD ────────────────────────────────────────────────────

/**
 * Shape accepted by createDocument — data minus id and timestamps (helper adds them).
 */
export type CreateData<T> = Omit<T, "id" | "createdAt" | "updatedAt">;

/**
 * Like CreateData but also omits createdBy (set automatically via userId param).
 */
export type CreateDataWithUser<T> = Omit<T, "id" | "createdAt" | "updatedAt" | "createdBy">;

/**
 * Create a document with automatic timestamps.
 * Returns the new document ID.
 */
export async function createDocument<T extends FirestoreEntity>(
  collectionName: string,
  data: CreateData<T>,
): Promise<string> {
  const now = Date.now();
  const docData = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await addDoc(collection(db, collectionName), docData);
  return docRef.id;
}

/**
 * Create a document with a custom creator field.
 */
export async function createDocumentWithUser<T extends FirestoreEntity>(
  collectionName: string,
  data: CreateDataWithUser<T>,
  userId: string,
): Promise<string> {
  const now = Date.now();
  const docData = {
    ...data,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await addDoc(collection(db, collectionName), docData);
  return docRef.id;
}

/**
 * Update a document with automatic updatedAt timestamp.
 */
export async function updateDocument<T extends FirestoreEntity>(
  collectionName: string,
  documentId: string,
  data: Partial<T>,
): Promise<void> {
  await updateDoc(doc(db, collectionName, documentId), {
    ...data,
    updatedAt: Date.now(),
  });
}

/**
 * Delete a document by ID.
 */
export async function deleteDocument(
  collectionName: string,
  documentId: string,
): Promise<void> {
  await deleteDoc(doc(db, collectionName, documentId));
}

// ─── Error handling ──────────────────────────────────────────────────

/**
 * Wrap an async Firestore operation with consistent error handling.
 * Returns [result, error] tuple (Go-style error handling pattern).
 */
export async function firestoreOperation<T>(
  operation: () => Promise<T>,
  context: string,
): Promise<[T | null, string | null]> {
  try {
    const result = await operation();
    return [result, null];
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown Firestore error";
    // eslint-disable-next-line no-console
    console.error(`[firestore] ${context}:`, message);
    return [null, message];
  }
}

// ─── Collection references (single source of truth) ──────────────────

export const COLLECTIONS = {
  USERS: "users",
  LEADS: "leads",
  LISTINGS: "listings",
  DEALS: "deals",
  VIEWINGS: "viewings",
  EXPENSES: "expenses",
  PAYMENTS: "payments",
  PAYOUTS: "payouts",
  COMMISSION_PLANS: "commissionPlans",
  NOTIFICATIONS: "notifications",
  AUDIT_LOGS: "auditLogs",
  LICENSES: "licenses",
  PROJECTS: "projects",
  UNITS: "units",
  PAYMENT_MILESTONES: "paymentMilestones",
  TOURS: "tours",
  TASKS: "tasks",
  ACTIVITY_LOGS: "activityLogs",
  CALL_LOGS: "callLogs",
  CHECKLISTS: "checklists",
  CHECKLIST_TEMPLATES: "checklistTemplates",
  GOALS: "goals",
  BRANCHES: "branches",
  TEAMS: "teams",
  TEAM_MEMBERS: "teamMembers",
  CO_BROKERS: "coBrokers",
  CO_BROKER_DEALS: "coBrokerDeals",
  SPLIT_AGREEMENTS: "splitAgreements",
  OFFICES: "offices",
  VAULT_DOCUMENTS: "vaultDocuments",
  DOCUMENT_REQUESTS: "documentRequests",
  PROPERTY_DOCUMENTS: "propertyDocuments",
  COMPLIANCE_CHECKLISTS: "complianceChecklists",
  CMA_REPORTS: "cmaReports",
  MORTGAGES: "mortgages",
  BANK_PROFILES: "bankProfiles",
  CALENDAR_EVENTS: "calendarEvents",
  COMM_TEMPLATES: "commTemplates",
  REFERRALS: "referrals",
  LEADS_ROUTING_RULES: "leadRoutingRules",
  SEED_DATA: "seedData",
  SCHEDULED_REPORTS: "scheduledReports",
  EMAIL_LOGS: "emailLogs",
  EMAIL_PREFERENCES: "emailPreferences",
  FACEBOOK_IMPORT_LOGS: "facebookImportLogs",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
