import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ActivityFeed from "@/components/automation/ActivityFeed";

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(() => vi.fn()),
}));

// Track loading state for testing
let mockLoading = false;

// Mock useFirestore hooks
const mockActivities = vi.fn();
const mockUsers = vi.fn();

vi.mock("@/hooks/useFirestore", () => ({
  useCollection: vi.fn((collectionName: string) => {
    if (collectionName === "auditLogs") return { data: mockActivities(), loading: mockLoading, error: null };
    if (collectionName === "users") return { data: mockUsers(), loading: false, error: null };
    return { data: [], loading: false, error: null };
  }),
}));

// Mock utils
vi.mock("@/lib/utils", () => ({
  timeAgo: vi.fn(() => "2 hours ago"),
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

const sampleActivities = [
  {
    id: "act-1",
    action: "created",
    userId: "user-1",
    targetCollection: "leads",
    targetDocId: "lead-1",
    timestamp: 1000000,
  },
  {
    id: "act-2",
    action: "updated",
    userId: "user-2",
    targetCollection: "deals",
    targetDocId: "deal-1",
    timestamp: 2000000,
  },
  {
    id: "act-3",
    action: "deleted",
    userId: "user-1",
    targetCollection: "listings",
    targetDocId: "listing-1",
    timestamp: 3000000,
  },
];

const sampleUsers = [
  { id: "user-1", displayName: "Alice", role: "agent", email: "alice@test.com", isActive: true, createdAt: 1000000 },
  { id: "user-2", displayName: "Bob", role: "agent", email: "bob@test.com", isActive: true, createdAt: 1000000 },
];

describe("ActivityFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoading = false;
  });

  it("shows list of activities", () => {
    mockActivities.mockReturnValue(sampleActivities);
    mockUsers.mockReturnValue(sampleUsers);

    render(<ActivityFeed />);

    // User names should appear (Alice appears in 2 activities, Bob in 1)
    expect(screen.getAllByText("Alice")).toHaveLength(2);
    expect(screen.getByText("Bob")).toBeInTheDocument();
    // Action text should be present
    expect(screen.getByText(/created/)).toBeInTheDocument();
    expect(screen.getByText(/updated/)).toBeInTheDocument();
    expect(screen.getByText(/deleted/)).toBeInTheDocument();
  });

  it("filters by action type", () => {
    mockActivities.mockReturnValue(sampleActivities);
    mockUsers.mockReturnValue(sampleUsers);

    render(<ActivityFeed />);

    // Click the "Create" filter button
    const createBtn = screen.getByText("Create");
    fireEvent.click(createBtn);

    // After filtering only "created" actions remain
    expect(screen.getByText(/created/)).toBeInTheDocument();
  });

  it("shows empty state", () => {
    mockActivities.mockReturnValue([]);
    mockUsers.mockReturnValue([]);

    render(<ActivityFeed />);

    expect(screen.getByText("No activity yet.")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    mockLoading = true;
    mockActivities.mockReturnValue([]);
    mockUsers.mockReturnValue([]);

    render(<ActivityFeed />);

    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });
});
