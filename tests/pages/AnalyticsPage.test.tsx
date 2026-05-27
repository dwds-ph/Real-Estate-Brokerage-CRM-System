import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AnalyticsPage from "@/pages/AnalyticsPage";

// Mock AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    userProfile: {
      id: "user-1",
      displayName: "Agent",
      role: "agent",
      brokerId: "broker-1",
    },
  }),
}));

// Mock Firebase
vi.mock("@/lib/firebase", () => ({
  db: {},
  auth: {},
  storage: {},
  messaging: {},
}));

// Mock useFirestore hooks
vi.mock("@/hooks/useFirestore", () => ({
  useCollection: vi.fn((_name: string) => ({
    data: [],
    loading: false,
    error: null,
  })),
}));

vi.mock("@/services/goalService", () => ({
  subscribeGoals: vi.fn((_brokerId, cb) => {
    cb([]);
    return vi.fn();
  }),
  createGoal: vi.fn(),
  updateGoal: vi.fn(),
  deleteGoal: vi.fn(),
}));

// Mock child components
vi.mock("@/components/analytics/LeadSourceAnalytics", () => ({
  default: () => <div data-testid="lead-source-analytics" />,
}));
vi.mock("@/components/analytics/AgentGoalTracker", () => ({
  default: () => <div data-testid="agent-goal-tracker" />,
}));
vi.mock("@/components/analytics/GoalForm", () => ({
  default: () => <div data-testid="goal-form" />,
}));
vi.mock("@/components/analytics/GoalOverview", () => ({
  default: () => <div data-testid="goal-overview" />,
}));
vi.mock("@/components/analytics/AdvancedAnalytics", () => ({
  default: () => <div data-testid="advanced-analytics" />,
}));

describe("AnalyticsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders analytics page with header", () => {
    render(<AnalyticsPage />);
    expect(screen.getByText("Analytics & Reports")).toBeInTheDocument();
  });

  it("shows tab navigation with all 4 tabs", () => {
    render(<AnalyticsPage />);
    expect(screen.getByText("Lead Sources")).toBeInTheDocument();
    expect(screen.getByText("Goals")).toBeInTheDocument();
    expect(screen.getByText("Advanced")).toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
  });

  it("shows lead source analytics tab content by default", () => {
    render(<AnalyticsPage />);
    expect(screen.getByTestId("lead-source-analytics")).toBeInTheDocument();
  });

  it("shows goals tab content when active", () => {
    render(<AnalyticsPage />);
    fireEvent.click(screen.getByText("Goals"));
    expect(screen.getByText("Agent Goals")).toBeInTheDocument();
  });

  it("shows advanced tab content when active", () => {
    render(<AnalyticsPage />);
    fireEvent.click(screen.getByText("Advanced"));
    expect(screen.getByText("Advanced Analytics")).toBeInTheDocument();
  });

  it("shows overview tab content when active", () => {
    render(<AnalyticsPage />);
    fireEvent.click(screen.getByText("Overview"));
    expect(screen.getByText("Team Goals Overview")).toBeInTheDocument();
  });
});
