import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  subscribeCoBrokers,
  subscribeCoBrokerDeals,
  createCoBroker,
  updateCoBroker,
  deleteCoBroker,
  createCoBrokerDeal,
  updateCoBrokerDeal,
} from "@/services/coBrokerService";

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
  COLLECTIONS: {
    CO_BROKERS: "coBrokers",
    CO_BROKER_DEALS: "coBrokerDeals",
  },
}));

vi.mock("@/lib/firebase", () => ({ db: {} }));

// ─── Tests ────────────────────────────────────────────────────────────

describe("coBrokerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── subscribeCoBrokers ─────────────────────────────────────────

  describe("subscribeCoBrokers", () => {
    it("should return a noop unsubscribe when brokerId is undefined", () => {
      const unsub = subscribeCoBrokers(undefined, vi.fn());
      expect(unsub).toBeInstanceOf(Function);
      expect(mockSubscribeToQuery).not.toHaveBeenCalled();
    });

    it("should subscribe to coBrokers collection with a callback", () => {
      const callback = vi.fn();
      subscribeCoBrokers("broker-1", callback);

      expect(mockSubscribeToQuery).toHaveBeenCalledWith(
        "coBrokers",
        expect.any(Array),
        callback,
      );
    });

    it("should pass a non-empty constraints array", () => {
      subscribeCoBrokers("broker-1", vi.fn());

      const constraints = mockSubscribeToQuery.mock.calls[0][1];
      expect(Array.isArray(constraints)).toBe(true);
      expect(constraints.length).toBeGreaterThan(0);
    });

    it("should return unsubscribe function from subscribeToQuery", () => {
      const mockUnsub = vi.fn();
      mockSubscribeToQuery.mockReturnValue(mockUnsub);

      const unsub = subscribeCoBrokers("broker-1", vi.fn());
      expect(unsub).toBe(mockUnsub);
    });
  });

  // ─── subscribeCoBrokerDeals ─────────────────────────────────────

  describe("subscribeCoBrokerDeals", () => {
    it("should return a noop unsubscribe when brokerId is undefined", () => {
      const unsub = subscribeCoBrokerDeals(undefined, vi.fn());
      expect(unsub).toBeInstanceOf(Function);
      expect(mockSubscribeToQuery).not.toHaveBeenCalled();
    });

    it("should subscribe to coBrokerDeals collection with a callback", () => {
      subscribeCoBrokerDeals("broker-1", vi.fn());

      expect(mockSubscribeToQuery).toHaveBeenCalledWith(
        "coBrokerDeals",
        expect.any(Array),
        expect.any(Function),
      );
    });

    it("should pass a non-empty constraints array", () => {
      subscribeCoBrokerDeals("broker-1", vi.fn());

      const constraints = mockSubscribeToQuery.mock.calls[0][1];
      expect(Array.isArray(constraints)).toBe(true);
      expect(constraints.length).toBeGreaterThan(0);
    });

    it("should return unsubscribe function", () => {
      const mockUnsub = vi.fn();
      mockSubscribeToQuery.mockReturnValue(mockUnsub);

      const unsub = subscribeCoBrokerDeals("broker-1", vi.fn());
      expect(unsub).toBe(mockUnsub);
    });
  });

  // ─── createCoBroker ─────────────────────────────────────────────

  describe("createCoBroker", () => {
    const coBrokerInput = {
      name: "Jane Smith",
      brokerage: "Smith Realty",
      licenseNumber: "LIC-12345",
      phone: "+639****1111",
      email: "jane@smithrealty.com",
      address: "456 Oak St",
      referralFeeRate: 50,
      notes: "Preferred partner for condo deals",
      createdBy: "user-1",
      brokerId: "broker-1",
    };

    it("should create a document and return the new id", async () => {
      mockCreateDocument.mockResolvedValue("new-cobroker-id");

      const id = await createCoBroker(coBrokerInput);

      expect(mockCreateDocument).toHaveBeenCalledWith("coBrokers", coBrokerInput);
      expect(id).toBe("new-cobroker-id");
    });

    it("should pass all fields to createDocument", async () => {
      mockCreateDocument.mockResolvedValue("id");

      await createCoBroker(coBrokerInput);

      const data = vi.mocked(mockCreateDocument).mock.calls[0][1];
      expect(data).toMatchObject(coBrokerInput);
    });

    it("should handle error from createDocument", async () => {
      mockCreateDocument.mockRejectedValue(new Error("Create failed"));

      await expect(createCoBroker(coBrokerInput)).rejects.toThrow("Create failed");
    });

    it("should handle minimal required fields", async () => {
      mockCreateDocument.mockResolvedValue("id");

      const minimal = {
        name: "John",
        brokerage: "John Realty",
        phone: "09170000000",
        createdBy: "user-1",
        brokerId: "broker-1",
      };

      await createCoBroker(minimal);
      const data = vi.mocked(mockCreateDocument).mock.calls[0][1];
      expect(data.name).toBe("John");
      expect(data.brokerage).toBe("John Realty");
    });
  });

  // ─── updateCoBroker ─────────────────────────────────────────────

  describe("updateCoBroker", () => {
    it("should update the document with partial data", async () => {
      mockUpdateDocument.mockResolvedValue(undefined);

      await updateCoBroker("cobroker-1", {
        name: "Jane Updated",
        referralFeeRate: 55,
      });

      expect(mockUpdateDocument).toHaveBeenCalledWith("coBrokers", "cobroker-1", {
        name: "Jane Updated",
        referralFeeRate: 55,
      });
    });

    it("should handle error from updateDocument", async () => {
      mockUpdateDocument.mockRejectedValue(new Error("Update failed"));

      await expect(
        updateCoBroker("cobroker-1", { phone: "000" }),
      ).rejects.toThrow("Update failed");
    });
  });

  // ─── deleteCoBroker ─────────────────────────────────────────────

  describe("deleteCoBroker", () => {
    it("should delete the document by id", async () => {
      mockDeleteDocument.mockResolvedValue(undefined);

      await deleteCoBroker("cobroker-to-delete");

      expect(mockDeleteDocument).toHaveBeenCalledWith(
        "coBrokers",
        "cobroker-to-delete",
      );
    });

    it("should resolve successfully", async () => {
      mockDeleteDocument.mockResolvedValue(undefined);

      await expect(deleteCoBroker("cobroker-1")).resolves.toBeUndefined();
    });

    it("should handle error from deleteDocument", async () => {
      mockDeleteDocument.mockRejectedValue(new Error("Delete failed"));

      await expect(deleteCoBroker("cb-1")).rejects.toThrow("Delete failed");
    });
  });

  // ─── createCoBrokerDeal ─────────────────────────────────────────

  describe("createCoBrokerDeal", () => {
    const dealInput = {
      dealId: "deal-1",
      coBrokerId: "cobroker-1",
      coBrokerName: "Jane Smith",
      coBrokerBrokerage: "Smith Realty",
      splitPercentage: 50,
      commissionAmount: 100000,
      status: "pending" as const,
      createdBy: "user-1",
    };

    it("should create a document and return the new id", async () => {
      mockCreateDocument.mockResolvedValue("new-deal-id");

      const id = await createCoBrokerDeal(dealInput);

      expect(mockCreateDocument).toHaveBeenCalledWith("coBrokerDeals", dealInput);
      expect(id).toBe("new-deal-id");
    });

    it("should handle error", async () => {
      mockCreateDocument.mockRejectedValue(new Error("Failed"));

      await expect(createCoBrokerDeal(dealInput)).rejects.toThrow("Failed");
    });
  });

  // ─── updateCoBrokerDeal ─────────────────────────────────────────

  describe("updateCoBrokerDeal", () => {
    it("should update the deal document", async () => {
      mockUpdateDocument.mockResolvedValue(undefined);

      await updateCoBrokerDeal("deal-1", { status: "approved" });

      expect(mockUpdateDocument).toHaveBeenCalledWith(
        "coBrokerDeals",
        "deal-1",
        { status: "approved" },
      );
    });

    it("should handle error", async () => {
      mockUpdateDocument.mockRejectedValue(new Error("Update failed"));

      await expect(
        updateCoBrokerDeal("deal-1", { status: "paid" }),
      ).rejects.toThrow("Update failed");
    });
  });
});
