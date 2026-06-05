import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  subscribeGoals,
  createGoal,
  updateGoal,
  deleteGoal,
} from "@/services/goalService";

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
  COLLECTIONS: { GOALS: "goals" },
}));

vi.mock("@/lib/firebase", () => ({ db: {} }));

// ─── Tests ────────────────────────────────────────────────────────────

describe("goalService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── subscribeGoals ─────────────────────────────────────────────

  describe("subscribeGoals", () => {
    it("should return a noop unsubscribe when brokerId is undefined", () => {
      const unsub = subscribeGoals(undefined, vi.fn());
      expect(unsub).toBeInstanceOf(Function);
      expect(mockSubscribeToQuery).not.toHaveBeenCalled();
    });

    it("should subscribe to goals collection with a callback", () => {
      subscribeGoals("broker-1", vi.fn());

      expect(mockSubscribeToQuery).toHaveBeenCalledWith(
        "goals",
        expect.any(Array),
        expect.any(Function),
      );
    });

    it("should pass a non-empty constraints array", () => {
      subscribeGoals("broker-1", vi.fn());

      const constraints = mockSubscribeToQuery.mock.calls[0][1];
      expect(Array.isArray(constraints)).toBe(true);
      expect(constraints.length).toBeGreaterThan(0);
    });

    it("should pass the callback to subscribeToQuery", () => {
      const callback = vi.fn();
      subscribeGoals("broker-1", callback);

      expect(mockSubscribeToQuery).toHaveBeenCalledWith(
        "goals",
        expect.any(Array),
        callback,
      );
    });

    it("should return the unsubscribe function from subscribeToQuery", () => {
      const mockUnsub = vi.fn();
      mockSubscribeToQuery.mockReturnValue(mockUnsub);

      const unsub = subscribeGoals("broker-1", vi.fn());
      expect(unsub).toBe(mockUnsub);
    });

    it("should handle empty brokerId gracefully", () => {
      const unsub = subscribeGoals(undefined, vi.fn());
      expect(unsub).toBeInstanceOf(Function);
    });
  });

  // ─── createGoal ─────────────────────────────────────────────────

  describe("createGoal", () => {
    const goalInput = {
      agentId: "agent-1",
      agentName: "Maria Santos",
      period: "monthly" as const,
      periodStart: Date.parse("2026-01-01"),
      periodEnd: Date.parse("2026-01-31"),
      targetDeals: 3,
      targetCommission: 150000,
      createdBy: "user-1",
    };

    it("should create a document and return the new id", async () => {
      mockCreateDocument.mockResolvedValue("new-goal-id");

      const id = await createGoal(goalInput);

      expect(mockCreateDocument).toHaveBeenCalledWith("goals", goalInput);
      expect(id).toBe("new-goal-id");
    });

    it("should pass all fields to createDocument", async () => {
      mockCreateDocument.mockResolvedValue("id");

      await createGoal(goalInput);

      const data = vi.mocked(mockCreateDocument).mock.calls[0][1];
      expect(data).toMatchObject(goalInput);
    });

    it("should handle quarterly period", async () => {
      mockCreateDocument.mockResolvedValue("id");

      const quarterlyInput = {
        ...goalInput,
        period: "quarterly" as const,
        periodStart: Date.parse("2026-01-01"),
        periodEnd: Date.parse("2026-03-31"),
        targetDeals: 10,
        targetCommission: 500000,
      };

      await createGoal(quarterlyInput);

      const data = vi.mocked(mockCreateDocument).mock.calls[0][1];
      expect(data.period).toBe("quarterly");
      expect(data.targetDeals).toBe(10);
    });

    it("should handle yearly period", async () => {
      mockCreateDocument.mockResolvedValue("id");

      const yearlyInput = {
        ...goalInput,
        period: "yearly" as const,
        periodStart: Date.parse("2026-01-01"),
        periodEnd: Date.parse("2026-12-31"),
        targetDeals: 40,
        targetCommission: 2000000,
      };

      await createGoal(yearlyInput);

      const data = vi.mocked(mockCreateDocument).mock.calls[0][1];
      expect(data.period).toBe("yearly");
      expect(data.targetCommission).toBe(2000000);
    });

    it("should handle error from createDocument", async () => {
      mockCreateDocument.mockRejectedValue(new Error("Firestore error"));

      await expect(createGoal(goalInput)).rejects.toThrow("Firestore error");
    });
  });

  // ─── updateGoal ─────────────────────────────────────────────────

  describe("updateGoal", () => {
    it("should update the document with partial data", async () => {
      mockUpdateDocument.mockResolvedValue(undefined);

      await updateGoal("goal-1", {
        targetDeals: 5,
        targetCommission: 300000,
      });

      expect(mockUpdateDocument).toHaveBeenCalledWith("goals", "goal-1", {
        targetDeals: 5,
        targetCommission: 300000,
      });
    });

    it("should allow updating a single field", async () => {
      mockUpdateDocument.mockResolvedValue(undefined);

      await updateGoal("goal-1", { targetDeals: 10 });

      expect(mockUpdateDocument).toHaveBeenCalledWith("goals", "goal-1", {
        targetDeals: 10,
      });
    });

    it("should handle error from updateDocument", async () => {
      mockUpdateDocument.mockRejectedValue(new Error("Update failed"));

      await expect(
        updateGoal("goal-1", { targetCommission: 100 }),
      ).rejects.toThrow("Update failed");
    });
  });

  // ─── deleteGoal ─────────────────────────────────────────────────

  describe("deleteGoal", () => {
    it("should delete the document by id", async () => {
      mockDeleteDocument.mockResolvedValue(undefined);

      await deleteGoal("goal-to-delete");

      expect(mockDeleteDocument).toHaveBeenCalledWith("goals", "goal-to-delete");
    });

    it("should resolve successfully", async () => {
      mockDeleteDocument.mockResolvedValue(undefined);

      await expect(deleteGoal("goal-1")).resolves.toBeUndefined();
    });

    it("should handle error from deleteDocument", async () => {
      mockDeleteDocument.mockRejectedValue(new Error("Delete failed"));

      await expect(deleteGoal("goal-1")).rejects.toThrow("Delete failed");
    });
  });
});
