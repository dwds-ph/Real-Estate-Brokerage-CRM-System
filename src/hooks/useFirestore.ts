import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  DocumentData,
  QueryConstraint,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

// ─── Generic Firestore Hook ─────────────────────────────────────────
export function useCollection<T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, collectionName), ...constraints);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results = snapshot.docs.map((d) => {
          const item = { id: d.id, ...d.data() } as unknown as T;
          return item;
        });
        setData(results);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, JSON.stringify(constraints)]);

  return { data, loading, error };
}

export function useDoc<T extends DocumentData>(
  collectionName: string,
  docId: string | undefined,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!docId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docId) {
      return;
    }
    const unsub = onSnapshot(
      doc(db, collectionName, docId),
      (snap) => {
        if (snap.exists()) {
          setData({ id: snap.id, ...snap.data() } as unknown as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [collectionName, docId]);

  return { data, loading, error };
}

// ─── CRUD Helpers ──────────────────────────────────────────────────

export async function createDoc(
  collectionName: string,
  data: Record<string, unknown>,
) {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return docRef.id;
}

export async function updateDocById(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>,
) {
  await updateDoc(doc(db, collectionName, docId), {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteDocById(collectionName: string, docId: string) {
  await deleteDoc(doc(db, collectionName, docId));
}

export async function getDocById<T extends DocumentData>(
  collectionName: string,
  docId: string,
): Promise<T | null> {
  const snap = await getDocs(
    query(collection(db, collectionName), where("__name__", "==", docId)),
  );
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as unknown as T;
}

// ─── File Upload ─────────────────────────────────────────────────────

export async function uploadFile(path: string, file: File): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

// ─── Specific Hooks ──────────────────────────────────────────────────

export function useLeads(agentId?: string) {
  const { userProfile } = useAuth();
  const isBroker = userProfile?.role === "broker";
  const constraints: QueryConstraint[] = [
    orderBy("createdAt", "desc"),
    limit(100),
  ];

  if (!isBroker && agentId) {
    constraints.unshift(where("assignedTo", "==", agentId));
  }

  return useCollection("leads", constraints);
}

export function useListings(agentId?: string) {
  const { userProfile } = useAuth();
  const isBroker = userProfile?.role === "broker";
  const constraints: QueryConstraint[] = [
    orderBy("createdAt", "desc"),
    limit(100),
  ];

  if (!isBroker && agentId) {
    constraints.unshift(where("assignedTo", "==", agentId));
  }

  return useCollection("listings", constraints);
}

export function useViewings(agentId?: string) {
  const constraints: QueryConstraint[] = [
    orderBy("scheduledAt", "desc"),
    limit(100),
  ];
  if (agentId) {
    constraints.unshift(where("agentId", "==", agentId));
  }
  return useCollection("viewings", constraints);
}

export function useDeals() {
  const { userProfile } = useAuth();
  const constraints: QueryConstraint[] = [
    orderBy("createdAt", "desc"),
    limit(100),
  ];
  if (userProfile?.role !== "broker") {
    constraints.unshift(where("createdBy", "==", userProfile?.id));
  }
  return useCollection("deals", constraints);
}

export function useTasks(agentId?: string) {
  const constraints: QueryConstraint[] = [
    orderBy("createdAt", "desc"),
    limit(100),
  ];
  if (agentId) {
    constraints.unshift(where("agentId", "==", agentId));
  }
  return useCollection("tasks", constraints);
}

export function useNotifications(userId: string | undefined) {
  const constraints: QueryConstraint[] = [
    where("userId", "==", userId || ""),
    orderBy("createdAt", "desc"),
    limit(50),
  ];
  return useCollection("notifications", userId ? constraints : []);
}

export function useAgents(brokerId: string | undefined) {
  return useCollection(
    "users",
    brokerId
      ? [
          where("brokerId", "==", brokerId),
          where("role", "in", ["agent", "sub-agent"]),
        ]
      : [],
  );
}
