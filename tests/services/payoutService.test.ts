import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import {
  subscribePayouts,
  subscribePendingPayouts,
  updatePayoutStatus,
  bulkUpdatePayoutStatus,
  deletePayout,
} from "@/services/payoutService";
import type { Payout } from "@/types";

// ─── Mock firebase/firestore ─────────────────────────────────────────

const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockOnSnapshot = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockWriteBatch = vi.fn();

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  writeBatch: (...args: unknown[]) => mockWriteBatch(...args),
}));

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

// ─── Helpers ─────────────────────────────────────────────────────────

function makeMockSnapshot(
  docs: Array<{ id: string; data: () => Record<string, unknown> }>,
) {
  return {
    docs: docs.map((d) => ({
      id: d.id,
      data: d.data,
      exists: true,
    })),
  };
}

function samplePayout(overrides: Partial<Payout> = {}): Payout {
  return {
    id: "payout-1",
    dealId: "deal-1",
    agentId: "agent-1",
    agentName: "Bob Agent",
    brokerId: "broker-1",
    amount: 5000,
    status: "pending",
    paidAt: undefined,
    paidBy: undefined,
    approvedAt: undefined,
    approvedBy: undefined,
    receiptUrl: undefined,
    notes: undefined,
    dealClientName: "Client X",
    dealPrice: 500000,
    commissionPercent: 1,
    periodLabel: "2024-Q1",
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    ...overrides,
  };
}

const mockBatchUpdate = vi.fn();
const mockBatchCommit = vi.fn();

