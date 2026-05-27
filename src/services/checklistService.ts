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
import { ChecklistTemplate, ChecklistInstance } from "@/types";

const TEMPLATES_COLLECTION = "checklistTemplates";
const INSTANCES_COLLECTION = "checklistInstances";

// ─── Templates ────────────────────────────────────────────────────

export async function fetchChecklistTemplates(): Promise<ChecklistTemplate[]> {
  const q = query(
    collection(db, TEMPLATES_COLLECTION),
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
  const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
    ...data,
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function updateChecklistTemplate(
  id: string,
  data: Partial<Omit<ChecklistTemplate, "id" | "createdAt">>,
): Promise<void> {
  await updateDoc(doc(db, TEMPLATES_COLLECTION, id), data);
}

export async function deleteChecklistTemplate(id: string): Promise<void> {
  await deleteDoc(doc(db, TEMPLATES_COLLECTION, id));
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
  const q = query(collection(db, INSTANCES_COLLECTION), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as unknown as ChecklistInstance,
  );
}

export async function createChecklistInstance(
  data: Omit<ChecklistInstance, "id" | "createdAt">,
): Promise<string> {
  const docRef = await addDoc(collection(db, INSTANCES_COLLECTION), {
    ...data,
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function updateChecklistInstance(
  id: string,
  data: Partial<Omit<ChecklistInstance, "id" | "createdAt">>,
): Promise<void> {
  await updateDoc(doc(db, INSTANCES_COLLECTION, id), data);
}

export async function deleteChecklistInstance(id: string): Promise<void> {
  await deleteDoc(doc(db, INSTANCES_COLLECTION, id));
}
