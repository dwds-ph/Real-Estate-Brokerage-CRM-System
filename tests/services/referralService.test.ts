import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchReferrals,
  createReferral,
  updateReferral,
  deleteReferral,
} from "@/services/referralService";

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

describe("referralService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchReferrals", () => {
    it("should return all referrals when no dealId provided", async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          {
            id: "ref-1",
            data: () => ({
              dealId: "deal-1",
              referrerName: "John Doe",
              status: "pending",
            }),
          },
          {
            id: "ref-2",
            data: () => ({
              dealId: "deal-2",
              referrerName: "Jane Smith",
              status: "paid",
            }),
          },
        ],
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await fetchReferrals();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("ref-1");
      expect(result[1].id).toBe("ref-2");
    });

    it("should filter by dealId when provided", async () => {
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const { where } = await import("firebase/firestore");

      await fetchReferrals("deal-1");
      expect(vi.mocked(where)).toHaveBeenCalledWith("dealId", "==", "deal-1");
    });

    it("should return empty array when no referrals exist", async () => {
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      const result = await fetchReferrals();
      expect(result).toEqual([]);
    });

    it("should handle Firestore error", async () => {
      vi.mocked(getDocs).mockRejectedValue(new Error("Firestore error"));
      await expect(fetchReferrals()).rejects.toThrow("Firestore error");
    });
  });

  describe("createReferral", () => {
    it("should create a referral and return its id", async () => {
      vi.mocked(addDoc).mockResolvedValue({ id: "new-ref-id" } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const id = await createReferral({
        dealId: "deal-1",
        referrerName: "Referrer Name",
        referrerContact: "09170000000",
        referralFee: 50000,
        status: "pending",
      });

      expect(id).toBe("new-ref-id");
    });

    it("should include createdAt timestamp", async () => {
      vi.mocked(addDoc).mockResolvedValue({ id: "id" } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      await createReferral({
        dealId: "deal-1",
        referrerName: "Name",
        referrerContact: "contact",
        referralFee: 10000,
        status: "pending",
      });

      const data = vi.mocked(addDoc).mock.calls[0][1];
      expect(data).toHaveProperty("createdAt");
      expect(typeof data.createdAt).toBe("number");
    });
  });

  describe("updateReferral", () => {
    it("should update referral status to paid", async () => {
      await updateReferral("ref-1", { status: "paid", paidAt: Date.now() });
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "ref-1" }),
        expect.objectContaining({ status: "paid" }),
      );
    });

    it("should update referral status to pending", async () => {
      await updateReferral("ref-1", { status: "pending" });
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "ref-1" }),
        { status: "pending" },
      );
    });

    it("should throw on Firestore error", async () => {
      vi.mocked(updateDoc).mockRejectedValue(new Error("Update failed"));
      await expect(updateReferral("ref-1", { status: "paid" })).rejects.toThrow("Update failed");
    });
  });

  describe("deleteReferral", () => {
    it("should delete referral by id", async () => {
      await deleteReferral("ref-1");
      expect(deleteDoc).toHaveBeenCalledWith(expect.objectContaining({ id: "ref-1" }));
    });

    it("should throw on Firestore error", async () => {
      vi.mocked(deleteDoc).mockRejectedValue(new Error("Delete failed"));
      await expect(deleteReferral("ref-1")).rejects.toThrow("Delete failed");
    });
  });

  describe("status transitions", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      // Re-apply default mocks after restore
      vi.mocked(addDoc).mockResolvedValue({ id: "ref-1" } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      vi.mocked(updateDoc).mockResolvedValue(undefined);
    });

    it("should transition from pending to paid", async () => {
      // Create as pending
      const id = await createReferral({
        dealId: "deal-1",
        referrerName: "Test",
        referrerContact: "000",
        referralFee: 1000,
        status: "pending",
      });
      expect(id).toBe("ref-1");

      // Update to paid
      await updateReferral(id, { status: "paid", paidAt: Date.now() });
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status: "paid", paidAt: expect.any(Number) }),
      );
    });
  });
});
