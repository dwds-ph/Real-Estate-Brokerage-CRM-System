import { where, orderBy } from "firebase/firestore";
import { subscribeToQuery, createDocument as createFirestoreDoc, deleteDocument as deleteFirestoreDoc, COLLECTIONS } from "@/lib/firestore";
import type { PropertyDocument } from "@/types";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export function subscribePropertyDocuments(brokerId: string | undefined, listingId?: string, callback?: (items: PropertyDocument[]) => void) {
  if (!brokerId) return () => {};
  return subscribeToQuery<PropertyDocument>(
    COLLECTIONS.PROPERTY_DOCUMENTS,
    listingId
      ? [where("brokerId", "==", brokerId), where("listingId", "==", listingId), orderBy("createdAt", "desc")]
      : [where("brokerId", "==", brokerId), orderBy("createdAt", "desc")],
    callback ?? (() => {}),
  );
}

export async function createDocument(data: Omit<PropertyDocument, "id" | "createdAt">) {
  return createFirestoreDoc(COLLECTIONS.PROPERTY_DOCUMENTS, data as unknown as Omit<PropertyDocument, "id">);
}

export async function deleteDocument(id: string) {
  await deleteFirestoreDoc(COLLECTIONS.PROPERTY_DOCUMENTS, id);
}

export async function uploadDocumentFile(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
