import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  subscribeBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from "@/services/branchService";
import type { Branch, BranchType } from "@/types";

// ─── Mock @/lib/firestore ─────────────────────────────────────────────

const mockSubscribeToQuery = vi.fn();
const mockCreateDocument = vi.fn();
const mockUpdateDocument = vi.fn();
const mockDeleteDocument = vi.fn();

vi.mock("@/lib/firestore", () => ({
  subscribeToQuery: (...args: unknown[]) => mockSubscribeToQuery(...args),
  createDocument: (...args: unknown[]) => mockCreateDocument(...args),
  updateDocument: (...args: unknown[]) => mockUpdateDocument(...args),
  deleteDocument: (...args: unknown[]) => mockDeleteDocument(...args),
  COLLECTIONS: { BRANCHES: "branches" },
}));

vi.mock("@/lib/firebase", () => ({ db: {} }));

// ─── Helpers ──────────────────────────────────────────────────────────

const now = Date.now();

function sampleBranch(overrides: Partial<Branch> = {}): Branch {
  return {
    id: "branch-1",
    name: "Main Office",
    type: "head-office" as BranchType,
    address: "123 Business Ave",
    city: "Makati",
    province: "NCR",
    phone: "+632****1234",
    email: "main@example.com",
    manager: "Juan Dela Cruz",
    managerId: "user-1",
    brokerId: "broker-1",
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────

describe("branchService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── subscribeBranches ───────────────────────────────────────────

  describe("subscribeBranches", () => {
    it("should return a noop unsubscribe when brokerId is undefined", () => {
      const unsub = subscribeBranches(undefined, vi.fn());
      expect(unsub).toBeInstanceOf(Function);
      expect(mockSubscribeToQuery).not.toHaveBeenCalled();
    });

    it("should subscribe to branches collection with a callback", () => {
      const callback = vi.fn();
      subscribeBranches("broker-1", callback);

      expect(mockSubscribeToQuery).toHaveBeenCalledWith(
        "branches",
        expect.any(Array),
        callback,
      );
    });

    it("should pass a non-empty constraints array to subscribeToQuery", () => {
      subscribeBranches("broker-1", vi.fn());

      const constraints = mockSubscribeToQuery.mock.calls[0][1];
      expect(Array.isArray(constraints)).toBe(true);
      expect(constraints.length).toBeGreaterThan(0);
    });

    it("should return the unsubscribe function from subscribeToQuery", () => {
      const mockUnsub = vi.fn();
      mockSubscribeToQuery.mockReturnValue(mockUnsub);

      const unsub = subscribeBranches("broker-1", vi.fn());
      expect(unsub).toBe(mockUnsub);
    });
  });

  // ─── createBranch ────────────────────────────────────────────────

  describe("createBranch", () => {
    const branchInput = {
      name: "New Branch",
      type: "branch" as BranchType,
      address: "456 New St",
      city: "Quezon City",
      province: "NCR",
      phone: "+632****5678",
      email: "branch@example.com",
      manager: "Maria Santos",
      managerId: "user-2",
      brokerId: "broker-1",
      isActive: true,
    };

    it("should create a document and return the new id", async () => {
      mockCreateDocument.mockResolvedValue("new-branch-id");

      const id = await createBranch(branchInput);

      expect(mockCreateDocument).toHaveBeenCalledWith("branches", branchInput);
      expect(id).toBe("new-branch-id");
    });

    it("should pass all branch data to createDocument", async () => {
      mockCreateDocument.mockResolvedValue("branch-id");

      await createBranch(branchInput);

      const data = vi.mocked(mockCreateDocument).mock.calls[0][1];
      expect(data).toMatchObject(branchInput);
    });

    it("should handle error from createDocument", async () => {
      mockCreateDocument.mockRejectedValue(new Error("Firestore error"));

      await expect(createBranch(branchInput)).rejects.toThrow("Firestore error");
    });
  });

  // ─── updateBranch ────────────────────────────────────────────────

  describe("updateBranch", () => {
    it("should update the document with partial data", async () => {
      mockUpdateDocument.mockResolvedValue(undefined);

      await updateBranch("branch-1", {
        name: "Updated Branch Name",
        isActive: false,
      });

      expect(mockUpdateDocument).toHaveBeenCalledWith("branches", "branch-1", {
        name: "Updated Branch Name",
        isActive: false,
      });
    });

    it("should allow updating a single field", async () => {
      mockUpdateDocument.mockResolvedValue(undefined);

      await updateBranch("branch-1", { phone: "+632****9999" });

      expect(mockUpdateDocument).toHaveBeenCalledWith(
        "branches",
        "branch-1",
        { phone: "+632****9999" },
      );
    });

    it("should handle error from updateDocument", async () => {
      mockUpdateDocument.mockRejectedValue(new Error("Update failed"));

      await expect(
        updateBranch("branch-1", { name: "New Name" }),
      ).rejects.toThrow("Update failed");
    });
  });

  // ─── deleteBranch ────────────────────────────────────────────────

  describe("deleteBranch", () => {
    it("should delete the document by id", async () => {
      mockDeleteDocument.mockResolvedValue(undefined);

      await deleteBranch("branch-to-delete");

      expect(mockDeleteDocument).toHaveBeenCalledWith(
        "branches",
        "branch-to-delete",
      );
    });

    it("should resolve successfully on deletion", async () => {
      mockDeleteDocument.mockResolvedValue(undefined);

      await expect(deleteBranch("branch-1")).resolves.toBeUndefined();
    });

    it("should handle error from deleteDocument", async () => {
      mockDeleteDocument.mockRejectedValue(new Error("Delete failed"));

      await expect(deleteBranch("branch-1")).rejects.toThrow("Delete failed");
    });
  });
});
