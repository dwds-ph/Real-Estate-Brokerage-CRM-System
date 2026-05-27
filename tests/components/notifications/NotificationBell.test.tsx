import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotificationBell from "@/components/notifications/NotificationBell";

// Mock hooks
const mockUseAuth = vi.fn();
const mockUseCollection = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/hooks/useFirestore", () => ({
  useCollection: (...args: unknown[]) => mockUseCollection(...args),
  updateDocById: vi.fn(),
}));

vi.mock("@/lib/utils", () => ({
  timeAgo: vi.fn(() => "2m"),
  cn: (...args: string[]) => args.filter(Boolean).join(" "),
}));

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: { uid: "user-1" },
      userProfile: { id: "user-1", displayName: "Test User" },
    });

    mockUseCollection.mockReturnValue({
      data: [],
      loading: false,
    });
  });

  it("should render bell icon", () => {
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>,
    );

    // The bell icon (🔔) should be rendered
    expect(screen.getByText("🔔")).toBeInTheDocument();
  });

  it("should show unread badge count", () => {
    mockUseCollection.mockReturnValue({
      data: [
        {
          id: "notif-1",
          userId: "user-1",
          type: "lead",
          title: "New Lead",
          body: "A new lead arrived",
          read: false,
          createdAt: Date.now(),
        },
        {
          id: "notif-2",
          userId: "user-1",
          type: "task",
          title: "Task Due",
          body: "Task is due",
          read: true,
          createdAt: Date.now(),
        },
        {
          id: "notif-3",
          userId: "user-1",
          type: "viewing",
          title: "Viewing Scheduled",
          body: "Viewing at 3pm",
          read: false,
          createdAt: Date.now(),
        },
      ],
      loading: false,
    });

    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>,
    );

    // Should show unread count (2 unread)
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("should not show badge when unread count is 0", () => {
    mockUseCollection.mockReturnValue({
      data: [
        {
          id: "notif-1",
          userId: "user-1",
          type: "lead",
          title: "New Lead",
          body: "A new lead arrived",
          read: true,
          createdAt: Date.now(),
        },
      ],
      loading: false,
    });

    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>,
    );

    // The bell should exist but the badge with "0" should not be rendered
    expect(screen.getByText("🔔")).toBeInTheDocument();
    // Only for unread > 0, so "0" should not appear
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
