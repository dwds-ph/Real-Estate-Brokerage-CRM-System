import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AnalyticsPage from "@/pages/AnalyticsPage";

// Mock AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    userProfile: { id: "user-1", displayName: "Agent", role: "agent" },
  }),
}));

// Mock useAnalyticsPage hook
const mockUseAnalyticsPage = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/useAnalyticsPage", () => ({
  useAnalyticsPage: () => mockUseAnalyticsPage(),
}));

// Mock child components
vi.mock("@/components/analytics/ConversionFunnel", () => ({
  default: () => <div data-testid="conversion-funnel" />,
}));

vi.mock("@/components/analytics/AgentPerformanceBoard", () => ({
  default: () => <div data-testid="agent-performance-board" />,
}));

vi.mock("@/components/analytics/ExpenseVsCommission", () => ({
  default: () => <div data-testid="expense-vs-commission" />,
}));

vi.mock("@/components/analytics/ListingPerformance", () => ({
  default: () => <div data-testid="listing-performance" />,
}));

vi.mock("@/components/analytics/SourceAnalytics", () => ({
  default: () => <div data-testid="source-analytics" />,
}));

vi.mock("@/components/analytics/DateRangePicker", () => ({
  default: () => <div data-testid="date-range-picker" />,
}));

const defaultAnalyticsData = {
  activeTab: "funnel",
  setActiveTab: vi.fn(),
  dateRange: { from: "2024-01-01", to: "2024-12-31" },
  setDateRange: vi.fn(),
  leads: [],
  deals: [],
  viewings: [],
  listings: [],
  expenses: [],
  agents: [],
  effectiveAgents: [],
  myLeads: [],
  isLoading: false,
  hasData: false,
  isBroker: false,
};

describe("AnalyticsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAnalyticsPage.mockReturnValue({ ...defaultAnalyticsData });
  });

  it("renders analytics page with header", () => {
    render(<AnalyticsPage />);
    expect(screen.getByText("Analytics & Reports")).toBeInTheDocument();
  });

  it("shows tab navigation", () => {
    render(<AnalyticsPage />);
    expect(screen.getByText("Funnel")).toBeInTheDocument();
    expect(screen.getByText("Agent Performance")).toBeInTheDocument();
    expect(screen.getByText("Listings")).toBeInTheDocument();
    expect(screen.getByText("Sources")).toBeInTheDocument();
  });

  it("shows funnel tab content by default", () => {
    render(<AnalyticsPage />);
    expect(screen.getByTestId("conversion-funnel")).toBeInTheDocument();
  });

  it("shows DateRangePicker", () => {
    render(<AnalyticsPage />);
    expect(screen.getByTestId("date-range-picker")).toBeInTheDocument();
  });

  it("shows export button", () => {
    render(<AnalyticsPage />);
    expect(screen.getByText(/Export CSV/)).toBeInTheDocument();
  });

  it("shows agent performance tab content when active", () => {
    mockUseAnalyticsPage.mockReturnValue({
      ...defaultAnalyticsData,
      activeTab: "agents",
    });
    render(<AnalyticsPage />);
    expect(screen.getByTestId("agent-performance-board")).toBeInTheDocument();
  });

  it("shows listings tab content when active", () => {
    mockUseAnalyticsPage.mockReturnValue({
      ...defaultAnalyticsData,
      activeTab: "listings",
    });
    render(<AnalyticsPage />);
    expect(screen.getByTestId("listing-performance")).toBeInTheDocument();
  });

  it("shows sources tab content when active", () => {
    mockUseAnalyticsPage.mockReturnValue({
      ...defaultAnalyticsData,
      activeTab: "sources",
    });
    render(<AnalyticsPage />);
    expect(screen.getByTestId("source-analytics")).toBeInTheDocument();
  });

  it("does not show P&L tab for non-broker users", () => {
    render(<AnalyticsPage />);
    expect(screen.queryByText("P&L")).not.toBeInTheDocument();
  });

  it("shows P&L tab for broker users", () => {
    mockUseAnalyticsPage.mockReturnValue({
      ...defaultAnalyticsData,
      isBroker: true,
      activeTab: "pnl",
    });
    render(<AnalyticsPage />);
    expect(screen.getByText("P&L")).toBeInTheDocument();
    expect(screen.getByTestId("expense-vs-commission")).toBeInTheDocument();
  });
});
