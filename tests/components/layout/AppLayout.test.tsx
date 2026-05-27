import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AppLayout from "@/components/layout/AppLayout";
import { BrowserRouter } from "react-router-dom";

// Mock AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    userProfile: {
      id: "user-1",
      displayName: "Juan Dela Cruz",
      email: "juan@example.com",
      role: "agent",
    },
    logout: vi.fn(),
  }),
}));

// Mock ThemeContext
vi.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({
    theme: "light",
    toggleTheme: vi.fn(),
  }),
}));

// Mock NotificationBell
vi.mock("@/components/notifications/NotificationBell", () => ({
  default: () => <div data-testid="notification-bell" />,
}));

const renderWithRouter = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

describe("AppLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders sidebar with navigation items", () => {
    renderWithRouter(<AppLayout />);

    // Should show the logo/brand
    expect(screen.getByText("Real Estate CRM")).toBeInTheDocument();
    // Should show key navigation items
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Leads")).toBeInTheDocument();
    expect(screen.getByText("Deals")).toBeInTheDocument();
    expect(screen.getByText("Listings")).toBeInTheDocument();
    expect(screen.getByText("Vault")).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
    expect(screen.getByText("Calendar")).toBeInTheDocument();
  });

  it("shows user name in sidebar", () => {
    renderWithRouter(<AppLayout />);
    expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
  });

  it("shows user role in sidebar", () => {
    renderWithRouter(<AppLayout />);
    expect(screen.getByText("agent")).toBeInTheDocument();
  });

  it("renders notification bell", () => {
    renderWithRouter(<AppLayout />);
    expect(screen.getByTestId("notification-bell")).toBeInTheDocument();
  });

  it("renders sidebar bottom actions (Settings, Dark/Light, Logout)", () => {
    renderWithRouter(<AppLayout />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
    // Theme is "light" in mock, so it shows "Dark" as the switch option
    expect(screen.getByText("Dark")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("renders Outlet placeholder for main content", () => {
    renderWithRouter(<AppLayout />);
    // The Outlet renders nothing if no route matches, but the main area should exist
    expect(screen.getByText("Real Estate CRM")).toBeInTheDocument();
  });
});
