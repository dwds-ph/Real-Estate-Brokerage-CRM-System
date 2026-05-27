import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getOffices,
  createOffice,
  updateOffice,
  deleteOffice,
  getOfficeAgents,
} from "@/services/officeService";

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => "collection-ref"),
  query: vi.fn(() => "query-ref"),
  where: vi.fn(() => "where-constraint"),
  orderBy: vi.fn(() => "orderBy-constraint"),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn((_db, _coll, id) => ({ id })),
}));

const { getDocs, addDoc, updateDoc, deleteDoc } = await import("firebase/firestore");

describe("officeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOffices", () => {
    it("should return offices for a given broker", async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          {
            id: "office-1",
            data: () => ({
              name: "Main Office",
              address: "123 Main St",
              brokerId: "broker-1",
            }),
          },
          {
            id: "office-2",
            data: () => ({
              name: "Branch Office",
              address: "456 Branch Ave",
              brokerId: "broker-1",
            }),
          },
        ],
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await getOffices("broker-1");
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Main Office");
      expect(result[1].name).toBe("Branch Office");
    });

    it("should filter by brokerId", async () => {
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const { where } = await import("firebase/firestore");

      await getOffices("broker-1");
      expect(vi.mocked(where)).toHaveBeenCalledWith("brokerId", "==", "broker-1");
    });

    it("should return empty array when no offices exist", async () => {
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const result = await getOffices("broker-1");
      expect(result).toEqual([]);
    });

    it("should handle Firestore error", async () => {
      vi.mocked(getDocs).mockRejectedValue(new Error("Permission denied"));
      await expect(getOffices("broker-1")).rejects.toThrow("Permission denied");
    });
  });

  describe("createOffice", () => {
    it("should create an office and return its id", async () => {
      vi.mocked(addDoc).mockResolvedValue({ id: "new-office-id" } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const id = await createOffice({
        name: "New Office",
        address: "789 New St",
        brokerId: "broker-1",
      });

      expect(id).toBe("new-office-id");
    });

    it("should include createdAt timestamp", async () => {
      vi.mocked(addDoc).mockResolvedValue({ id: "id" } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      await createOffice({
        name: "Office",
        address: "Addr",
        brokerId: "broker-1",
      });

      const data = vi.mocked(addDoc).mock.calls[0][1];
      expect(data).toHaveProperty("createdAt");
      expect(typeof data.createdAt).toBe("number");
    });
  });

  describe("updateOffice", () => {
    it("should call updateDoc with partial data", async () => {
      await updateOffice("office-1", { name: "Updated Name" });
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "office-1" }),
        { name: "Updated Name" },
      );
    });

    it("should throw on Firestore error", async () => {
      vi.mocked(updateDoc).mockRejectedValue(new Error("Update failed"));
      await expect(updateOffice("office-1", { name: "X" })).rejects.toThrow("Update failed");
    });
  });

  describe("deleteOffice", () => {
    it("should call deleteDoc with office id", async () => {
      await deleteOffice("office-1");
      expect(deleteDoc).toHaveBeenCalledWith(expect.objectContaining({ id: "office-1" }));
    });
  });

  describe("getOfficeAgents", () => {
    it("should return agents for a given office", async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          {
            id: "agent-1",
            data: () => ({ displayName: "Alice", officeId: "office-1" }),
          },
          {
            id: "agent-2",
            data: () => ({ displayName: "Bob", officeId: "office-1" }),
          },
        ],
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await getOfficeAgents("office-1");
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty("id", "agent-1");
    });

    it("should query users by officeId", async () => {
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const { where } = await import("firebase/firestore");

      await getOfficeAgents("office-1");
      expect(vi.mocked(where)).toHaveBeenCalledWith("officeId", "==", "office-1");
    });

    it("should return empty array when no agents assigned", async () => {
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const result = await getOfficeAgents("office-1");
      expect(result).toEqual([]);
    });
  });
});
