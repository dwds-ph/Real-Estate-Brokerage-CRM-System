import {
  collection,
  query,
  orderBy,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Referral } from "@/types";

const COLLECTION = "referrals";

export async function fetchReferrals(dealId?: string): Promise<Referral[]> {
  const constraints = [];
  if (dealId) constraints.push(where("dealId", "==", dealId));
  constraints.push(orderBy("createdAt", "desc"));
  const q = query(collection(db, COLLECTION), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as unknown as Referral,
  );
}

export async function createReferral(
  data: Omit<Referral, "id" | "createdAt">,
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function updateReferral(
  id: string,
  data: Partial<Omit<Referral, "id" | "createdAt">>,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), data);
}

export async function deleteReferral(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
