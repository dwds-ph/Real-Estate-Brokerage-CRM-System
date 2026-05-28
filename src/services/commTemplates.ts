import { query, collection, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createDocument, updateDocument, deleteDocument, COLLECTIONS } from "@/lib/firestore";
import { CommTemplate } from "@/types";

export async function fetchCommTemplates(): Promise<CommTemplate[]> {
  const q = query(collection(db, COLLECTIONS.COMM_TEMPLATES), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as unknown as CommTemplate,
  );
}

export async function createCommTemplate(
  data: Omit<CommTemplate, "id" | "createdAt">,
): Promise<string> {
  return createDocument<CommTemplate>(COLLECTIONS.COMM_TEMPLATES, data as unknown as Omit<CommTemplate, "id">);
}

export async function updateCommTemplate(
  id: string,
  data: Partial<Omit<CommTemplate, "id" | "createdAt">>,
): Promise<void> {
  await updateDocument<CommTemplate>(COLLECTIONS.COMM_TEMPLATES, id, data);
}

export async function deleteCommTemplate(id: string): Promise<void> {
  await deleteDocument(COLLECTIONS.COMM_TEMPLATES, id);
}
