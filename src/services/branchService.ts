import { where, orderBy } from "firebase/firestore";
import {
  subscribeToQuery,
  createDocument,
  updateDocument,
  deleteDocument,
  COLLECTIONS,
} from "@/lib/firestore";
import type { Branch } from "@/types";

export function subscribeBranches(brokerId: string | undefined, callback: (items: Branch[]) => void) {
  if (!brokerId) return () => {};
  return subscribeToQuery<Branch>(
    COLLECTIONS.BRANCHES,
    [where("brokerId", "==", brokerId), orderBy("name", "asc")],
    callback,
  );
}

export async function createBranch(data: Omit<Branch, "id" | "createdAt" | "updatedAt">) {
  return createDocument<Branch>(COLLECTIONS.BRANCHES, data);
}

export async function updateBranch(id: string, data: Partial<Branch>) {
  return updateDocument<Branch>(COLLECTIONS.BRANCHES, id, data);
}

export async function deleteBranch(id: string) {
  return deleteDocument(COLLECTIONS.BRANCHES, id);
}
