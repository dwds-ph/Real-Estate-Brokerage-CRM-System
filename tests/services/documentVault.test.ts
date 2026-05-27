import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  uploadVaultFile,
  createVaultDocument,
  updateVaultDocumentWithVersion,
  getDocumentVersionHistory,
  deleteVaultDocument,
  createDocumentRequest,
  respondToDocumentRequest,
  getExpiryThreshold,
  getExpiringDocuments,
  getCategoryInfo,
  formatFileSize,
  DOCUMENT_CATEGORIES,
} from "@/services/documentVault";

// Mock firebase/firestore
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => "collection-ref"),
  query: vi.fn(() => "query-ref"),
  where: vi.fn(() => "where-constraint"),
  orderBy: vi.fn(() => "orderBy-constraint"),
  limit: vi.fn(() => "limit-constraint"),
  getDocs: vi.fn(),
  doc: vi.fn((_db, _coll, id) => ({ id })),
}));

// Mock firebase/storage
const mockUploadBytesResumable = vi.fn();
const mockGetDownloadURL = vi.fn();
const mockDeleteObject = vi.fn();
vi.mock("firebase/storage", () => ({
  ref: vi.fn((_storage, path) => ({ path, fullPath: path })),
  uploadBytesResumable: (...args: unknown[]) =>
    mockUploadBytesResumable(...args),
  getDownloadURL: (...args: unknown[]) => mockGetDownloadURL(...args),
  deleteObject: (...args: unknown[]) => mockDeleteObject(...args),
}));

// Mock @/hooks/useFirestore
vi.mock("@/hooks/useFirestore", () => ({
  createDoc: vi.fn(() => Promise.resolve("mock-doc-id")),
  updateDocById: vi.fn(() => Promise.resolve()),
  deleteDocById: vi.fn(() => Promise.resolve()),
}));

const { createDoc, updateDocById, deleteDocById } =
  await import("@/hooks/useFirestore");
const { getDocs } = await import("firebase/firestore");

// Create a minimal File-like object for testing
function createMockFile(
  name = "test.pdf",
  size = 1024,
  type = "application/pdf",
): File {
  const blob = new Blob([new Uint8Array(size)], { type });
  return Object.assign(blob, {
    name,
    lastModified: Date.now(),
    webkitRelativePath: "",
  }) as unknown as File;
}

