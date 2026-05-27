import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SmartReminders from "@/components/calendar/SmartReminders";

// Mock AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: { uid: "user-1" },
    userProfile: { id: "user-1", role: "agent", displayName: "Test Agent" },
    loading: false,
  })),
}));

// Mock useFirestore hooks
const mockLeads = vi.fn();
const mockViewings = vi.fn();
const mockDocuments = vi.fn();

vi.mock("@/hooks/useFirestore", () => ({
  useCollection: vi.fn((collectionName: string) => {
    if (collectionName === "leads") return { data: mockLeads(), loading: false, error: null };
    if (collectionName === "viewings") return { data: mockViewings(), loading: false, error: null };
    if (collectionName === "vaultDocuments") return { data: mockDocuments(), loading: false, error: null };
    return { data: [], loading: false, error: null };
  }),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

const now = Date.now();
const threeDaysAgo = now - 4 * 24 * 60 * 60 * 1000;
const oneDayFromNow = now + 24 * 60 * 60 * 1000;

describe("SmartReminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it("shows reminders for inactive leads", () => {
    mockLeads.mockReturnValue([
      {
        id: "lead-1",
        name: "Inactive Lead",
        status: "new",
        assignedTo: "user-1",
        createdAt: threeDaysAgo,
        updatedAt: threeDaysAgo,
      },
    ]);
    mockViewings.mockReturnValue([]);
    mockDocuments.mockReturnValue([]);

    render(<SmartReminders />);

    expect(
      screen.getByText(/Follow up with Inactive Lead/),
    ).toBeInTheDocument();
  });

  it("shows reminders for pending feedback", () => {
    mockLeads.mockReturnValue([]);
    mockViewings.mockReturnValue([
      {
        id: "view-1",
        leadId: "lead-1",
        listingId: "listing-1",
        agentId: "agent-1",
        scheduledAt: oneDayFromNow,
        status: "done",
        feedback: undefined,
        photos: [],
        createdAt: now,
      },
    ]);
    mockDocuments.mockReturnValue([]);

    render(<SmartReminders />);

    expect(
      screen.getByText(/Collect feedback for viewing/),
    ).toBeInTheDocument();
  });

  it("shows reminders for expiring documents", () => {
    mockLeads.mockReturnValue([]);
    mockViewings.mockReturnValue([]);

    // Document expiring in 2 days (< 7 days threshold)
    const twoDaysFromNow = now + 2 * 24 * 60 * 60 * 1000;
    mockDocuments.mockReturnValue([
      {
        id: "doc-1",
        name: "Contract.pdf",
        fileUrl: "https://example.com/doc.pdf",
        fileType: "application/pdf",
        fileSize: 1024,
        category: "contract",
        uploadedBy: "user-1",
        uploadedAt: now,
        version: 1,
        expiryDate: twoDaysFromNow,
        tags: [],
      },
    ]);

    render(<SmartReminders />);

    expect(
      screen.getByText(/Document.*Contract.pdf.*expiring soon/),
    ).toBeInTheDocument();
  });

  it("dismisses reminder on click", () => {
    mockLeads.mockReturnValue([
      {
        id: "lead-1",
        name: "Inactive Lead",
        status: "new",
        assignedTo: "user-1",
        createdAt: threeDaysAgo,
        updatedAt: threeDaysAgo,
      },
    ]);
    mockViewings.mockReturnValue([]);
    mockDocuments.mockReturnValue([]);

    render(<SmartReminders />);

    expect(
      screen.getByText(/Follow up with Inactive Lead/),
    ).toBeInTheDocument();

    // Click dismiss button
    const dismissButtons = screen.getAllByTitle("Dismiss");
    fireEvent.click(dismissButtons[0]);

    // Reminder should no longer be visible
    expect(
      screen.queryByText(/Follow up with Inactive Lead/),
    ).not.toBeInTheDocument();
  });
});
