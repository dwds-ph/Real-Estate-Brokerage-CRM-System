import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AgentTeam } from "@/types";

export function subscribeTeams(brokerId: string | undefined, callback: (items: AgentTeam[]) => void) {
  if (!brokerId) return () => {};
  const q = query(collection(db, "teams"), where("brokerId", "==", brokerId), orderBy("name", "asc"));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AgentTeam)));
}

export async function createTeam(data: Omit<AgentTeam, "id" | "createdAt" | "updatedAt">) {
  const now = Date.now();
  const ref = await addDoc(collection(db, "teams"), { ...data, createdAt: now, updatedAt: now });
  return ref.id;
}

export async function updateTeam(id: string, data: Partial<AgentTeam>) {
  await updateDoc(doc(db, "teams", id), { ...data, updatedAt: Date.now() });
}

export async function deleteTeam(id: string) {
  await deleteDoc(doc(db, "teams", id));
}
