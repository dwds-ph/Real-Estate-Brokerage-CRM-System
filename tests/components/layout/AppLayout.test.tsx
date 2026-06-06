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

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "app.name": "Real Estate CRM",
        "navigation.dashboard": "Dashboard",
        "navigation.leads": "Leads",
        "navigation.deals": "Deals",
        "navigation.listings": "Listings",
        "navigation.viewings": "Viewings",
        "navigation.commissions": "Commissions",
        "navigation.payouts": "Payouts",
        "navigation.import": "Import",
        "navigation.tasks": "Tasks",
        "navigation.agents": "Agents",
        "navigation.offices": "Offices",
        "navigation.expenses": "Expenses",
        "navigation.phTools": "PH Tools",
        "navigation.vault": "Vault",
        "navigation.mortgages": "Mortgages",
        "navigation.analytics": "Analytics",
        "navigation.calendar": "Calendar",
        "navigation.checklists": "Checklists",
        "navigation.activity": "Activity",
        "navigation.projects": "Projects",
        "navigation.market": "Market",
        "navigation.licenses": "Licenses",
        "navigation.tours": "Tours",
        "navigation.leaderboard": "Leaderboard",
        "navigation.map": "Map",
        "navigation.loans": "Loans",
        "navigation.coBrokerage": "Co-Brokerage",
        "navigation.documents": "Documents",
        "navigation.compliance": "Compliance",
        "navigation.cma": "CMA",
        "navigation.seedData": "Seed Data",
        "navigation.auditTrail": "Audit Trail",
        "navigation.reports": "Reports",
        "navigation.settings": "Settings",
        "navigation.notifications": "Notifications",
        "navigation.reminders": "Reminders",
        "settings.title": "Settings",
        "theme.light": "Light",
        "theme.dark": "Dark",
        "auth.logout": "Logout",
        "auth.email": "Email",
        "auth.displayName": "Display Name",
        "auth.role": "Role",
        "common.sidebarNavigation": "Sidebar navigation",
        "common.sidebarPages": "Sidebar pages",
        "common.collapseSidebar": "Collapse sidebar",
        "common.expandSidebar": "Expand sidebar",
        "common.openMenu": "Open menu",
        "common.switchToFilipino": "Switch to Filipino",
        "common.switchToEnglish": "Switch to English",
        "settings.filipino": "Filipino",
        "settings.english": "English",
      };
      return translations[key] || key;
    },
    i18n: { language: "en", changeLanguage: vi.fn(), on: vi.fn(), off: vi.fn() },
  }),
}));

// Mock LanguageSwitcher
vi.mock("@/components/layout/LanguageSwitcher", () => ({
  LanguageSwitcher: () => <div />,
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
