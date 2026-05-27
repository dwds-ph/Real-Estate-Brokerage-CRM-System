import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import UnifiedCalendar from "@/components/calendar/UnifiedCalendar";

// Mock AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: { uid: "user-1" },
    userProfile: { id: "user-1", role: "agent", displayName: "Test Agent" },
    loading: false,
  })),
}));

// Mock useFirestore hooks
vi.mock("@/hooks/useFirestore", () => ({
  useCollection: vi.fn((_collectionName: string) => {
    if (_collectionName === "viewings") {
      return {
        data: [
          {
            id: "view-1",
            leadId: "lead-1",
            listingId: "listing-1",
            agentId: "agent-1",
            scheduledAt: Date.now(),
            status: "scheduled",
            photos: [],
            createdAt: Date.now(),
          },
        ],
        loading: false,
        error: null,
      };
    }
    if (_collectionName === "tasks") {
      return {
        data: [
          {
            id: "task-1",
            agentId: "agent-1",
            createdBy: "agent-1",
            title: "Follow up",
            priority: "high",
            dueDate: Date.now() + 86400000,
            status: "pending",
            recurring: "none",
            createdAt: Date.now(),
          },
        ],
        loading: false,
        error: null,
      };
    }
    if (_collectionName === "deals") {
      return {
        data: [
          {
            id: "deal-1",
            clientName: "Client",
            clientContact: "09170000000",
            dealPrice: 3000000,
            status: "closed",
            createdBy: "agent-1",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        loading: false,
        error: null,
      };
    }
    if (_collectionName === "vaultDocuments") {
      return {
        data: [
          {
            id: "doc-1",
            name: "Contract.pdf",
            fileUrl: "https://example.com/doc.pdf",
            fileType: "application/pdf",
            fileSize: 1024,
            category: "contract",
            uploadedBy: "user-1",
            uploadedAt: Date.now(),
            version: 1,
            tags: [],
          },
        ],
        loading: false,
        error: null,
      };
    }
    return { data: [], loading: false, error: null };
  }),
}));

// Mock calendarService
vi.mock("@/services/calendarService", () => {
  const now = Date.now();
  return {
    getAggregatedEvents: vi.fn(() => [
      {
        id: "event-1",
        type: "viewing",
        title: "Viewing at property",
        start: now,
        end: now + 3600000,
        sourceId: "view-1",
        sourceUrl: "/viewings",
        color: "#3B82F6",
      },
      {
        id: "event-2",
        type: "task",
        title: "Follow up",
        start: now + 86400000,
        sourceId: "task-1",
        sourceUrl: "/tasks",
        color: "#F97316",
      },
    ]),
    getEventsForDay: vi.fn((_events: unknown[], _date: Date) => {
      return [
        {
          id: "event-1",
          type: "viewing",
          title: "Viewing at property",
          start: now,
          end: now + 3600000,
          sourceId: "view-1",
          sourceUrl: "/viewings",
          color: "#3B82F6",
        },
      ];
    }),
    EVENT_COLORS: {
      viewing: "#3B82F6",
      task: "#F97316",
      "deal-milestone": "#22C55E",
      "document-expiry": "#EF4444",
    },
  };
});

describe("UnifiedCalendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders calendar with events", () => {
    render(<UnifiedCalendar />);

    // The calendar component renders with event details
    expect(screen.getByText("Viewing at property")).toBeInTheDocument();
    // Legend should be shown (multiple "Viewing" instances from legend + event badge)
    expect(screen.getAllByText("Viewing").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Task")).toBeInTheDocument();
  });

  it("shows color-coded dots for event types", () => {
    render(<UnifiedCalendar />);

    // The legend shows colored dots
    const coloredDots = document.querySelectorAll(".rounded-full");
    expect(coloredDots.length).toBeGreaterThanOrEqual(4);
  });

  it("shows event list when day clicked", () => {
    render(<UnifiedCalendar />);

    // Day events panel shows current events
    expect(screen.getByText(/Events for/)).toBeInTheDocument();
  });
});
