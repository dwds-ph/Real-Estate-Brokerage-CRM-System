import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type { PropertyDocument } from "@/types";

export function subscribePropertyDocuments(brokerId: string | undefined, listingId?: string, callback?: (items: PropertyDocument[]) => void) {
  if (!brokerId) return () => {};
  const q = listingId
    ? query(collection(db, "propertyDocuments"), where("brokerId", "==", brokerId), where("listingId", "==", listingId), orderBy("createdAt", "desc"))
    : query(collection(db, "propertyDocuments"), where("brokerId", "==", brokerId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => callback?.(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PropertyDocument)));
}

export async function createDocument(data: Omit<PropertyDocument, "id" | "createdAt">) {
  const ref = await addDoc(collection(db, "propertyDocuments"), { ...data, createdAt: Date.now() });
  return ref.id;
}

export async function deleteDocument(id: string) {
  await deleteDoc(doc(db, "propertyDocuments", id));
}

export async function uploadDocumentFile(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
