import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import {
  subscribePlans,
  createPlan,
  updatePlan,
  deletePlan,
} from "@/services/commissionPlanService";
import type { CommissionPlan } from "@/types";

// ─── Mock firebase/firestore ─────────────────────────────────────────

const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockQuery = vi.fn();
const mockOrderBy = vi.fn();
const mockOnSnapshot = vi.fn();
const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  query: (...args: unknown[]) => mockQuery(...args),
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

function samplePlan(overrides: Partial<CommissionPlan> = {}): CommissionPlan {
  return {
    id: "plan-1",
    name: "Standard Commission",
    type: "fixed",
    brokerId: "broker-1",
    rules: {
      percent: 3,
    },
    assignedTo: ["agent-1", "agent-2"],
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────

describe("commissionPlanService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── subscribePlans ──────────────────────────────────────────────

  describe("subscribePlans", () => {
    it("should subscribe to all commission plans ordered by createdAt desc", () => {
      mockCollection.mockReturnValue("plans-collection");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      subscribePlans(vi.fn());

      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        "commissionPlans",
      );
      expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
      expect(mockQuery).toHaveBeenCalledWith(
        "plans-collection",
        "orderBy-createdAt-desc",
      );
      expect(mockOnSnapshot).toHaveBeenCalledWith(
        "query-ref",
        expect.any(Function),
      );
    });

    it("should map snapshot docs to CommissionPlan objects and invoke callback", () => {
      mockCollection.mockReturnValue("plans-collection");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");

      const snapshot = makeMockSnapshot([
        {
          id: "p1",
          data: () => ({
            name: "Tiered Plan",
            type: "tiered",
            brokerId: "b1",
            rules: { tiers: [{ minVolume: 0, percent: 2 }] },
            assignedTo: ["a1"],
          }),
        },
        {
          id: "p2",
          data: () => ({
            name: "Referral Plan",
            type: "referral",
            brokerId: "b1",
            rules: { referralFee: 5000 },
            assignedTo: ["a2"],
          }),
        },
      ]);

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(snapshot);
        return vi.fn();
      });

      const callback = vi.fn();
      subscribePlans(callback);

      expect(callback).toHaveBeenCalledWith([
        {
          id: "p1",
          name: "Tiered Plan",
          type: "tiered",
          brokerId: "b1",
          rules: { tiers: [{ minVolume: 0, percent: 2 }] },
          assignedTo: ["a1"],
        },
        {
          id: "p2",
          name: "Referral Plan",
          type: "referral",
          brokerId: "b1",
          rules: { referralFee: 5000 },
          assignedTo: ["a2"],
        },
      ]);
    });

    it("should handle empty snapshot gracefully", () => {
      mockCollection.mockReturnValue("plans-collection");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      const callback = vi.fn();
      subscribePlans(callback);

      expect(callback).toHaveBeenCalledWith([]);
    });

    it("should return the unsubscribe function from onSnapshot", () => {
      mockCollection.mockReturnValue("plans-collection");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockQuery.mockReturnValue("query-ref");

      const mockUnsub = vi.fn();
      mockOnSnapshot.mockReturnValue(mockUnsub);

      const unsub = subscribePlans(vi.fn());
      expect(unsub).toBe(mockUnsub);
    });
  });

  // ─── createPlan ──────────────────────────────────────────────────

  describe("createPlan", () => {
    const planInput = {
      name: "New Commission Plan",
      type: "tiered" as const,
      brokerId: "broker-1",
      rules: {
        tiers: [
          { minVolume: 0, percent: 2 },
          { minVolume: 1000000, percent: 3 },
        ],
      },
      assignedTo: ["agent-1"],
    };

    it("should add a document with timestamps and return the new id", async () => {
      mockCollection.mockReturnValue("plans-collection");
      mockAddDoc.mockResolvedValue({ id: "new-plan-id" });

      const id = await createPlan(planInput);

      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        "commissionPlans",
      );
      expect(mockAddDoc).toHaveBeenCalledWith(
        "plans-collection",
        expect.objectContaining({
          ...planInput,
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number),
        }),
      );
      expect(id).toBe("new-plan-id");
    });

    it("should set createdAt and updatedAt to the same timestamp", async () => {
      mockCollection.mockReturnValue("plans-collection");
      mockAddDoc.mockImplementation((_col, data: Record<string, unknown>) => {
        expect(data.createdAt).toEqual(data.updatedAt);
        expect(data.createdAt).toEqual(expect.any(Number));
        return { id: "plan-123" };
      });

      await createPlan(planInput);
    });

    it("should pass all provided fields to addDoc", async () => {
      mockCollection.mockReturnValue("plans-collection");
      mockAddDoc.mockResolvedValue({ id: "plan-1" });

      await createPlan(planInput);

      const data = vi.mocked(mockAddDoc).mock.calls[0][1];
      expect(data.name).toBe("New Commission Plan");
      expect(data.type).toBe("tiered");
      expect(data.brokerId).toBe("broker-1");
      expect(data.rules).toEqual({
        tiers: [
          { minVolume: 0, percent: 2 },
          { minVolume: 1000000, percent: 3 },
        ],
      });
      expect(data.assignedTo).toEqual(["agent-1"]);
      expect(data.createdAt).toEqual(expect.any(Number));
      expect(data.updatedAt).toEqual(expect.any(Number));
    });

    it("should not include id in the document data", async () => {
      mockCollection.mockReturnValue("plans-collection");
      mockAddDoc.mockResolvedValue({ id: "plan-1" });

      await createPlan(planInput);

      const data = vi.mocked(mockAddDoc).mock.calls[0][1];
      expect(data).not.toHaveProperty("id");
    });
  });

  // ─── updatePlan ──────────────────────────────────────────────────

  describe("updatePlan", () => {
    it("should update the document with partial data and set updatedAt", async () => {
      mockDoc.mockReturnValue({ id: "plan-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updatePlan("plan-1", { name: "Updated Plan Name" });

      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        "commissionPlans",
        "plan-1",
      );
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        { id: "plan-1" },
        expect.objectContaining({
          name: "Updated Plan Name",
          updatedAt: expect.any(Number),
        }),
      );
    });

    it("should merge data without removing existing fields", async () => {
      mockDoc.mockReturnValue({ id: "plan-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updatePlan("plan-1", { type: "referral" });

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data).toHaveProperty("type", "referral");
      expect(data).toHaveProperty("updatedAt");
      expect(Object.keys(data)).toEqual(["type", "updatedAt"]);
    });

    it("should allow empty partial update", async () => {
      mockDoc.mockReturnValue({ id: "plan-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updatePlan("plan-1", {});

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data).toEqual({ updatedAt: expect.any(Number) });
    });

    it("should update nested rules object", async () => {
      mockDoc.mockReturnValue({ id: "plan-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updatePlan("plan-1", {
        rules: { percent: 5 },
      });

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data.rules).toEqual({ percent: 5 });
    });

    it("should update assignedTo array", async () => {
      mockDoc.mockReturnValue({ id: "plan-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updatePlan("plan-1", { assignedTo: ["agent-3", "agent-4"] });

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data.assignedTo).toEqual(["agent-3", "agent-4"]);
    });
  });

  // ─── deletePlan ──────────────────────────────────────────────────

  describe("deletePlan", () => {
    it("should delete the document by planId", async () => {
      mockDoc.mockReturnValue({ id: "plan-to-delete" });
      mockDeleteDoc.mockResolvedValue(undefined);

      await deletePlan("plan-to-delete");

      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        "commissionPlans",
        "plan-to-delete",
      );
      expect(mockDeleteDoc).toHaveBeenCalledWith({ id: "plan-to-delete" });
      expect(mockDeleteDoc).toHaveBeenCalledOnce();
    });
  });
});
