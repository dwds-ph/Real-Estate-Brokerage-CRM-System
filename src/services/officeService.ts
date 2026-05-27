import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Office } from "@/types";

/**
 * Fetch all offices for a given broker.
 */
export async function getOffices(brokerId: string): Promise<Office[]> {
  const q = query(
    collection(db, "offices"),
    where("brokerId", "==", brokerId),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Office);
}

/**
 * Create a new office.
 */
export async function createOffice(
  data: Omit<Office, "id" | "createdAt">,
): Promise<string> {
  const docRef = await addDoc(collection(db, "offices"), {
    ...data,
    createdAt: Date.now(),
  });
  return docRef.id;
}

/**
 * Update an office document.
 */
export async function updateOffice(
  officeId: string,
  data: Partial<Office>,
): Promise<void> {
  await updateDoc(doc(db, "offices", officeId), data);
}

/**
 * Delete an office document.
 */
export async function deleteOffice(officeId: string): Promise<void> {
  await deleteDoc(doc(db, "offices", officeId));
}

/**
 * Get agents assigned to a specific office.
 * Agents have an `officeId` field on their user document.
 */
export async function getOfficeAgents(
  officeId: string,
): Promise<DocumentData[]> {
  const q = query(collection(db, "users"), where("officeId", "==", officeId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}
