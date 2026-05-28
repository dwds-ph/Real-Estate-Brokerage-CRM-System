import { query, collection, getDocs, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createDocument, updateDocument, deleteDocument, COLLECTIONS } from "@/lib/firestore";
import { Referral } from "@/types";

export async function fetchReferrals(dealId?: string): Promise<Referral[]> {
  const constraints = [];
  if (dealId) {constraints.push(where("dealId", "==", dealId));}
  constraints.push(orderBy("createdAt", "desc"));
  const q = query(collection(db, COLLECTIONS.REFERRALS), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as unknown as Referral,
  );
}

export async function createReferral(
  data: Omit<Referral, "id" | "createdAt">,
): Promise<string> {
  return createDocument<Referral>(COLLECTIONS.REFERRALS, data as unknown as Omit<Referral, "id">);
}

export async function updateReferral(
  id: string,
  data: Partial<Omit<Referral, "id" | "createdAt">>,
): Promise<void> {
  await updateDocument<Referral>(COLLECTIONS.REFERRALS, id, data);
}

export async function deleteReferral(id: string): Promise<void> {
  await deleteDocument(COLLECTIONS.REFERRALS, id);
}
