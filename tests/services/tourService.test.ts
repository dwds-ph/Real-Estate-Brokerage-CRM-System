import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import {
  subscribeToursForAgent,
  subscribeToursForBroker,
  subscribeToursByStatus,
  createTour,
  updateTour,
  deleteTour,
  updateTourStatus,
  getTourStatusColor,
  getTourStatusLabel,
  getTotalTourDuration,
  formatDuration,
  generateGoogleMapsUrl,
} from "@/services/tourService";
import type { Tour, TourStatus, TourStop } from "@/types";

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

// @/lib/firebase is already mocked in test-setup.ts with db: {},
// but re-declaring avoids reliance on order-of-setup.
vi.mock("@/lib/firebase", () => ({
  db: {},
}));

// ─── Helpers ─────────────────────────────────────────────────────────

const now = Date.now();

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

function sampleTourStop(overrides: Partial<TourStop> = {}): TourStop {
  return {
    id: "stop-1",
    listingId: "listing-1",
    listingTitle: "Modern Condo Unit",
    listingAddress: "123 Main St, Makati",
    order: 1,
    estimatedDuration: 30,
    scheduledTime: now + 3600000,
    driveTime: 15,
    notes: "Bring keys",
    ...overrides,
  };
}

function sampleTour(overrides: Partial<Tour> = {}): Tour {
  return {
    id: "tour-1",
    title: "Client Property Tour",
    clientName: "Juan Dela Cruz",
    clientContact: "+639123456789",
    clientEmail: "juan@example.com",
    leadId: "lead-1",
    agentId: "agent-1",
    scheduledDate: now + 86400000,
    status: "confirmed",
    notes: "Client prefers high-floor units",
    stops: [sampleTourStop()],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────

describe("tourService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── subscribeToursForAgent ──────────────────────────────────────

  describe("subscribeToursForAgent", () => {
    it("should return a noop unsubscribe when agentId is undefined", () => {
      const unsub = subscribeToursForAgent(undefined, vi.fn());
      expect(unsub).toBeInstanceOf(Function);
      expect(mockCollection).not.toHaveBeenCalled();
      expect(mockQuery).not.toHaveBeenCalled();
      expect(mockOnSnapshot).not.toHaveBeenCalled();
    });

    it("should query tours filtered by agentId and ordered by scheduledDate", () => {
      mockCollection.mockReturnValue("tours-collection");
      mockWhere.mockImplementation((field, op, val) => ({ field, op, val }));
      mockOrderBy.mockReturnValue("orderBy-scheduledDate-desc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      const callback = vi.fn();
      subscribeToursForAgent("agent-1", callback);

      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "tours");
      expect(mockWhere).toHaveBeenCalledWith("agentId", "==", "agent-1");
      expect(mockOrderBy).toHaveBeenCalledWith("scheduledDate", "desc");
      expect(mockQuery).toHaveBeenCalledWith(
        "tours-collection",
        expect.objectContaining({ field: "agentId", op: "==", val: "agent-1" }),
        "orderBy-scheduledDate-desc",
      );
      expect(mockOnSnapshot).toHaveBeenCalledWith(
        "query-ref",
        expect.any(Function),
        expect.any(Function),
      );
    });

    it("should map snapshot docs to Tour objects and invoke callback", () => {
      mockCollection.mockReturnValue("tours-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-scheduledDate-desc");
      mockQuery.mockReturnValue("query-ref");

      const snapshot = makeMockSnapshot([
        { id: "t1", data: () => ({ title: "Tour A", status: "confirmed" }) },
        { id: "t2", data: () => ({ title: "Tour B", status: "draft" }) },
      ]);

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(snapshot);
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeToursForAgent("agent-1", callback);

      expect(callback).toHaveBeenCalledWith([
        { id: "t1", title: "Tour A", status: "confirmed" },
        { id: "t2", title: "Tour B", status: "draft" },
      ]);
    });

    it("should invoke onError when snapshot listener errors", () => {
      mockCollection.mockReturnValue("tours-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-scheduledDate-desc");
      mockQuery.mockReturnValue("query-ref");

      const testError = new Error("Firestore permission denied");
      mockOnSnapshot.mockImplementation(
        (
          _q: unknown,
          _onNext: (s: unknown) => void,
          onError: (e: Error) => void,
        ) => {
          onError(testError);
          return vi.fn();
        },
      );

      const callback = vi.fn();
      const onError = vi.fn();
      subscribeToursForAgent("agent-1", callback, onError);

      expect(onError).toHaveBeenCalledWith("Firestore permission denied");
    });

    it("should not throw when onError is undefined and an error occurs", () => {
      mockCollection.mockReturnValue("tours-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-scheduledDate-desc");
      mockQuery.mockReturnValue("query-ref");

      const testError = new Error("Some error");
      mockOnSnapshot.mockImplementation(
        (
          _q: unknown,
          _onNext: (s: unknown) => void,
          onError: (e: Error) => void,
        ) => {
          onError(testError);
          return vi.fn();
        },
      );

      expect(() => {
        subscribeToursForAgent("agent-1", vi.fn());
      }).not.toThrow();
    });

    it("should handle empty snapshot gracefully", () => {
      mockCollection.mockReturnValue("tours-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-scheduledDate-desc");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeToursForAgent("agent-1", callback);

      expect(callback).toHaveBeenCalledWith([]);
    });

    it("should return the unsubscribe function from onSnapshot", () => {
      mockCollection.mockReturnValue("tours-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-scheduledDate-desc");
      mockQuery.mockReturnValue("query-ref");

      const mockUnsub = vi.fn();
      mockOnSnapshot.mockReturnValue(mockUnsub);

      const unsub = subscribeToursForAgent("agent-1", vi.fn());
      expect(unsub).toBe(mockUnsub);
    });
  });

  // ─── subscribeToursForBroker ─────────────────────────────────────

  describe("subscribeToursForBroker", () => {
    it("should query all tours ordered by scheduledDate", () => {
      mockCollection.mockReturnValue("tours-collection");
      mockOrderBy.mockReturnValue("orderBy-scheduledDate-desc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      const callback = vi.fn();
      subscribeToursForBroker(callback);

      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "tours");
      expect(mockOrderBy).toHaveBeenCalledWith("scheduledDate", "desc");
      expect(mockQuery).toHaveBeenCalledWith(
        "tours-collection",
        "orderBy-scheduledDate-desc",
      );
      expect(mockOnSnapshot).toHaveBeenCalledWith(
        "query-ref",
        expect.any(Function),
        expect.any(Function),
      );
    });

    it("should not filter by where when querying for broker", () => {
      mockCollection.mockReturnValue("tours-collection");
      mockOrderBy.mockReturnValue("orderBy-scheduledDate-desc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      subscribeToursForBroker(vi.fn());

      expect(mockWhere).not.toHaveBeenCalled();
    });

    it("should map snapshot and invoke callback", () => {
      mockCollection.mockReturnValue("tours-collection");
      mockOrderBy.mockReturnValue("orderBy-scheduledDate-desc");
      mockQuery.mockReturnValue("query-ref");

      const snapshot = makeMockSnapshot([
        {
          id: "t1",
          data: () => ({ title: "Broker Tour", status: "completed" }),
        },
      ]);

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(snapshot);
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeToursForBroker(callback);

      expect(callback).toHaveBeenCalledWith([
        { id: "t1", title: "Broker Tour", status: "completed" },
      ]);
    });

    it("should invoke onError when an error occurs", () => {
      mockCollection.mockReturnValue("tours-collection");
      mockOrderBy.mockReturnValue("orderBy-scheduledDate-desc");
      mockQuery.mockReturnValue("query-ref");

      const testError = new Error("Network error");
      mockOnSnapshot.mockImplementation(
        (
          _q: unknown,
          _onNext: (s: unknown) => void,
          onError: (e: Error) => void,
        ) => {
          onError(testError);
          return vi.fn();
        },
      );

      const onError = vi.fn();
      subscribeToursForBroker(vi.fn(), onError);

      expect(onError).toHaveBeenCalledWith("Network error");
    });

    it("should handle empty snapshot", () => {
      mockCollection.mockReturnValue("tours-collection");
      mockOrderBy.mockReturnValue("orderBy-scheduledDate-desc");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeToursForBroker(callback);

      expect(callback).toHaveBeenCalledWith([]);
    });
  });

  // ─── subscribeToursByStatus ─────────────────────────────────────

  describe("subscribeToursByStatus", () => {
    it("should query tours filtered by status and ordered by scheduledDate", () => {
      mockCollection.mockReturnValue("tours-collection");
      mockWhere.mockImplementation((field, op, val) => ({ field, op, val }));
      mockOrderBy.mockReturnValue("orderBy-scheduledDate-desc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      subscribeToursByStatus("in-progress", vi.fn());

      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "tours");
      expect(mockWhere).toHaveBeenCalledWith("status", "==", "in-progress");
      expect(mockOrderBy).toHaveBeenCalledWith("scheduledDate", "desc");
      expect(mockQuery).toHaveBeenCalledWith(
        "tours-collection",
        expect.objectContaining({
          field: "status",
          op: "==",
          val: "in-progress",
        }),
        "orderBy-scheduledDate-desc",
      );
      expect(mockOnSnapshot).toHaveBeenCalledWith(
        "query-ref",
        expect.any(Function),
        expect.any(Function),
      );
    });

    it("should map snapshot and invoke callback", () => {
      mockCollection.mockReturnValue("tours-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-scheduledDate-desc");
      mockQuery.mockReturnValue("query-ref");

      const snapshot = makeMockSnapshot([
        {
          id: "t1",
          data: () => ({ title: "In Progress Tour", status: "in-progress" }),
        },
      ]);

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(snapshot);
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeToursByStatus("in-progress", callback);

      expect(callback).toHaveBeenCalledWith([
        { id: "t1", title: "In Progress Tour", status: "in-progress" },
      ]);
    });

    it("should handle empty snapshot", () => {
      mockCollection.mockReturnValue("tours-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-scheduledDate-desc");
      mockQuery.mockReturnValue("query-ref");

      mockOnSnapshot.mockImplementation((_q, onNext: (s: unknown) => void) => {
        onNext(makeMockSnapshot([]));
        return vi.fn();
      });

      const callback = vi.fn();
      subscribeToursByStatus("completed", callback);

      expect(callback).toHaveBeenCalledWith([]);
    });

    it("can filter by each tour status", () => {
      mockCollection.mockReturnValue("tours-collection");
      mockWhere.mockReturnValue("where-constraint");
      mockOrderBy.mockReturnValue("orderBy-scheduledDate-desc");
      mockQuery.mockReturnValue("query-ref");
      mockOnSnapshot.mockReturnValue(vi.fn());

      const statuses: TourStatus[] = [
        "draft",
        "confirmed",
        "in-progress",
        "completed",
        "cancelled",
      ];

      for (const status of statuses) {
        subscribeToursByStatus(status, vi.fn());
        expect(mockWhere).toHaveBeenCalledWith("status", "==", status);
      }
    });
  });

  // ─── createTour ────────────────────────────────────────────────

  describe("createTour", () => {
    const tourInput = {
      title: "New Property Tour",
      clientName: "Maria Santos",
      clientContact: "+639987654321",
      clientEmail: "maria@example.com",
      leadId: "lead-2",
      agentId: "agent-1",
      scheduledDate: now + 172800000,
      status: "draft" as TourStatus,
      notes: "First time buyer",
      stops: [sampleTourStop({ id: "stop-new", order: 1 })],
    };

    it("should add a document with timestamps and return the new id", async () => {
      mockCollection.mockReturnValue("tours-collection");
      mockAddDoc.mockResolvedValue({ id: "new-tour-id" });

      const id = await createTour(tourInput);

      expect(mockCollection).toHaveBeenCalledWith(expect.anything(), "tours");
      expect(mockAddDoc).toHaveBeenCalledWith(
        "tours-collection",
        expect.objectContaining({
          ...tourInput,
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number),
        }),
      );
      expect(id).toBe("new-tour-id");
    });

    it("should set createdAt and updatedAt to the same timestamp", async () => {
      mockCollection.mockReturnValue("tours-collection");
      mockAddDoc.mockImplementation((_col, data: Record<string, unknown>) => {
        expect(data.createdAt).toEqual(data.updatedAt);
        expect(data.createdAt).toEqual(expect.any(Number));
        return { id: "tour-123" };
      });

      await createTour(tourInput);
    });

    it("should pass all provided fields to addDoc", async () => {
      mockCollection.mockReturnValue("tours-collection");
      mockAddDoc.mockResolvedValue({ id: "tour-1" });

      await createTour(tourInput);

      const data = vi.mocked(mockAddDoc).mock.calls[0][1];
      expect(data.title).toBe("New Property Tour");
      expect(data.clientName).toBe("Maria Santos");
      expect(data.clientContact).toBe("+639987654321");
      expect(data.clientEmail).toBe("maria@example.com");
      expect(data.leadId).toBe("lead-2");
      expect(data.agentId).toBe("agent-1");
      expect(data.status).toBe("draft");
      expect(data.notes).toBe("First time buyer");
      expect(data.stops).toHaveLength(1);
      expect(data.stops[0]).toMatchObject({
        id: "stop-new",
        listingAddress: "123 Main St, Makati",
      });
    });

    it("should allow creating a tour without optional fields", async () => {
      mockCollection.mockReturnValue("tours-collection");
      mockAddDoc.mockResolvedValue({ id: "tour-min" });

      const minimalInput = {
        title: "Minimal Tour",
        clientName: "Client",
        agentId: "agent-1",
        scheduledDate: now,
        status: "draft" as TourStatus,
        stops: [] as TourStop[],
      };

      await createTour(minimalInput);

      const data = vi.mocked(mockAddDoc).mock.calls[0][1];
      expect(data.title).toBe("Minimal Tour");
      expect(data.stops).toEqual([]);
    });
  });

  // ─── updateTour ─────────────────────────────────────────────────

  describe("updateTour", () => {
    it("should update the document with partial data and set updatedAt", async () => {
      mockDoc.mockReturnValue({ id: "tour-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateTour("tour-1", {
        title: "Updated Tour Title",
        notes: "Updated notes",
      });

      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        "tours",
        "tour-1",
      );
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        { id: "tour-1" },
        expect.objectContaining({
          title: "Updated Tour Title",
          notes: "Updated notes",
          updatedAt: expect.any(Number),
        }),
      );
    });

    it("should merge data without removing existing fields", async () => {
      mockDoc.mockReturnValue({ id: "tour-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateTour("tour-1", { status: "completed" });

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data).toHaveProperty("status", "completed");
      expect(data).toHaveProperty("updatedAt");
      expect(Object.keys(data)).toEqual(["status", "updatedAt"]);
    });

    it("should allow empty partial update", async () => {
      mockDoc.mockReturnValue({ id: "tour-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateTour("tour-1", {});

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data).toEqual({ updatedAt: expect.any(Number) });
    });

    it("should allow updating stops array", async () => {
      mockDoc.mockReturnValue({ id: "tour-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      const newStops = [
        sampleTourStop({ id: "stop-a", order: 1 }),
        sampleTourStop({
          id: "stop-b",
          order: 2,
          listingAddress: "456 Elm St",
        }),
      ];

      await updateTour("tour-1", { stops: newStops });

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(data.stops).toHaveLength(2);
      expect(data.stops[1].listingAddress).toBe("456 Elm St");
    });
  });

  // ─── deleteTour ─────────────────────────────────────────────────

  describe("deleteTour", () => {
    it("should delete the document by tourId", async () => {
      mockDoc.mockReturnValue({ id: "tour-to-delete" });
      mockDeleteDoc.mockResolvedValue(undefined);

      await deleteTour("tour-to-delete");

      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        "tours",
        "tour-to-delete",
      );
      expect(mockDeleteDoc).toHaveBeenCalledWith({ id: "tour-to-delete" });
      expect(mockDeleteDoc).toHaveBeenCalledOnce();
    });
  });

  // ─── updateTourStatus ───────────────────────────────────────────

  describe("updateTourStatus", () => {
    it.each([
      ["draft", "confirmed"],
      ["confirmed", "in-progress"],
      ["in-progress", "completed"],
      ["confirmed", "cancelled"],
      ["draft", "cancelled"],
      ["completed", "cancelled"],
    ] as Array<[TourStatus, TourStatus]>)(
      "should transition from %s to %s",
      async (from, to) => {
        mockDoc.mockReturnValue({ id: "tour-1" });
        mockUpdateDoc.mockResolvedValue(undefined);

        await updateTourStatus("tour-1", to);

        expect(mockDoc).toHaveBeenCalledWith(
          expect.anything(),
          "tours",
          "tour-1",
        );
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          { id: "tour-1" },
          expect.objectContaining({
            status: to,
            updatedAt: expect.any(Number),
          }),
        );
      },
    );

    it("should only set status and updatedAt", async () => {
      mockDoc.mockReturnValue({ id: "tour-1" });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateTourStatus("tour-1", "completed");

      const data = vi.mocked(mockUpdateDoc).mock.calls[0][1];
      expect(Object.keys(data)).toEqual(["status", "updatedAt"]);
    });
  });

  // ─── getTourStatusColor ─────────────────────────────────────────

  describe("getTourStatusColor", () => {
    it("should return correct color for draft status", () => {
      const color = getTourStatusColor("draft");
      expect(color).toContain("bg-gray-100");
      expect(color).toContain("text-gray-700");
    });

    it("should return correct color for confirmed status", () => {
      const color = getTourStatusColor("confirmed");
      expect(color).toContain("bg-blue-100");
      expect(color).toContain("text-blue-700");
    });

    it("should return correct color for in-progress status", () => {
      const color = getTourStatusColor("in-progress");
      expect(color).toContain("bg-yellow-100");
      expect(color).toContain("text-yellow-700");
    });

    it("should return correct color for completed status", () => {
      const color = getTourStatusColor("completed");
      expect(color).toContain("bg-green-100");
      expect(color).toContain("text-green-700");
    });

    it("should return correct color for cancelled status", () => {
      const color = getTourStatusColor("cancelled");
      expect(color).toContain("bg-red-100");
      expect(color).toContain("text-red-700");
    });

    it("should return default color for unknown status", () => {
      const color = getTourStatusColor("unknown");
      expect(color).toBe("bg-gray-100 text-gray-700");
    });

    it("should handle case-sensitive status lookup", () => {
      const draftColor = getTourStatusColor("draft");
      const unknownColor = getTourStatusColor("Draft");
      expect(draftColor).not.toBe(unknownColor);
    });
  });

  // ─── getTourStatusLabel ─────────────────────────────────────────

  describe("getTourStatusLabel", () => {
    it("should return 'Draft' for draft status", () => {
      expect(getTourStatusLabel("draft")).toBe("Draft");
    });

    it("should return 'Confirmed' for confirmed status", () => {
      expect(getTourStatusLabel("confirmed")).toBe("Confirmed");
    });

    it("should return 'In Progress' for in-progress status", () => {
      expect(getTourStatusLabel("in-progress")).toBe("In Progress");
    });

    it("should return 'Completed' for completed status", () => {
      expect(getTourStatusLabel("completed")).toBe("Completed");
    });

    it("should return 'Cancelled' for cancelled status", () => {
      expect(getTourStatusLabel("cancelled")).toBe("Cancelled");
    });

    it("should return the raw status for unknown status", () => {
      expect(getTourStatusLabel("unknown-status")).toBe("unknown-status");
    });
  });

  // ─── getTotalTourDuration ───────────────────────────────────────

  describe("getTotalTourDuration", () => {
    it("should sum estimatedDuration and driveTime for all stops", () => {
      const stops: TourStop[] = [
        sampleTourStop({ id: "s1", estimatedDuration: 30, driveTime: 15 }),
        sampleTourStop({ id: "s2", estimatedDuration: 45, driveTime: 10 }),
        sampleTourStop({ id: "s3", estimatedDuration: 20, driveTime: 5 }),
      ];

      const total = getTotalTourDuration(stops);

      // (30+15) + (45+10) + (20+5) = 45 + 55 + 25 = 125
      expect(total).toBe(125);
    });

    it("should handle stops with missing driveTime by treating it as 0", () => {
      const stops: TourStop[] = [
        sampleTourStop({
          id: "s1",
          estimatedDuration: 30,
          driveTime: undefined,
        }),
        sampleTourStop({
          id: "s2",
          estimatedDuration: 20,
          driveTime: undefined,
        }),
      ];

      const total = getTotalTourDuration(stops);

      expect(total).toBe(50);
    });

    it("should handle stops with missing estimatedDuration by treating it as 0", () => {
      // estimatedDuration is number (not optional) but the helper uses ?. so it handles undefined gracefully
      const stops: TourStop[] = [
        sampleTourStop({ id: "s1", estimatedDuration: 0, driveTime: 10 }),
      ];

      const total = getTotalTourDuration(stops);

      expect(total).toBe(10);
    });

    it("should return 0 for empty stops array", () => {
      expect(getTotalTourDuration([])).toBe(0);
    });

    it("should handle a single stop with only estimatedDuration", () => {
      const stops: TourStop[] = [
        sampleTourStop({ id: "s1", estimatedDuration: 60, driveTime: 0 }),
      ];

      expect(getTotalTourDuration(stops)).toBe(60);
    });
  });

  // ─── formatDuration ─────────────────────────────────────────────

  describe("formatDuration", () => {
    it("should format as minutes only when less than 60 minutes", () => {
      expect(formatDuration(45)).toBe("45m");
    });

    it("should format as hours only when exact hour", () => {
      expect(formatDuration(120)).toBe("2h");
    });

    it("should format as hours and minutes when both present", () => {
      expect(formatDuration(90)).toBe("1h 30m");
    });

    it("should return '0m' for 0 minutes", () => {
      expect(formatDuration(0)).toBe("0m");
    });

    it("should handle single hour with minutes", () => {
      expect(formatDuration(75)).toBe("1h 15m");
    });

    it("should handle large values", () => {
      expect(formatDuration(480)).toBe("8h");
    });
  });

  // ─── generateGoogleMapsUrl ──────────────────────────────────────

  describe("generateGoogleMapsUrl", () => {
    it("should generate a maps URL with encoded addresses for multiple stops", () => {
      const stops: TourStop[] = [
        sampleTourStop({ id: "s1", listingAddress: "123 Main St, Makati" }),
        sampleTourStop({ id: "s2", listingAddress: "456 Elm St, BGC" }),
      ];

      const url = generateGoogleMapsUrl(stops);

      expect(url).toContain("https://www.google.com/maps/dir/");
      expect(url).toContain(encodeURIComponent("123 Main St, Makati"));
      expect(url).toContain(encodeURIComponent("456 Elm St, BGC"));
    });

    it("should return empty string for empty stops array", () => {
      expect(generateGoogleMapsUrl([])).toBe("");
    });

    it("should encode special characters in addresses", () => {
      const stops: TourStop[] = [
        sampleTourStop({ id: "s1", listingAddress: "Ave. & 5th St, Manila" }),
      ];

      const url = generateGoogleMapsUrl(stops);

      expect(url).toContain(encodeURIComponent("Ave. & 5th St, Manila"));
      expect(url).not.toContain("&");
    });

    it("should join multiple addresses with /", () => {
      const stops: TourStop[] = [
        sampleTourStop({ id: "s1", listingAddress: "Addr A" }),
        sampleTourStop({ id: "s2", listingAddress: "Addr B" }),
        sampleTourStop({ id: "s3", listingAddress: "Addr C" }),
      ];

      const url = generateGoogleMapsUrl(stops);

      const parts = url.split("/");
      // https: + '' + www.google.com + maps + dir + Addr A + Addr B + Addr C
      expect(parts).toHaveLength(8);
    });
  });
});
