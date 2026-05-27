import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AgentPerformanceBoard from "@/components/analytics/AgentPerformanceBoard";
import type { Lead, Deal, AppUser } from "@/types";

const createMockLead = (overrides: Partial<Lead> = {}): Lead => ({
  id: "lead-1",
  name: "Test Lead",
  source: "manual",
  status: "new",
  score: "warm",
  communicationLog: [],
  activityTimeline: [],
  createdAt: 1000000,
  updatedAt: 1000000,
  ...overrides,
});

const createMockDeal = (overrides: Partial<Deal> = {}): Deal => ({
  id: "deal-1",
  clientName: "Client",
  clientContact: "09170000000",
  dealPrice: 3000000,
  status: "closed",
  createdBy: "agent-1",
  createdAt: 1000000,
  updatedAt: 1000000,
  ...overrides,
});

const createMockAgent = (overrides: Partial<AppUser> = {}): AppUser => ({
  id: "agent-1",
  role: "agent",
  displayName: "Alice",
  email: "alice@example.com",
  isActive: true,
  createdAt: 1000000,
  ...overrides,
});

const sampleLeads: Lead[] = [
  createMockLead({ id: "l1", assignedTo: "agent-1", status: "new" }),
  createMockLead({ id: "l2", assignedTo: "agent-1", status: "closed" }),
  createMockLead({ id: "l3", assignedTo: "agent-2", status: "contacted" }),
];

const sampleDeals: Deal[] = [
  createMockDeal({ id: "d1", createdBy: "agent-1", status: "closed" }),
];

const sampleAgents: AppUser[] = [
  createMockAgent({ id: "agent-1", displayName: "Alice" }),
  createMockAgent({ id: "agent-2", displayName: "Bob" }),
];

describe("AgentPerformanceBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders table with agent stats", () => {
    render(
      <AgentPerformanceBoard
        leads={sampleLeads}
        deals={sampleDeals}
        agents={sampleAgents}
        isLoading={false}
        isBroker={true}
      />,
    );

    // Should show agent names
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();

    // Alice has 2 leads, 1 closed deal
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows empty state", () => {
    render(
      <AgentPerformanceBoard
        leads={[]}
        deals={[]}
        agents={[]}
        isLoading={false}
        isBroker={true}
      />,
    );

    expect(
      screen.getByText("No agent performance data available"),
    ).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(
      <AgentPerformanceBoard
        leads={[]}
        deals={[]}
        agents={[]}
        isLoading={true}
        isBroker={true}
      />,
    );

    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("sorts by column when header clicked", () => {
    render(
      <AgentPerformanceBoard
        leads={sampleLeads}
        deals={sampleDeals}
        agents={sampleAgents}
        isLoading={false}
        isBroker={true}
      />,
    );

    // Default sort is descending ("↓") by deals closed
    expect(screen.getByText("↓")).toBeInTheDocument();

    // Find and click the "Agent" column header to sort by name
    const agentHeader = screen.getByText("Agent");
    fireEvent.click(agentHeader);

    // After clicking "Agent", it sorts descending by name
    expect(screen.getByText("↓")).toBeInTheDocument();

    // Clicking again reverses sort to ascending
    fireEvent.click(agentHeader);
    expect(screen.getByText("↑")).toBeInTheDocument();
  });
});
