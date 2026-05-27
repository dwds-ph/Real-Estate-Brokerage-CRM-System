import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Branch } from "@/types";

export function subscribeBranches(brokerId: string | undefined, callback: (items: Branch[]) => void) {
  if (!brokerId) return () => {};
  const q = query(collection(db, "branches"), where("brokerId", "==", brokerId), orderBy("name", "asc"));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Branch)));
}

export async function createBranch(data: Omit<Branch, "id" | "createdAt" | "updatedAt">) {
  const now = Date.now();
  const ref = await addDoc(collection(db, "branches"), { ...data, createdAt: now, updatedAt: now });
  return ref.id;
}

export async function updateBranch(id: string, data: Partial<Branch>) {
  await updateDoc(doc(db, "branches", id), { ...data, updatedAt: Date.now() });
}

export async function deleteBranch(id: string) {
  await deleteDoc(doc(db, "branches", id));
}
