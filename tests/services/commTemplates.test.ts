import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchCommTemplates,
  createCommTemplate,
  updateCommTemplate,
  deleteCommTemplate,
} from "@/services/commTemplates";

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => "collection-ref"),
  query: vi.fn(() => "query-ref"),
  orderBy: vi.fn(() => "orderBy-constraint"),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn((_db, _coll, id) => ({ id })),
}));

const { getDocs, addDoc, updateDoc, deleteDoc } = await import("firebase/firestore");

describe("commTemplates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchCommTemplates", () => {
    it("should return mapped templates", async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          {
            id: "t1",
            data: () => ({
              name: "Welcome Email",
              type: "email",
              body: "Hello!",
              createdBy: "u1",
            }),
          },
        ],
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await fetchCommTemplates();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Welcome Email");
      expect(result[0].type).toBe("email");
    });

    it("should return empty array when no templates exist", async () => {
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const result = await fetchCommTemplates();
      expect(result).toEqual([]);
    });

    it("should handle Firestore error", async () => {
      vi.mocked(getDocs).mockRejectedValue(new Error("Firestore unavailable"));
      await expect(fetchCommTemplates()).rejects.toThrow("Firestore unavailable");
    });
  });

  describe("createCommTemplate", () => {
    it("should create a template and return its id", async () => {
      vi.mocked(addDoc).mockResolvedValue({ id: "new-id" } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const id = await createCommTemplate({
        name: "Test",
        type: "text",
        body: "Hi",
        createdBy: "u1",
      });
      expect(id).toBe("new-id");
    });

    it("should include createdAt timestamp in data", async () => {
      vi.mocked(addDoc).mockResolvedValue({ id: "id" } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      await createCommTemplate({
        name: "Test",
        type: "call",
        body: "Hello",
        createdBy: "u1",
      });
      const data = vi.mocked(addDoc).mock.calls[0][1];
      expect(data).toHaveProperty("createdAt");
      expect(typeof data.createdAt).toBe("number");
    });
  });

  describe("updateCommTemplate", () => {
    it("should call updateDoc with partial data", async () => {
      await updateCommTemplate("t1", { name: "Updated Name" });
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "t1" }),
        { name: "Updated Name" },
      );
    });
  });

  describe("deleteCommTemplate", () => {
    it("should call deleteDoc with the correct doc ref", async () => {
      await deleteCommTemplate("t1");
      expect(deleteDoc).toHaveBeenCalledOnce();
    });

    it("should throw on Firestore error", async () => {
      vi.mocked(deleteDoc).mockRejectedValue(new Error("Permission denied"));
      await expect(deleteCommTemplate("t1")).rejects.toThrow("Permission denied");
    });
  });
});
