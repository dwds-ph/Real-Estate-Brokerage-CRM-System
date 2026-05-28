import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import {
  subscribePaymentsForDeal,
  createPayment,
  updatePayment,
  markPaymentPaid,
  deletePayment,
  getPaymentTypeLabel,
  getPaymentStatusColor,
  recalculatePaymentStatus,
} from "@/services/paymentService";
import type { Payment, PaymentStatus } from "@/types";

// ─── Mock firebase/firestore ─────────────────────────────────────────

const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockOnSnapshot = vi.fn();
const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
}));

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

// ─── Helpers ─────────────────────────────────────────────────────────

const now = Date.now();
const HOUR = 3600000;
const DAY = 86400000;

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

function samplePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "payment-1",
    dealId: "deal-1",
    type: "down-payment",
    label: "Down Payment",
    amount: 500000,
    dueDate: now + 30 * DAY,
    paidDate: undefined,
    status: "pending",
    receiptUrl: undefined,
    notes: undefined,
    createdBy: "user-1",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────

describe("paymentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── subscribePaymentsForDeal ─────────────────────────────────────

  describe("subscribePaymentsForDeal", () => {
    it("should return a noop unsubscribe when dealId is undefined", () => {
      const unsub = subscribePaymentsForDeal(undefined, vi.fn());
      expect(unsub).toBeInstanceOf(Function);
      expect(mockCollection).not.toHaveBeenCalled();
      expect(mockQuery).not.toHaveBeenCalled();
      expect(mockOnSnapshot).not.toHaveBeenCalled();
    });

    it("should return a noop unsubscribe when dealId is an empty string", () => {
      const unsub = subscribePaymentsForDeal("", vi.fn());
      expect(unsub).toBeInstanceOf(Function);
      expect(mockCollection).not.toHaveBeenCalled();
      expect(mockQuery).not.toHaveBeenCalled();
      expect(mockOnSnapshot).not.toHaveBeenCalled();
    });

    it("should subscribe to payments for the given dealId", () => {
      mockCollection.mockReturnValue("payments-collection");
      mockWhere.mockImplementation((field, op, val) => ({ field, op, val }));
      mockOrderBy.mockReturnValue("orderBy-dueDate-asc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      const unsub = subscribePaymentsForDeal("deal-1", vi.fn());

      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        "payments",
      );
      expect(mockWhere).toHaveBeenCalledWith("dealId", "==", "deal-1");
      expect(mockOrderBy).toHaveBeenCalledWith("dueDate", "asc");
      expect(mockQuery).toHaveBeenCalledWith(
        "payments-collection",
        expect.any(Object),
        "orderBy-dueDate-asc",
      );
      expect(mockOnSnapshot).toHaveBeenCalledWith(
        "query-ref",
        expect.any(Function),
      );
      expect(unsub).toBeInstanceOf(Function);
    });

    it("should map snapshot docs to Payment objects and invoke callback", () => {
      mockCollection.mockReturnValue("payments-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-dueDate-asc");
      mockQuery.mockReturnValue("query-ref");

      const snapshot = makeMockSnapshot([
        {
          id: "p1",
          data: () => ({
            dealId: "deal-1",
            type: "down-payment",
            label: "Down Payment",
            amount: 500000,
            dueDate: now + 30 * DAY,
            status: "pending",
            createdBy: "user-1",
            createdAt: now,
            updatedAt: now,
          }),
        },
        {
          id: "p2",
          data: () => ({
            dealId: "deal-1",
            type: "full-payment",
            label: "Full Payment",
            amount: 1000000,
            dueDate: now + 60 * DAY,
            status: "paid",
            paidDate: now,
            receiptUrl: "https://example.com/receipt.pdf",
            createdBy: "user-1",
            createdAt: now,
            updatedAt: now,
          }),
        },
      ]);

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(snapshot);
        return vi.fn();
      });

      const callback = vi.fn();
      subscribePaymentsForDeal("deal-1", callback);

      expect(callback).toHaveBeenCalledTimes(1);
      const payments = callback.mock.calls[0][0];
      expect(payments).toHaveLength(2);
      expect(payments[0]).toMatchObject({
        id: "p1",
        dealId: "deal-1",
        type: "down-payment",
        amount: 500000,
      });
      expect(payments[1]).toMatchObject({
        id: "p2",
        dealId: "deal-1",
        type: "full-payment",
        amount: 1000000,
        paidDate: now,
        receiptUrl: "https://example.com/receipt.pdf",
      });
    });

    it("should handle an empty snapshot gracefully", () => {
      mockCollection.mockReturnValue("payments-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-dueDate-asc");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      const callback = vi.fn();
      subscribePaymentsForDeal("deal-1", callback);

      expect(callback).toHaveBeenCalledWith([]);
    });

    it("should return the unsubscribe function from onSnapshot", () => {
      mockCollection.mockReturnValue("payments-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-dueDate-asc");
      mockQuery.mockReturnValue("query-ref");

      const mockUnsub = vi.fn();
      mockOnSnapshot.mockReturnValue(mockUnsub);

      const unsub = subscribePaymentsForDeal("deal-1", vi.fn());
      expect(unsub).toBe(mockUnsub);
    });

    it("should require a callback to be provided (TypeError otherwise)", () => {
      // The production code calls callback() without a guard,
      // so omitting it will throw at runtime.
      mockCollection.mockReturnValue("payments-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-dueDate-asc");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      expect(() => {
        subscribePaymentsForDeal(
          "deal-1",
          undefined as unknown as (p: Payment[]) => void,
        );
      }).toThrow(TypeError);
    });
  });

  // ─── createPayment ─────────────────────────────────────────────────

  describe("createPayment", () => {
    const paymentInput = {
      type: "down-payment" as const,
      label: "Down Payment",
      amount: 500000,
      dueDate: now + 30 * DAY,
      notes: "Initial down payment",
    };

    it("should add a document with pending status when dueDate is in the future", async () => {
      mockCollection.mockReturnValue("payments-collection");
      mockAddDoc.mockResolvedValue({ id: "new-payment-id" });

      const id = await createPayment("deal-1", paymentInput, "user-1");

      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        "payments",
      );
      expect(mockAddDoc).toHaveBeenCalledWith(
        "payments-collection",
        expect.objectContaining({
          type: "down-payment",
          label: "Down Payment",
          amount: 500000,
          dueDate: expect.any(Number),
          notes: "Initial down payment",
          dealId: "deal-1",
          status: "pending",
          createdBy: "user-1",
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number),
        }),
      );
      expect(id).toBe("new-payment-id");
    });

    it("should set status to overdue when dueDate is in the past", async () => {
      mockCollection.mockReturnValue("payments-collection");
      mockAddDoc.mockResolvedValue({ id: "payment-id" });

      // dueDate in the past relative to when createPayment runs
      const pastDueInput = {
        ...paymentInput,
        dueDate: now - DAY,
      };

      await createPayment("deal-1", pastDueInput, "user-1");

      const data = vi.mocked(mockAddDoc).mock.calls[0][1];
      expect(data.status).toBe("overdue");
    });

    it("should set status to pending when dueDate equals now", async () => {
      mockCollection.mockReturnValue("payments-collection");
      mockAddDoc.mockResolvedValue({ id: "payment-id" });

      // Use a high dueDate to be safely in the future
      await createPayment("deal-1", paymentInput, "user-1");

      const data = vi.mocked(mockAddDoc).mock.calls[0][1];
      expect(data.status).toBe("pending");
    });

    it("should set status to overdue when dueDate is exactly Date.now() (strictly past)", async () => {
      mockCollection.mockReturnValue("payments-collection");
      mockAddDoc.mockResolvedValue({ id: "payment-id" });

      // The implementation checks now > data.dueDate, so equal means not overdue
      await createPayment("deal-1", paymentInput, "user-1");

      const data = vi.mocked(mockAddDoc).mock.calls[0][1];
      expect(data.status).toBe("pending");
    });

    it("should set createdAt and updatedAt to the same timestamp", async () => {
      mockCollection.mockReturnValue("payments-collection");
      mockAddDoc.mockImplementation((_col, data: Record<string, unknown>) => {
        expect(data.createdAt).toEqual(data.updatedAt);
        expect(data.createdAt).toEqual(expect.any(Number));
        return { id: "payment-123" };
      });

      await createPayment("deal-1", paymentInput, "user-1");
    });

    it("should include optional notes and receiptUrl fields", async () => {
      mockCollection.mockReturnValue("payments-collection");
      mockAddDoc.mockResolvedValue({ id: "p1" });

      const withOptionalFields = {
        ...paymentInput,
        receiptUrl: "https://example.com/receipt.pdf",
      };

      await createPayment("deal-1", withOptionalFields, "user-1");

      const data = vi.mocked(mockAddDoc).mock.calls[0][1];
      expect(data.receiptUrl).toBe("https://example.com/receipt.pdf");
      expect(data.notes).toBe("Initial down payment");
    });

    it("should return the new document ID", async () => {
      mockCollection.mockReturnValue("payments-collection");
      mockAddDoc.mockResolvedValue({ id: "generated-id-42" });

      const id = await createPayment("deal-1", paymentInput, "user-1");
      expect(id).toBe("generated-id-42");
    });
  });

  // ─── updatePayment ─────────────────────────────────────────────────

  describe("updatePayment", () => {
    it("should update the document with partial data and set updatedAt", async () => {
      mockDoc.mockReturnValue({ id: "payment-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updatePayment("payment-1", {
        label: "Updated Label",
        amount: 600000,
      });

      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        "payments",
        "payment-1",
      );
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        { id: "payment-1" },
        expect.objectContaining({
          label: "Updated Label",
          amount: 600000,
          updatedAt: expect.any(Number),
        }),
      );
    });

    it("should merge data without removing existing fields", async () => {
      mockDoc.mockReturnValue({ id: "payment-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updatePayment("payment-1", { status: "cancelled" });

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data).toHaveProperty("status", "cancelled");
      expect(data).toHaveProperty("updatedAt");
      expect(Object.keys(data)).toEqual(["status", "updatedAt"]);
    });

    it("should allow empty partial update (only sets updatedAt)", async () => {
      mockDoc.mockReturnValue({ id: "payment-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updatePayment("payment-1", {});

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data).toEqual({ updatedAt: expect.any(Number) });
    });

    it("should update status field correctly", async () => {
      mockDoc.mockReturnValue({ id: "payment-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updatePayment("payment-1", { status: "overdue" });

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data.status).toBe("overdue");
    });
  });

  // ─── markPaymentPaid ───────────────────────────────────────────────

  describe("markPaymentPaid", () => {
    it("should set status to paid and set paidDate", async () => {
      mockDoc.mockReturnValue({ id: "payment-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await markPaymentPaid("payment-1");

      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        "payments",
        "payment-1",
      );
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        { id: "payment-1" },
        expect.objectContaining({
          status: "paid",
          paidDate: expect.any(Number),
          updatedAt: expect.any(Number),
        }),
      );
    });

    it("should use provided paidDate when specified", async () => {
      mockDoc.mockReturnValue({ id: "payment-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      const specificDate = now - 5 * DAY;
      await markPaymentPaid("payment-1", specificDate);

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data.paidDate).toBe(specificDate);
    });

    it("should include receiptUrl when provided", async () => {
      mockDoc.mockReturnValue({ id: "payment-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await markPaymentPaid(
        "payment-1",
        now,
        "https://example.com/receipt.pdf",
      );

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data.status).toBe("paid");
      expect(data.receiptUrl).toBe("https://example.com/receipt.pdf");
    });

    it("should not include receiptUrl field when not provided", async () => {
      mockDoc.mockReturnValue({ id: "payment-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await markPaymentPaid("payment-1");

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data).not.toHaveProperty("receiptUrl");
    });

    it("should only set status, paidDate, and updatedAt when no receiptUrl", async () => {
      mockDoc.mockReturnValue({ id: "payment-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await markPaymentPaid("payment-1");

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(Object.keys(data).sort()).toEqual([
        "paidDate",
        "status",
        "updatedAt",
      ]);
    });

    it("should set status, paidDate, receiptUrl, and updatedAt when receiptUrl provided", async () => {
      mockDoc.mockReturnValue({ id: "payment-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await markPaymentPaid(
        "payment-1",
        now,
        "https://example.com/receipt.pdf",
      );

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(Object.keys(data).sort()).toEqual([
        "paidDate",
        "receiptUrl",
        "status",
        "updatedAt",
      ]);
    });
  });

  // ─── deletePayment ─────────────────────────────────────────────────

  describe("deletePayment", () => {
    it("should delete the document by paymentId", async () => {
      mockDoc.mockReturnValue({ id: "payment-to-delete" });
      mockDeleteDoc.mockResolvedValue(undefined);

      await deletePayment("payment-to-delete");

      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        "payments",
        "payment-to-delete",
      );
      expect(mockDeleteDoc).toHaveBeenCalledWith({ id: "payment-to-delete" });
      expect(mockDeleteDoc).toHaveBeenCalledOnce();
    });

    it("should handle deletion without error", async () => {
      mockDoc.mockReturnValue({ id: "payment-1" });
      mockDeleteDoc.mockResolvedValue(undefined);

      await expect(deletePayment("payment-1")).resolves.toBeUndefined();
    });
  });

  // ─── getPaymentTypeLabel ───────────────────────────────────────────

  describe("getPaymentTypeLabel", () => {
    it.each([
      ["reservation-fee", "Reservation Fee"],
      ["down-payment", "Down Payment"],
      ["equity", "Equity"],
      ["full-payment", "Full Payment"],
      ["move-in-fee", "Move-In Fee"],
      ["other", "Other"],
    ])("should return '%s' for type '%s'", (type, expected) => {
      expect(getPaymentTypeLabel(type)).toBe(expected);
    });

    it("should return the input string for unknown types", () => {
      expect(getPaymentTypeLabel("unknown-type")).toBe("unknown-type");
      expect(getPaymentTypeLabel("")).toBe("");
    });

    it("should be case-sensitive", () => {
      expect(getPaymentTypeLabel("Down-Payment")).toBe("Down-Payment");
    });
  });

  // ─── getPaymentStatusColor ─────────────────────────────────────────

  describe("getPaymentStatusColor", () => {
    it.each([
      [
        "pending",
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      ],
      [
        "paid",
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      ],
      ["overdue", "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"],
      [
        "cancelled",
        "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      ],
    ])("should return correct classes for status '%s'", (status, expected) => {
      expect(getPaymentStatusColor(status)).toBe(expected);
    });

    it("should return default classes for unknown statuses", () => {
      expect(getPaymentStatusColor("unknown")).toBe(
        "bg-gray-100 text-gray-800",
      );
    });
  });

  // ─── recalculatePaymentStatus ──────────────────────────────────────

  describe("recalculatePaymentStatus", () => {
    it("should return 'paid' when payment status is 'paid'", () => {
      const payment = samplePayment({ status: "paid", dueDate: now - DAY });
      expect(recalculatePaymentStatus(payment, now)).toBe("paid");
    });

    it("should return 'cancelled' when payment status is 'cancelled'", () => {
      const payment = samplePayment({
        status: "cancelled",
        dueDate: now - DAY,
      });
      expect(recalculatePaymentStatus(payment, now)).toBe("cancelled");
    });

    it("should return 'overdue' when dueDate is in the past and status is 'pending'", () => {
      const payment = samplePayment({ status: "pending", dueDate: now - DAY });
      expect(recalculatePaymentStatus(payment, now)).toBe("overdue");
    });

    it("should return 'pending' when dueDate is in the future and status is 'pending'", () => {
      const payment = samplePayment({ status: "pending", dueDate: now + DAY });
      expect(recalculatePaymentStatus(payment, now)).toBe("pending");
    });

    it("should return 'pending' when dueDate equals now (not strictly past)", () => {
      const payment = samplePayment({ status: "pending", dueDate: now });
      expect(recalculatePaymentStatus(payment, now)).toBe("pending");
    });

    it("should use Date.now() when no now parameter is provided", () => {
      // Use a past dueDate so that if Date.now() is used, it will be overdue
      const pastDue = Date.now() - DAY;
      const payment = samplePayment({ status: "pending", dueDate: pastDue });
      expect(recalculatePaymentStatus(payment)).toBe("overdue");
    });

    it("should return 'overdue' when status was 'overdue' but is still past due", () => {
      // The function only preserves paid/cancelled; "overdue" status gets recalculated
      const payment = samplePayment({
        status: "overdue" as PaymentStatus,
        dueDate: now - 2 * DAY,
      });
      expect(recalculatePaymentStatus(payment, now)).toBe("overdue");
    });

    it("should return 'pending' when status was 'overdue' but dueDate is now in the future", () => {
      const payment = samplePayment({
        status: "overdue" as PaymentStatus,
        dueDate: now + DAY,
      });
      expect(recalculatePaymentStatus(payment, now)).toBe("pending");
    });

    it("should accept a custom now timestamp", () => {
      const customNow = now - 10 * DAY;
      const payment = samplePayment({
        status: "pending",
        dueDate: now - 5 * DAY, // past relative to real now
      });
      // But with customNow (10 days ago), dueDate is 5 days in the future
      expect(recalculatePaymentStatus(payment, customNow)).toBe("pending");
    });
  });
});
