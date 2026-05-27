import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAggregatedEvents,
  getEventsForDay,
  EVENT_COLORS,
} from "@/services/calendarService";
import type { Viewing, TaskItem, Deal, VaultDocument } from "@/types";

type DocWithId<T> = T & { id: string };

const mockViewing: DocWithId<Viewing> = {
  id: "view-1",
  leadId: "lead-1",
  listingId: "listing-1",
  agentId: "agent-1",
  scheduledAt: 1000000,
  status: "scheduled",
  photos: [],
  createdAt: 1000000,
};

const mockTaskWithDue: DocWithId<TaskItem> = {
  id: "task-1",
  agentId: "agent-1",
  createdBy: "agent-1",
  title: "Follow up with client",
  priority: "high",
  dueDate: 2000000,
  status: "pending",
  recurring: "none",
  createdAt: 1000000,
};

const mockTaskWithoutDue: DocWithId<TaskItem> = {
  id: "task-2",
  agentId: "agent-1",
  createdBy: "agent-1",
  title: "No due date task",
  priority: "low",
  dueDate: undefined,
  status: "pending",
  recurring: "none",
  createdAt: 1000000,
};

const mockDeal: DocWithId<Deal> = {
  id: "deal-1",
  clientName: "John Doe",
  clientContact: "09170000000",
  dealPrice: 3000000,
  status: "pending",
  createdBy: "agent-1",
  createdAt: 1000000,
  updatedAt: 1000000,
};

const mockClosedDeal: DocWithId<Deal> = {
  ...mockDeal,
  id: "deal-2",
  status: "closed",
  updatedAt: 3000000,
};

const mockDocWithExpiry: DocWithId<VaultDocument> = {
  id: "doc-1",
  name: "Contract.pdf",
  fileUrl: "https://storage.example.com/doc1",
  fileType: "application/pdf",
  fileSize: 102400,
  category: "contract",
  uploadedBy: "agent-1",
  uploadedAt: 1000000,
  version: 1,
  tags: [],
  expiryDate: 4000000,
};

const mockDocWithoutExpiry: DocWithId<VaultDocument> = {
  ...mockDocWithExpiry,
  id: "doc-2",
  name: "ID.pdf",
  expiryDate: undefined,
};

describe("calendarService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAggregatedEvents", () => {
    it("should aggregate viewings, tasks, deals, and documents into CalendarEvent[]", () => {
      const events = getAggregatedEvents(
        [mockViewing],
        [mockTaskWithDue],
        [mockDeal],
        [mockDocWithExpiry],
      );

      expect(events.length).toBeGreaterThanOrEqual(4);
      expect(events.some((e) => e.type === "viewing")).toBe(true);
      expect(events.some((e) => e.type === "task")).toBe(true);
      expect(events.some((e) => e.type === "deal-milestone")).toBe(true);
      expect(events.some((e) => e.type === "document-expiry")).toBe(true);
    });

    it("should return empty array for empty inputs", () => {
      const events = getAggregatedEvents([], [], [], []);
      expect(events).toEqual([]);
    });

    it("should skip tasks without dueDate", () => {
      const events = getAggregatedEvents(
        [],
        [mockTaskWithoutDue],
        [],
        [],
      );
      expect(events).toHaveLength(0);
    });

    it("should skip documents without expiryDate", () => {
      const events = getAggregatedEvents(
        [],
        [],
        [],
        [mockDocWithoutExpiry],
      );
      expect(events).toHaveLength(0);
    });

    it("should create two events for a closed deal (created + closed)", () => {
      const events = getAggregatedEvents(
        [],
        [],
        [mockClosedDeal],
        [],
      );
      expect(events).toHaveLength(2);
      const titles = events.map((e) => e.title);
      expect(titles).toContain(`Deal Created: ${mockClosedDeal.clientName}`);
      expect(titles).toContain(`Deal Closed: ${mockClosedDeal.clientName}`);
    });

    it("should sort events by start time ascending", () => {
      const lateViewing: DocWithId<Viewing> = {
        ...mockViewing,
        id: "view-2",
        scheduledAt: 5000000,
      };
      const events = getAggregatedEvents(
        [mockViewing, lateViewing],
        [],
        [],
        [],
      );
      expect(events[0].start).toBeLessThanOrEqual(events[1].start);
    });
  });

  describe("getEventsForDay", () => {
    it("should return events that fall within the given day", () => {
      const day = new Date("1970-01-01T00:00:00Z");
      // mockViewing.scheduledAt = 1000000 (Jan 12 1970 10:16:40 UTC + some)
      // We'll use a day that encompasses that timestamp
      const events = [
        {
          id: "viewing-view-1",
          type: "viewing" as const,
          title: "Test",
          start: 1000000,
          end: 4600000,
          allDay: false,
          sourceId: "view-1",
          sourceUrl: "/viewings",
          color: EVENT_COLORS.viewing,
        },
      ];

      // Day that should cover timestamp 1000000
      const testDay = new Date(1000000);
      testDay.setHours(0, 0, 0, 0);
      const filtered = getEventsForDay(events, testDay);
      expect(filtered).toHaveLength(1);
    });

    it("should return empty array for a day with no events", () => {
      const events = getEventsForDay([], new Date("2026-06-01"));
      expect(events).toEqual([]);
    });

    it("should exclude events outside the given day", () => {
      const events = [
        {
          id: "event-1",
          type: "task" as const,
          title: "Old Event",
          start: 1000,
          end: undefined,
          allDay: true,
          sourceId: "task-1",
          sourceUrl: "/tasks",
          color: EVENT_COLORS.task,
        },
      ];
      const day = new Date("2026-06-15T00:00:00Z");
      const filtered = getEventsForDay(events, day);
      expect(filtered).toHaveLength(0);
    });
  });

  describe("EVENT_COLORS", () => {
    it("should have defined colors for all event types", () => {
      expect(EVENT_COLORS.viewing).toBe("#3b82f6");
      expect(EVENT_COLORS.task).toBe("#f97316");
      expect(EVENT_COLORS["deal-milestone"]).toBe("#22c55e");
      expect(EVENT_COLORS["document-expiry"]).toBe("#ef4444");
    });
  });
});