describe("documentVault", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("uploadVaultFile", () => {
    it("should upload a file and return a download URL", async () => {
      const file = createMockFile("contract.pdf");
      mockUploadBytesResumable.mockImplementation((_ref, _file) => {
        const uploadTask = {
          on: (
            _event: string,
            progressCb: (...args: unknown[]) => void,
            errorCb: (...args: unknown[]) => void,
            completeCb: (...args: unknown[]) => void,
          ) => {
            progressCb({ bytesTransferred: 512, totalBytes: 1024 });
            completeCb();
          },
          snapshot: {
            bytesTransferred: 512,
            totalBytes: 1024,
            state: "running",
          },
        };
        return uploadTask;
      });
      mockGetDownloadURL.mockResolvedValue(
        "https://storage.example.com/file.pdf",
      );

      const url = await uploadVaultFile(file, "user-1");
      expect(url).toBe("https://storage.example.com/file.pdf");
    });

    it("should report progress via callback", async () => {
      const file = createMockFile("doc.pdf");
      const progressCb = vi.fn();

      mockUploadBytesResumable.mockImplementation((_ref, _file) => {
        const uploadTask = {
          on: (
            _event: string,
            progressCbInner: (...args: unknown[]) => void,
            _errorCb: (...args: unknown[]) => void,
            completeCb: (...args: unknown[]) => void,
          ) => {
            progressCbInner({ bytesTransferred: 256, totalBytes: 1024 });
            completeCb();
          },
          snapshot: {
            bytesTransferred: 256,
            totalBytes: 1024,
            state: "running",
          },
        };
        return uploadTask;
      });

      mockGetDownloadURL.mockResolvedValue(
        "https://storage.example.com/doc.pdf",
      );

      await uploadVaultFile(file, "user-1", progressCb);
      expect(progressCb).toHaveBeenCalledWith(
        expect.objectContaining({
          bytesTransferred: 256,
          totalBytes: 1024,
        }),
      );
    });

    it("should reject on upload error", async () => {
      const file = createMockFile("error.pdf");
      mockUploadBytesResumable.mockImplementation((_ref, _file) => {
        const uploadTask = {
          on: (
            _event: string,
            _pc: (...args: unknown[]) => void,
            errorCb: (...args: unknown[]) => void,
          ) => {
            errorCb(new Error("Upload failed"));
          },
        };
        return uploadTask;
      });

      await expect(uploadVaultFile(file, "user-1")).rejects.toThrow(
        "Upload failed",
      );
    });
  });

  describe("createVaultDocument", () => {
    it("should call createDoc with version=1 by default", async () => {
      vi.mocked(createDoc).mockResolvedValue("doc-id");

      const id = await createVaultDocument({
        dealId: "deal-1",
        name: "Contract.pdf",
        fileUrl: "https://storage.example.com/contract.pdf",
        fileType: "application/pdf",
        fileSize: 102400,
        category: "contract",
        uploadedBy: "user-1",
        tags: [],
      });

      expect(id).toBe("doc-id");
      expect(createDoc).toHaveBeenCalledWith(
        "vaultDocuments",
        expect.objectContaining({ version: 1 }),
      );
    });

    it("should use provided version if given", async () => {
      vi.mocked(createDoc).mockResolvedValue("doc-id");

      await createVaultDocument({
        dealId: "deal-1",
        name: "Doc v2",
        fileUrl: "url",
        fileType: "pdf",
        fileSize: 100,
        category: "title",
        uploadedBy: "user-1",
        tags: [],
        version: 2,
      });

      expect(createDoc).toHaveBeenCalledWith(
        "vaultDocuments",
        expect.objectContaining({ version: 2 }),
      );
    });
  });

  describe("updateVaultDocumentWithVersion", () => {
    const currentDoc = {
      id: "doc-1",
      dealId: "deal-1",
      name: "Old Contract.pdf",
      fileUrl: "https://storage.example.com/old.pdf",
      fileType: "application/pdf",
      fileSize: 102400,
      category: "contract" as const,
      uploadedBy: "user-1",
      uploadedAt: 1000000,
      version: 1,
      tags: [],
    };

    it("should create version history and increment version", async () => {
      await updateVaultDocumentWithVersion("doc-1", currentDoc, {
        name: "Updated Contract.pdf",
      });

      // Should create a version history entry
      expect(createDoc).toHaveBeenCalledWith(
        "vaultDocumentVersions",
        expect.objectContaining({
          documentId: "doc-1",
          version: 1,
          name: "Old Contract.pdf",
        }),
      );

      // Should update the main document with new version
      expect(updateDocById).toHaveBeenCalledWith(
        "vaultDocuments",
        "doc-1",
        expect.objectContaining({
          name: "Updated Contract.pdf",
          version: 2,
          previousVersionId: "doc-1",
        }),
      );
    });

    it("should upload new file if newFile and userId provided", async () => {
      const file = createMockFile("new.pdf");
      mockUploadBytesResumable.mockImplementation((_ref, _file) => {
        const uploadTask = {
          on: (
            _event: string,
            _pc: (...args: unknown[]) => void,
            _ec: (...args: unknown[]) => void,
            completeCb: (...args: unknown[]) => void,
          ) => {
            completeCb();
          },
          snapshot: { bytesTransferred: 0, totalBytes: 100, state: "running" },
        };
        return uploadTask;
      });
      mockGetDownloadURL.mockResolvedValue(
        "https://storage.example.com/new.pdf",
      );

      await updateVaultDocumentWithVersion(
        "doc-1",
        currentDoc,
        {},
        file,
        "user-1",
      );

      expect(updateDocById).toHaveBeenCalledWith(
        "vaultDocuments",
        "doc-1",
        expect.objectContaining({
          fileUrl: "https://storage.example.com/new.pdf",
        }),
      );
    });
  });

  describe("getDocumentVersionHistory", () => {
    it("should fetch and map version history documents", async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          {
            id: "v1",
            data: () => ({ version: 1, name: "v1.pdf" }),
          },
          {
            id: "v2",
            data: () => ({ version: 2, name: "v2.pdf" }),
          },
        ],
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await getDocumentVersionHistory("doc-1");
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty("id");
    });

    it("should return empty array if no versions exist", async () => {
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const result = await getDocumentVersionHistory("doc-1");
      expect(result).toEqual([]);
    });
  });

  describe("deleteVaultDocument", () => {
    it("should delete file from storage and document from Firestore", async () => {
      mockDeleteObject.mockResolvedValue(undefined);

      await deleteVaultDocument({
        id: "doc-1",
        fileUrl: "https://storage.example.com/doc.pdf",
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(mockDeleteObject).toHaveBeenCalledOnce();
      expect(deleteDocById).toHaveBeenCalledWith("vaultDocuments", "doc-1");
    });

    it("should proceed with Firestore delete even if storage delete fails", async () => {
      mockDeleteObject.mockRejectedValue(new Error("Storage error"));

      await deleteVaultDocument({
        id: "doc-1",
        fileUrl: "https://storage.example.com/doc.pdf",
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(deleteDocById).toHaveBeenCalledWith("vaultDocuments", "doc-1");
    });
  });

  describe("getExpiryThreshold / getExpiringDocuments", () => {
    it("getExpiryThreshold should be ~7 days from now", () => {
      const threshold = getExpiryThreshold();
      const now = Date.now();
      const diff = threshold - now;
      // Should be roughly 7 days (in ms)
      expect(diff).toBeGreaterThan(6 * 24 * 60 * 60 * 1000);
      expect(diff).toBeLessThan(8 * 24 * 60 * 60 * 1000);
    });

    it("getExpiringDocuments should query with expiry constraints", async () => {
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      await getExpiringDocuments("user-1");
      expect(getDocs).toHaveBeenCalledOnce();
    });

    it("getExpiringDocuments should return empty array if no docs", async () => {
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const result = await getExpiringDocuments();
      expect(result).toEqual([]);
    });
  });

  describe("createDocumentRequest", () => {
    it("should create a document request with status pending", async () => {
      vi.mocked(createDoc).mockResolvedValue("req-id");

      const id = await createDocumentRequest({
        fromUserId: "user-1",
        toUserId: "user-2",
        description: "Please upload your ID",
      });

      expect(id).toBe("req-id");
      expect(createDoc).toHaveBeenCalledWith(
        "documentRequests",
        expect.objectContaining({ status: "pending" }),
      );
    });
  });

  describe("respondToDocumentRequest", () => {
    it("should update request status to uploaded", async () => {
      await respondToDocumentRequest("req-1", "uploaded", "doc-1");
      expect(updateDocById).toHaveBeenCalledWith(
        "documentRequests",
        "req-1",
        expect.objectContaining({
          status: "uploaded",
          uploadedDocId: "doc-1",
        }),
      );
    });

    it("should update request status to cancelled", async () => {
      await respondToDocumentRequest("req-1", "cancelled");
      expect(updateDocById).toHaveBeenCalledWith(
        "documentRequests",
        "req-1",
        expect.objectContaining({ status: "cancelled" }),
      );
    });
  });

  describe("Category helpers", () => {
    it("getCategoryInfo should return correct info for each category", () => {
      expect(getCategoryInfo("title").label).toBe("Title");
      expect(getCategoryInfo("tax-declaration").label).toBe("Tax Declaration");
      expect(getCategoryInfo("contract").label).toBe("Contract");
      expect(getCategoryInfo("identification").label).toBe("ID");
      expect(getCategoryInfo("permit").label).toBe("Permit");
      expect(getCategoryInfo("other").label).toBe("Other");
    });

    it("getCategoryInfo should fallback to miscellaneous for unknown category", () => {
      const result = getCategoryInfo("unknown" as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(result.label).toBe("Other");
    });

    it("DOCUMENT_CATEGORIES should have correct structure", () => {
      expect(DOCUMENT_CATEGORIES.length).toBeGreaterThanOrEqual(6);
      DOCUMENT_CATEGORIES.forEach((cat) => {
        expect(cat).toHaveProperty("value");
        expect(cat).toHaveProperty("label");
        expect(cat).toHaveProperty("color");
      });
    });
  });

  describe("formatFileSize", () => {
    it("should format bytes", () => {
      expect(formatFileSize(500)).toBe("500 B");
    });

    it("should format kilobytes", () => {
      expect(formatFileSize(2048)).toBe("2.0 KB");
    });

    it("should format megabytes", () => {
      expect(formatFileSize(3 * 1024 * 1024)).toBe("3.0 MB");
    });

    it("should handle zero bytes", () => {
      expect(formatFileSize(0)).toBe("0 B");
    });
  });
});
