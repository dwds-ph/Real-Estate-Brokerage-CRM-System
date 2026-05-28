import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import {
  subscribeActivityForLead,
  subscribeActivityForDeal,
  subscribeRecentActivity,
  createActivityLog,
  deleteActivityLog,
} from "@/services/activityService";
import type { ActivityLog } from "@/types";

// ─── Mock firebase/firestore ─────────────────────────────────────────

const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockOnSnapshot = vi.fn();
const mockAddDoc = vi.fn();
const mockDeleteDoc = vi.fn();

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  limit: (...args: unknown[]) => mockLimit(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
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

function sampleActivityLog(overrides: Partial<ActivityLog> = {}): ActivityLog {
  return {
    id: "log-1",
    type: "note",
    title: "Called client",
    description: "Discussed property options",
    leadId: "lead-1",
    dealId: undefined,
    listingId: undefined,
    createdBy: "user-1",
    createdByName: "Alice",
    duration: undefined,
    createdAt: Date.now() - 60000,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────

describe("activityService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── subscribeActivityForLead ────────────────────────────────────

  describe("subscribeActivityForLead", () => {
    it("should return a noop unsubscribe when leadId is undefined", () => {
      const unsub = subscribeActivityForLead(undefined);
      expect(unsub).toBeInstanceOf(Function);
      expect(mockCollection).not.toHaveBeenCalled();
      expect(mockQuery).not.toHaveBeenCalled();
      expect(mockOnSnapshot).not.toHaveBeenCalled();
    });

    it("should subscribe to activity logs for the given leadId", () => {
      mockCollection.mockReturnValue("activity-collection");
      mockWhere.mockReturnValue("where-leadId");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockLimit.mockReturnValue("limit-50");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      subscribeActivityForLead("lead-1", vi.fn());

      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        "activityLogs",
      );
      expect(mockWhere).toHaveBeenCalledWith("leadId", "==", "lead-1");
      expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
      expect(mockLimit).toHaveBeenCalledWith(50);
      expect(mockQuery).toHaveBeenCalledWith(
        "activity-collection",
        "where-leadId",
        "orderBy-createdAt-desc",
        "limit-50",
      );
      expect(mockOnSnapshot).toHaveBeenCalledWith(
        "query-ref",
        expect.any(Function),
      );
    });

    it("should map snapshot docs to ActivityLog objects and invoke callback", () => {
      mockCollection.mockReturnValue("activity-collection");
      mockWhere.mockReturnValue("where-leadId");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockLimit.mockReturnValue("limit-50");
      mockQuery.mockReturnValue("query-ref");

      const snapshot = makeMockSnapshot([
        {
          id: "a1",
          data: () => ({ type: "call", title: "Call log", createdBy: "u1" }),
        },
        {
          id: "a2",
          data: () => ({ type: "note", title: "Note entry", createdBy: "u2" }),
        },
      ]);

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(snapshot);
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeActivityForLead("lead-1", callback);

      expect(callback).toHaveBeenCalledWith([
        { id: "a1", type: "call", title: "Call log", createdBy: "u1" },
        { id: "a2", type: "note", title: "Note entry", createdBy: "u2" },
      ]);
    });

    it("should not invoke callback if none provided", () => {
      mockCollection.mockReturnValue("activity-collection");
      mockWhere.mockReturnValue("where-leadId");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockLimit.mockReturnValue("limit-50");
      mockQuery.mockReturnValue("query-ref");

      const snapshot = makeMockSnapshot([
        { id: "a1", data: () => ({ type: "note", title: "Test" }) },
      ]);

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(snapshot);
        return vi.fn();
      });

      expect(() => {
        subscribeActivityForLead("lead-1");
      }).not.toThrow();
    });

    it("should handle empty snapshot gracefully", () => {
      mockCollection.mockReturnValue("activity-collection");
      mockWhere.mockReturnValue("where-leadId");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockLimit.mockReturnValue("limit-50");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeActivityForLead("lead-1", callback);

      expect(callback).toHaveBeenCalledWith([]);
    });

    it("should return the unsubscribe function from onSnapshot", () => {
      mockCollection.mockReturnValue("activity-collection");
      mockWhere.mockReturnValue("where-leadId");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockLimit.mockReturnValue("limit-50");
      mockQuery.mockReturnValue("query-ref");

      const mockUnsub = vi.fn();
      mockOnSnapshot.mockReturnValue(mockUnsub);

      const unsub = subscribeActivityForLead("lead-1", vi.fn());
      expect(unsub).toBe(mockUnsub);
    });
  });

  // ─── subscribeActivityForDeal ────────────────────────────────────

  describe("subscribeActivityForDeal", () => {
    it("should return a noop unsubscribe when dealId is undefined", () => {
      const unsub = subscribeActivityForDeal(undefined);
      expect(unsub).toBeInstanceOf(Function);
      expect(mockCollection).not.toHaveBeenCalled();
      expect(mockQuery).not.toHaveBeenCalled();
      expect(mockOnSnapshot).not.toHaveBeenCalled();
    });

    it("should subscribe to activity logs for the given dealId", () => {
      mockCollection.mockReturnValue("activity-collection");
      mockWhere.mockReturnValue("where-dealId");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockLimit.mockReturnValue("limit-50");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      subscribeActivityForDeal("deal-1", vi.fn());

      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        "activityLogs",
      );
      expect(mockWhere).toHaveBeenCalledWith("dealId", "==", "deal-1");
      expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
      expect(mockLimit).toHaveBeenCalledWith(50);
      expect(mockQuery).toHaveBeenCalledWith(
        "activity-collection",
        "where-dealId",
        "orderBy-createdAt-desc",
        "limit-50",
      );
      expect(mockOnSnapshot).toHaveBeenCalledWith(
        "query-ref",
        expect.any(Function),
      );
    });

    it("should map snapshot and invoke callback", () => {
      mockCollection.mockReturnValue("activity-collection");
      mockWhere.mockReturnValue("where-dealId");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockLimit.mockReturnValue("limit-50");
      mockQuery.mockReturnValue("query-ref");

      const snapshot = makeMockSnapshot([
        {
          id: "a1",
          data: () => ({
            type: "email",
            title: "Sent proposal",
            createdBy: "u1",
          }),
        },
      ]);

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(snapshot);
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeActivityForDeal("deal-1", callback);

      expect(callback).toHaveBeenCalledWith([
        { id: "a1", type: "email", title: "Sent proposal", createdBy: "u1" },
      ]);
    });

    it("should handle empty snapshot", () => {
      mockCollection.mockReturnValue("activity-collection");
      mockWhere.mockReturnValue("where-dealId");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockLimit.mockReturnValue("limit-50");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeActivityForDeal("deal-1", callback);

      expect(callback).toHaveBeenCalledWith([]);
    });

    it("should not throw when callback is undefined", () => {
      mockCollection.mockReturnValue("activity-collection");
      mockWhere.mockReturnValue("where-dealId");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockLimit.mockReturnValue("limit-50");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      expect(() => {
        subscribeActivityForDeal("deal-1");
      }).not.toThrow();
    });

    it("should return the unsubscribe function", () => {
      mockCollection.mockReturnValue("activity-collection");
      mockWhere.mockReturnValue("where-dealId");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockLimit.mockReturnValue("limit-50");
      mockQuery.mockReturnValue("query-ref");

      const mockUnsub = vi.fn();
      mockOnSnapshot.mockReturnValue(mockUnsub);

      const unsub = subscribeActivityForDeal("deal-1", vi.fn());
      expect(unsub).toBe(mockUnsub);
    });
  });

  // ─── subscribeRecentActivity ─────────────────────────────────────

  describe("subscribeRecentActivity", () => {
    it("should return a noop unsubscribe when brokerId is undefined", () => {
      const unsub = subscribeRecentActivity(undefined);
      expect(unsub).toBeInstanceOf(Function);
      expect(mockCollection).not.toHaveBeenCalled();
      expect(mockQuery).not.toHaveBeenCalled();
      expect(mockOnSnapshot).not.toHaveBeenCalled();
    });

    it("should subscribe to recent activity for the given brokerId", () => {
      mockCollection.mockReturnValue("activity-collection");
      mockWhere.mockReturnValue("where-brokerId");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockLimit.mockReturnValue("limit-20");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      subscribeRecentActivity("broker-1", vi.fn());

      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        "activityLogs",
      );
      expect(mockWhere).toHaveBeenCalledWith("createdBy", "==", "broker-1");
      expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
      expect(mockLimit).toHaveBeenCalledWith(20);
      expect(mockQuery).toHaveBeenCalledWith(
        "activity-collection",
        "where-brokerId",
        "orderBy-createdAt-desc",
        "limit-20",
      );
      expect(mockOnSnapshot).toHaveBeenCalledWith(
        "query-ref",
        expect.any(Function),
      );
    });

    it("should map snapshot and invoke callback", () => {
      mockCollection.mockReturnValue("activity-collection");
      mockWhere.mockReturnValue("where-brokerId");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockLimit.mockReturnValue("limit-20");
      mockQuery.mockReturnValue("query-ref");

      const snapshot = makeMockSnapshot([
        {
          id: "a1",
          data: () => ({
            type: "status_change",
            title: "Status updated",
            createdBy: "broker-1",
          }),
        },
        {
          id: "a2",
          data: () => ({
            type: "meeting",
            title: "Client meeting",
            createdBy: "broker-1",
          }),
        },
        {
          id: "a3",
          data: () => ({
            type: "note",
            title: "Quick note",
            createdBy: "broker-1",
          }),
        },
      ]);

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(snapshot);
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeRecentActivity("broker-1", callback);

      expect(callback).toHaveBeenCalledWith([
        {
          id: "a1",
          type: "status_change",
          title: "Status updated",
          createdBy: "broker-1",
        },
        {
          id: "a2",
          type: "meeting",
          title: "Client meeting",
          createdBy: "broker-1",
        },
        { id: "a3", type: "note", title: "Quick note", createdBy: "broker-1" },
      ]);
    });

    it("should handle empty snapshot", () => {
      mockCollection.mockReturnValue("activity-collection");
      mockWhere.mockReturnValue("where-brokerId");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockLimit.mockReturnValue("limit-20");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeRecentActivity("broker-1", callback);

      expect(callback).toHaveBeenCalledWith([]);
    });

    it("should not throw when callback is undefined", () => {
      mockCollection.mockReturnValue("activity-collection");
      mockWhere.mockReturnValue("where-brokerId");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockLimit.mockReturnValue("limit-20");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      expect(() => {
        subscribeRecentActivity("broker-1");
      }).not.toThrow();
    });

    it("should return the unsubscribe function", () => {
      mockCollection.mockReturnValue("activity-collection");
      mockWhere.mockReturnValue("where-brokerId");
      mockOrderBy.mockReturnValue("orderBy-createdAt-desc");
      mockLimit.mockReturnValue("limit-20");
      mockQuery.mockReturnValue("query-ref");

      const mockUnsub = vi.fn();
      mockOnSnapshot.mockReturnValue(mockUnsub);

      const unsub = subscribeRecentActivity("broker-1", vi.fn());
      expect(unsub).toBe(mockUnsub);
    });
  });

  // ─── createActivityLog ───────────────────────────────────────────

  describe("createActivityLog", () => {
    const logInput = {
      type: "call" as const,
      title: "Client follow-up call",
      description: "Discussed terms",
      leadId: "lead-1",
      dealId: undefined as string | undefined,
      listingId: undefined as string | undefined,
      createdBy: "user-1",
      createdByName: "Alice",
      duration: 15,
    };

    it("should add a document with createdAt timestamp and return the new id", async () => {
      mockCollection.mockReturnValue("activity-collection");
      mockAddDoc.mockResolvedValue({ id: "new-log-id" });

      const id = await createActivityLog(logInput);

      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        "activityLogs",
      );
      expect(mockAddDoc).toHaveBeenCalledWith(
        "activity-collection",
        expect.objectContaining({
          ...logInput,
          createdAt: expect.any(Number),
        }),
      );
      expect(id).toBe("new-log-id");
    });

    it("should pass all provided fields to addDoc", async () => {
      mockCollection.mockReturnValue("activity-collection");
      mockAddDoc.mockResolvedValue({ id: "log-1" });

      await createActivityLog(logInput);

      const data = vi.mocked(mockAddDoc).mock.calls[0][1];
      expect(data.type).toBe("call");
      expect(data.title).toBe("Client follow-up call");
      expect(data.description).toBe("Discussed terms");
      expect(data.leadId).toBe("lead-1");
      expect(data.dealId).toBeUndefined();
      expect(data.listingId).toBeUndefined();
      expect(data.createdBy).toBe("user-1");
      expect(data.createdByName).toBe("Alice");
      expect(data.duration).toBe(15);
      expect(data.createdAt).toEqual(expect.any(Number));
    });

    it("should not include id in the document data", async () => {
      mockCollection.mockReturnValue("activity-collection");
      mockAddDoc.mockResolvedValue({ id: "log-1" });

      await createActivityLog(logInput);

      const data = vi.mocked(mockAddDoc).mock.calls[0][1];
      expect(data).not.toHaveProperty("id");
    });
  });

  // ─── deleteActivityLog ───────────────────────────────────────────

  describe("deleteActivityLog", () => {
    it("should delete the document by logId", async () => {
      mockDoc.mockReturnValue({ id: "log-to-delete" });
      mockDeleteDoc.mockResolvedValue(undefined);

      await deleteActivityLog("log-to-delete");

      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        "activityLogs",
        "log-to-delete",
      );
      expect(mockDeleteDoc).toHaveBeenCalledWith({ id: "log-to-delete" });
      expect(mockDeleteDoc).toHaveBeenCalledOnce();
    });
  });
});
