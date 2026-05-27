import {
  collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CoBroker, CoBrokerDeal } from "@/types";

export function subscribeCoBrokers(brokerId: string | undefined, callback: (items: CoBroker[]) => void) {
  if (!brokerId) return () => {};
  const q = query(collection(db, "coBrokers"), where("brokerId", "==", brokerId), orderBy("name", "asc"));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CoBroker)));
}

export function subscribeCoBrokerDeals(brokerId: string | undefined, callback: (items: CoBrokerDeal[]) => void) {
  if (!brokerId) return () => {};
  const q = query(collection(db, "coBrokerDeals"), where("brokerId", "==", brokerId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CoBrokerDeal)));
}

export async function createCoBroker(data: Omit<CoBroker, "id" | "createdAt" | "updatedAt">) {
  const now = Date.now();
  const ref = await addDoc(collection(db, "coBrokers"), { ...data, createdAt: now, updatedAt: now });
  return ref.id;
}

export async function updateCoBroker(id: string, data: Partial<CoBroker>) {
  await updateDoc(doc(db, "coBrokers", id), { ...data, updatedAt: Date.now() });
}

export async function deleteCoBroker(id: string) {
  await deleteDoc(doc(db, "coBrokers", id));
}

export async function createCoBrokerDeal(data: Omit<CoBrokerDeal, "id" | "createdAt" | "updatedAt">) {
  const now = Date.now();
  const ref = await addDoc(collection(db, "coBrokerDeals"), { ...data, createdAt: now, updatedAt: now });
  return ref.id;
}

export async function updateCoBrokerDeal(id: string, data: Partial<CoBrokerDeal>) {
  await updateDoc(doc(db, "coBrokerDeals", id), { ...data, updatedAt: Date.now() });
}
