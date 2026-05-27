import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  DocumentData,
  QueryConstraint,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import { db, storage } from "@/lib/firebase";
import { createDoc, updateDocById, deleteDocById } from "@/hooks/useFirestore";
import { VaultDocument, DocumentRequest, DocumentCategory } from "@/types";

// ─── Upload File with Progress ──────────────────────────────────────

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number; // 0–100
}

export type UploadProgressCallback = (progress: UploadProgress) => void;

/**
 * Upload a file to Firebase Storage under vaultDocuments/{userId}/{timestamp}_{filename}.
 * Returns the download URL.
 */
export async function uploadVaultFile(
  file: File,
  userId: string,
  onProgress?: UploadProgressCallback,
): Promise<string> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `vaultDocuments/${userId}/${timestamp}_${safeName}`;
  const storageRef = ref(storage, storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        if (onProgress) {
          onProgress({
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            progress: Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            ),
          });
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        const downloadUrl = await getDownloadURL(storageRef);
        resolve(downloadUrl);
      },
    );
  });
}

// ─── Create Document ────────────────────────────────────────────────

export async function createVaultDocument(
  data: Omit<VaultDocument, "id" | "uploadedAt" | "version"> & {
    version?: number;
  },
): Promise<string> {
  return createDoc("vaultDocuments", {
    ...data,
    version: data.version ?? 1,
    uploadedAt: Date.now(),
  });
}

// ─── Update Document (creates a new version) ────────────────────────

export async function updateVaultDocumentWithVersion(
  docId: string,
  currentDoc: VaultDocument,
  updates: Partial<
    Omit<VaultDocument, "id" | "uploadedAt" | "version" | "previousVersionId">
  >,
  newFile?: File,
  userId?: string,
  onProgress?: UploadProgressCallback,
): Promise<void> {
  const newVersion = currentDoc.version + 1;
  let fileUrl = currentDoc.fileUrl;

  if (newFile && userId) {
    fileUrl = await uploadVaultFile(newFile, userId, onProgress);
  }

  // Store current version's data as a version history entry
  await createDoc("vaultDocumentVersions", {
    documentId: docId,
    version: currentDoc.version,
    name: currentDoc.name,
    fileUrl: currentDoc.fileUrl,
    fileType: currentDoc.fileType,
    fileSize: currentDoc.fileSize,
    uploadedBy: currentDoc.uploadedBy,
    uploadedAt: currentDoc.uploadedAt,
    notes: currentDoc.notes,
  });

  // Update the main document
  await updateDocById("vaultDocuments", docId, {
    ...updates,
    fileUrl,
    version: newVersion,
    previousVersionId: docId,
  });
}

// ─── Get Version History ────────────────────────────────────────────

export async function getDocumentVersionHistory(
  documentId: string,
): Promise<DocumentData[]> {
  const constraints: QueryConstraint[] = [
    where("documentId", "==", documentId),
    orderBy("version", "desc"),
    limit(50),
  ];
  const q = query(collection(db, "vaultDocumentVersions"), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── Delete Document ────────────────────────────────────────────────

export async function deleteVaultDocument(doc: VaultDocument): Promise<void> {
  // Delete file from storage
  try {
    const storageRef = ref(storage, doc.fileUrl);
    await deleteObject(storageRef);
  } catch {
    // If file doesn't exist in storage, proceed with Firestore delete
  }
  await deleteDocById("vaultDocuments", doc.id);
}

// ─── Document Requests ──────────────────────────────────────────────

export async function createDocumentRequest(
  data: Omit<DocumentRequest, "id" | "createdAt" | "status">,
): Promise<string> {
  return createDoc("documentRequests", {
    ...data,
    status: "pending",
    createdAt: Date.now(),
  });
}

export async function respondToDocumentRequest(
  requestId: string,
  status: "uploaded" | "cancelled",
  uploadedDocId?: string,
): Promise<void> {
  await updateDocById("documentRequests", requestId, {
    status,
    respondedAt: Date.now(),
    ...(uploadedDocId ? { uploadedDocId } : {}),
  });
}

// ─── Expiry Alerts ──────────────────────────────────────────────────

export function getExpiryThreshold(): number {
  return Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days from now
}

export async function getExpiringDocuments(
  userId?: string,
): Promise<VaultDocument[]> {
  const now = Date.now();
  const threshold = getExpiryThreshold();

  const constraints: QueryConstraint[] = [
    where("expiryDate", ">=", now),
    where("expiryDate", "<=", threshold),
    orderBy("expiryDate", "asc"),
    limit(50),
  ];

  if (userId) {
    constraints.unshift(where("uploadedBy", "==", userId));
  }

  const q = query(collection(db, "vaultDocuments"), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as unknown as VaultDocument,
  );
}

// ─── Category helpers ───────────────────────────────────────────────

export const DOCUMENT_CATEGORIES: {
  value: DocumentCategory;
  label: string;
  color: string;
}[] = [
  {
    value: "title",
    label: "Title",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  {
    value: "tax",
    label: "Tax",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  },
  {
    value: "contract",
    label: "Contract",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  {
    value: "identification",
    label: "ID",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  {
    value: "hoa",
    label: "HOA",
    color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  },
  {
    value: "miscellaneous",
    label: "Misc",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  },
];

export function getCategoryInfo(category: DocumentCategory) {
  return (
    DOCUMENT_CATEGORIES.find((c) => c.value === category) ||
    DOCUMENT_CATEGORIES[5]
  );
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