function createMockBatch() {
  return {
    update: mockBatchUpdate,
    commit: mockBatchCommit,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────

describe("payoutService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── subscribePayouts ────────────────────────────────────────────

  describe("subscribePayouts", () => {
    it("should return a noop unsubscribe when brokerId is undefined", () => {
      const unsub = subscribePayouts(undefined, vi.fn());
      expect(unsub).toBeInstanceOf(Function);
      expect(mockCollection).not.toHaveBeenCalled();
      expect(mockQuery).not.toHaveBeenCalled();
      expect(mockOnSnapshot).not.toHaveBeenCalled();
    });

    it("should subscribe to payouts for the given brokerId", () => {
      mockCollection.mockReturnValue("payouts-collection");
      mockWhere.mockReturnValue("where-brokerId");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      subscribePayouts("broker-1", vi.fn());

      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "payouts");
      expect(mockWhere).toHaveBeenCalledWith("brokerId", "==", "broker-1");
      expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
      expect(mockQuery).toHaveBeenCalledWith(
        "payouts-collection",
        "where-brokerId",
        "orderBy-createdAt-desc",
      );
      expect(mockOnSnapshot).toHaveBeenCalledWith(
        "query-ref",
        expect.any(Function),
        expect.any(Function),
      );
    });

    it("should map snapshot docs to Payout objects and invoke callback", () => {
      mockCollection.mockReturnValue("payouts-collection");
      mockWhere.mockReturnValue("where-brokerId");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");

      const snapshot = makeMockSnapshot([
        {
          id: "p1",
          data: () => ({
            amount: 1000,
            status: "pending",
            agentId: "a1",
            brokerId: "b1",
          }),
        },
        {
          id: "p2",
          data: () => ({
            amount: 2000,
            status: "paid",
            agentId: "a2",
            brokerId: "b1",
          }),
        },
      ]);

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(snapshot);
        return vi.fn();
      });

      const callback = vi.fn();
      subscribePayouts("broker-1", callback);

      expect(callback).toHaveBeenCalledWith([
        {
          id: "p1",
          amount: 1000,
          status: "pending",
          agentId: "a1",
          brokerId: "b1",
        },
        {
          id: "p2",
          amount: 2000,
          status: "paid",
          agentId: "a2",
          brokerId: "b1",
        },
      ]);
    });

    it("should invoke onError when snapshot error occurs", () => {
      mockCollection.mockReturnValue("payouts-collection");
      mockWhere.mockReturnValue("where-brokerId");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");

      const testError = new Error("Permission denied");
      mockOnSnapshot.mockImplementation(
        (_q, _onNext, onError: (e: Error) => void) => {
          onError(testError);
          return vi.fn();
        },
      );

      const onError = vi.fn();
      subscribePayouts("broker-1", vi.fn(), onError);

      expect(onError).toHaveBeenCalledWith("Permission denied");
    });

    it("should handle empty snapshot gracefully", () => {
      mockCollection.mockReturnValue("payouts-collection");
      mockWhere.mockReturnValue("where-brokerId");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      const callback = vi.fn();
      subscribePayouts("broker-1", callback);

      expect(callback).toHaveBeenCalledWith([]);
    });

    it("should return the unsubscribe function from onSnapshot", () => {
      mockCollection.mockReturnValue("payouts-collection");
      mockWhere.mockReturnValue("where-brokerId");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");

      const mockUnsub = vi.fn();
      mockOnSnapshot.mockReturnValue(mockUnsub);

      const unsub = subscribePayouts("broker-1", vi.fn());
      expect(unsub).toBe(mockUnsub);
    });
  });

  // ─── subscribePendingPayouts ─────────────────────────────────────

  describe("subscribePendingPayouts", () => {
    it("should return a noop unsubscribe when brokerId is undefined", () => {
      const unsub = subscribePendingPayouts(undefined, vi.fn());
      expect(unsub).toBeInstanceOf(Function);
      expect(mockCollection).not.toHaveBeenCalled();
      expect(mockQuery).not.toHaveBeenCalled();
      expect(mockOnSnapshot).not.toHaveBeenCalled();
    });

    it("should subscribe to pending/approved payouts for the given brokerId", () => {
      mockCollection.mockReturnValue("payouts-collection");
      mockWhere
        .mockReturnValueOnce("where-brokerId")
        .mockReturnValueOnce("where-status-in");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      subscribePendingPayouts("broker-1", vi.fn());

      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "payouts");
      expect(mockWhere).toHaveBeenNthCalledWith(
        1,
        "brokerId",
        "==",
        "broker-1",
      );
      expect(mockWhere).toHaveBeenNthCalledWith(2, "status", "in", [
        "pending",
        "approved",
      ]);
      expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
      expect(mockQuery).toHaveBeenCalledWith(
        "payouts-collection",
        "where-brokerId",
        "where-status-in",
        "orderBy-createdAt-desc",
      );
      expect(mockOnSnapshot).toHaveBeenCalledWith(
        "query-ref",
        expect.any(Function),
      );
    });

    it("should map snapshot and invoke callback", () => {
      mockCollection.mockReturnValue("payouts-collection");
      mockWhere
        .mockReturnValue("where-brokerId")
        .mockReturnValue("where-status-in");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");

      const snapshot = makeMockSnapshot([
        {
          id: "p1",
          data: () => ({ amount: 1500, status: "pending", agentId: "a1" }),
        },
      ]);

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(snapshot);
        return vi.fn();
      });

      const callback = vi.fn();
      subscribePendingPayouts("broker-1", callback);

      expect(callback).toHaveBeenCalledWith([
        { id: "p1", amount: 1500, status: "pending", agentId: "a1" },
      ]);
    });

    it("should handle empty snapshot", () => {
      mockCollection.mockReturnValue("payouts-collection");
      mockWhere
        .mockReturnValue("where-brokerId")
        .mockReturnValue("where-status-in");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      const callback = vi.fn();
      subscribePendingPayouts("broker-1", callback);

      expect(callback).toHaveBeenCalledWith([]);
    });
  });

  // ─── updatePayoutStatus ──────────────────────────────────────────

  describe("updatePayoutStatus", () => {
    it("should update payout status and set updatedAt", async () => {
      mockDoc.mockReturnValue({ id: "payout-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updatePayoutStatus("payout-1", "approved");

      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        "payouts",
        "payout-1",
      );
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        { id: "payout-1" },
        expect.objectContaining({
          status: "approved",
          updatedAt: expect.any(Number),
        }),
      );
    });

    it("should set approvedAt and approvedBy when status is approved with userId", async () => {
      mockDoc.mockReturnValue({ id: "payout-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updatePayoutStatus("payout-1", "approved", "manager-1");

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data.status).toBe("approved");
      expect(data.updatedAt).toEqual(expect.any(Number));
      expect(data.approvedAt).toEqual(expect.any(Number));
      expect(data.approvedBy).toBe("manager-1");
    });

    it("should set approvedAt without approvedBy when userId is not provided for approved status", async () => {
      mockDoc.mockReturnValue({ id: "payout-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updatePayoutStatus("payout-1", "approved");

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data.status).toBe("approved");
      expect(data).toHaveProperty("approvedAt");
      expect(data).not.toHaveProperty("approvedBy");
    });

    it("should set paidAt and paidBy when status is paid with userId", async () => {
      mockDoc.mockReturnValue({ id: "payout-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updatePayoutStatus("payout-1", "paid", "cashier-1");

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data.status).toBe("paid");
      expect(data.updatedAt).toEqual(expect.any(Number));
      expect(data.paidAt).toEqual(expect.any(Number));
      expect(data.paidBy).toBe("cashier-1");
    });

    it("should set paidAt without paidBy when userId is not provided for paid status", async () => {
      mockDoc.mockReturnValue({ id: "payout-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updatePayoutStatus("payout-1", "paid");

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data.status).toBe("paid");
      expect(data).toHaveProperty("paidAt");
      expect(data).not.toHaveProperty("paidBy");
    });

    it("should transition from pending to cancelled without timestamp fields", async () => {
      mockDoc.mockReturnValue({ id: "payout-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updatePayoutStatus("payout-1", "cancelled");

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data.status).toBe("cancelled");
      expect(data.updatedAt).toEqual(expect.any(Number));
      expect(data).not.toHaveProperty("approvedAt");
      expect(data).not.toHaveProperty("approvedBy");
      expect(data).not.toHaveProperty("paidAt");
      expect(data).not.toHaveProperty("paidBy");
    });

    it("should only set status, updatedAt, and relevant timestamp fields", async () => {
      mockDoc.mockReturnValue({ id: "payout-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updatePayoutStatus("payout-1", "approved", "manager-1");

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(Object.keys(data).sort()).toEqual([
        "approvedAt",
        "approvedBy",
        "status",
        "updatedAt",
      ]);
    });
  });

  // ─── bulkUpdatePayoutStatus ──────────────────────────────────────

  describe("bulkUpdatePayoutStatus", () => {
    it("should return early if payoutIds array is empty", async () => {
      await bulkUpdatePayoutStatus([], "approved");

      expect(mockWriteBatch).not.toHaveBeenCalled();
      expect(mockDoc).not.toHaveBeenCalled();
    });

    it("should use writeBatch to update multiple payouts", async () => {
      mockWriteBatch.mockReturnValue(createMockBatch());
      mockDoc
        .mockReturnValueOnce({ id: "payout-1" })
        .mockReturnValueOnce({ id: "payout-2" })
        .mockReturnValueOnce({ id: "payout-3" });
      mockBatchCommit.mockResolvedValue(undefined);

      await bulkUpdatePayoutStatus(
        ["payout-1", "payout-2", "payout-3"],
        "approved",
        "manager-1",
      );

      expect(mockWriteBatch).toHaveBeenCalledWith({});
      expect(mockDoc).toHaveBeenCalledTimes(3);
      expect(mockDoc).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        "payouts",
        "payout-1",
      );
      expect(mockDoc).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        "payouts",
        "payout-2",
      );
      expect(mockDoc).toHaveBeenNthCalledWith(
        3,
        expect.anything(),
        "payouts",
        "payout-3",
      );
      expect(mockBatchUpdate).toHaveBeenCalledTimes(3);
      expect(mockBatchCommit).toHaveBeenCalledOnce();
    });

    it("should set approvedAt and approvedBy when status is approved with userId", async () => {
      mockWriteBatch.mockReturnValue(createMockBatch());
      mockDoc.mockReturnValue({ id: "payout-1" });
      mockBatchCommit.mockResolvedValue(undefined);

      await bulkUpdatePayoutStatus(["payout-1"], "approved", "manager-1");

      expect(mockBatchUpdate).toHaveBeenCalledWith(
        { id: "payout-1" },
        expect.objectContaining({
          status: "approved",
          updatedAt: expect.any(Number),
          approvedAt: expect.any(Number),
          approvedBy: "manager-1",
        }),
      );
    });

    it("should set paidAt and paidBy when status is paid with userId", async () => {
      mockWriteBatch.mockReturnValue(createMockBatch());
      mockDoc.mockReturnValue({ id: "payout-1" });
      mockBatchCommit.mockResolvedValue(undefined);

      await bulkUpdatePayoutStatus(["payout-1"], "paid", "cashier-1");

      expect(mockBatchUpdate).toHaveBeenCalledWith(
        { id: "payout-1" },
        expect.objectContaining({
          status: "paid",
          updatedAt: expect.any(Number),
          paidAt: expect.any(Number),
          paidBy: "cashier-1",
        }),
      );
    });

    it("should set cancelled status without timestamp fields", async () => {
      mockWriteBatch.mockReturnValue(createMockBatch());
      mockDoc.mockReturnValue({ id: "payout-1" });
      mockBatchCommit.mockResolvedValue(undefined);

      await bulkUpdatePayoutStatus(["payout-1"], "cancelled");

      const updateArg = vi.mocked(mockBatchUpdate).mock.calls[0][1];
      expect(updateArg.status).toBe("cancelled");
      expect(updateArg).toHaveProperty("updatedAt");
      expect(updateArg).not.toHaveProperty("approvedAt");
      expect(updateArg).not.toHaveProperty("approvedBy");
      expect(updateArg).not.toHaveProperty("paidAt");
      expect(updateArg).not.toHaveProperty("paidBy");
    });

    it("should use the same timestamp for all batch updates", async () => {
      const before = Date.now();
      mockWriteBatch.mockReturnValue(createMockBatch());
      mockDoc
        .mockReturnValueOnce({ id: "payout-1" })
        .mockReturnValueOnce({ id: "payout-2" });
      mockBatchCommit.mockResolvedValue(undefined);

      await bulkUpdatePayoutStatus(["payout-1", "payout-2"], "approved", "u1");

      const data1 = vi.mocked(mockBatchUpdate).mock.calls[0][1];
      const data2 = vi.mocked(mockBatchUpdate).mock.calls[1][1];
      expect(data1.updatedAt).toEqual(data2.updatedAt);
      expect(data1.updatedAt).toBeGreaterThanOrEqual(before);
    });
  });

  // ─── deletePayout ────────────────────────────────────────────────

  describe("deletePayout", () => {
    it("should delete the document by payoutId", async () => {
      mockDoc.mockReturnValue({ id: "payout-to-delete" });
      mockDeleteDoc.mockResolvedValue(undefined);

      await deletePayout("payout-to-delete");

      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        "payouts",
        "payout-to-delete",
      );
      expect(mockDeleteDoc).toHaveBeenCalledWith({ id: "payout-to-delete" });
      expect(mockDeleteDoc).toHaveBeenCalledOnce();
    });
  });
});
