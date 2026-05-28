import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchChecklistTemplates,
  createChecklistTemplate,
  updateChecklistTemplate,
  deleteChecklistTemplate,
  fetchChecklistInstances,
  createChecklistInstance,
  updateChecklistInstance,
  deleteChecklistInstance,
} from "@/services/checklistService";

// Mock Firebase Firestore
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => "collection-ref"),
  query: vi.fn(() => "query-ref"),
  orderBy: vi.fn(() => "orderBy-constraint"),
  where: vi.fn(() => "where-constraint"),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn((_db, _coll, id) => ({ id })),
}));

const { getDocs, addDoc, updateDoc, deleteDoc } = await import("firebase/firestore");

describe("checklistService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Templates", () => {
    it("fetchChecklistTemplates should return mapped templates", async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          {
            id: "tmpl-1",
            data: () => ({ name: "Buyer Checklist", scope: "lead" }),
          },
        ],
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await fetchChecklistTemplates();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: "tmpl-1", name: "Buyer Checklist" });
    });

    it("fetchChecklistTemplates should return empty array on no docs", async () => {
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const result = await fetchChecklistTemplates();
      expect(result).toEqual([]);
    });

    it("createChecklistTemplate should call addDoc and return id", async () => {
      vi.mocked(addDoc).mockResolvedValue({ id: "new-tmpl-id" } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const id = await createChecklistTemplate({
        name: "Test Template",
        scope: "deal",
        items: [{ label: "Step 1", required: true }],
        createdBy: "user-1",
      });
      expect(id).toBe("new-tmpl-id");
      expect(addDoc).toHaveBeenCalledOnce();
    });

    it("createChecklistTemplate should add createdAt timestamp", async () => {
      vi.mocked(addDoc).mockResolvedValue({ id: "id" } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      await createChecklistTemplate({
        name: "T",
        scope: "lead",
        items: [],
        createdBy: "u1",
      });
      const data = vi.mocked(addDoc).mock.calls[0][1];
      expect(data).toHaveProperty("createdAt");
      expect(typeof data.createdAt).toBe("number");
    });

    it("updateChecklistTemplate should call updateDoc", async () => {
      await updateChecklistTemplate("tmpl-1", { name: "Updated" });
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "tmpl-1" }),
        expect.objectContaining({ name: "Updated" }),
      );
    });

    it("deleteChecklistTemplate should call deleteDoc", async () => {
      await deleteChecklistTemplate("tmpl-1");
      expect(deleteDoc).toHaveBeenCalledOnce();
    });
  });

  describe("Instances", () => {
    it("fetchChecklistInstances should filter by scopeType and scopeId", async () => {
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      await fetchChecklistInstances("lead", "lead-1");
      // Should include where constraints for both scopeType and scopeId
      const { where } = await import("firebase/firestore");
      expect(vi.mocked(where)).toHaveBeenCalledWith("scopeType", "==", "lead");
      expect(vi.mocked(where)).toHaveBeenCalledWith("scopeId", "==", "lead-1");
    });

    it("fetchChecklistInstances should return empty array when no instances", async () => {
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const result = await fetchChecklistInstances();
      expect(result).toEqual([]);
    });

    it("createChecklistInstance should call addDoc and return id", async () => {
      vi.mocked(addDoc).mockResolvedValue({ id: "inst-id" } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const id = await createChecklistInstance({
        templateId: "tmpl-1",
        templateName: "Checklist",
        scopeType: "deal",
        scopeId: "deal-1",
        items: [{ label: "Item", required: true, done: false }],
        progress: 0,
      });
      expect(id).toBe("inst-id");
    });

    it("updateChecklistInstance should call updateDoc", async () => {
      await updateChecklistInstance("inst-1", { progress: 50 });
      expect(updateDoc).toHaveBeenCalledOnce();
    });

    it("deleteChecklistInstance should call deleteDoc", async () => {
      await deleteChecklistInstance("inst-1");
      expect(deleteDoc).toHaveBeenCalledOnce();
    });
  });
});
