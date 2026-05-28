import { query, collection, getDocs, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createDocument, updateDocument, deleteDocument, COLLECTIONS } from "@/lib/firestore";
import { ChecklistTemplate, ChecklistInstance } from "@/types";

// ─── Templates ────────────────────────────────────────────────────

export async function fetchChecklistTemplates(): Promise<ChecklistTemplate[]> {
  const q = query(
    collection(db, COLLECTIONS.CHECKLIST_TEMPLATES),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as unknown as ChecklistTemplate,
  );
}

export async function createChecklistTemplate(
  data: Omit<ChecklistTemplate, "id" | "createdAt">,
): Promise<string> {
  return createDocument<ChecklistTemplate>(COLLECTIONS.CHECKLIST_TEMPLATES, data as unknown as Omit<ChecklistTemplate, "id">);
}

export async function updateChecklistTemplate(
  id: string,
  data: Partial<Omit<ChecklistTemplate, "id" | "createdAt">>,
): Promise<void> {
  await updateDocument<ChecklistTemplate>(COLLECTIONS.CHECKLIST_TEMPLATES, id, data);
}

export async function deleteChecklistTemplate(id: string): Promise<void> {
  await deleteDocument(COLLECTIONS.CHECKLIST_TEMPLATES, id);
}

// ─── Instances ────────────────────────────────────────────────────

export async function fetchChecklistInstances(
  scopeType?: string,
  scopeId?: string,
): Promise<ChecklistInstance[]> {
  const constraints = [];
  if (scopeType) constraints.push(where("scopeType", "==", scopeType));
  if (scopeId) constraints.push(where("scopeId", "==", scopeId));
  constraints.push(orderBy("createdAt", "desc"));
  const q = query(collection(db, COLLECTIONS.CHECKLISTS), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as unknown as ChecklistInstance,
  );
}

export async function createChecklistInstance(
  data: Omit<ChecklistInstance, "id" | "createdAt">,
): Promise<string> {
  return createDocument<ChecklistInstance>(COLLECTIONS.CHECKLISTS, data as unknown as Omit<ChecklistInstance, "id">);
}

export async function updateChecklistInstance(
  id: string,
  data: Partial<Omit<ChecklistInstance, "id" | "createdAt">>,
): Promise<void> {
  await updateDocument<ChecklistInstance>(COLLECTIONS.CHECKLISTS, id, data);
}

export async function deleteChecklistInstance(id: string): Promise<void> {
  await deleteDocument(COLLECTIONS.CHECKLISTS, id);
}
