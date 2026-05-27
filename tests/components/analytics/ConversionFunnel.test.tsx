import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ConversionFunnel from "@/components/analytics/ConversionFunnel";
import type { Lead } from "@/types";

const createMockLead = (overrides: Partial<Lead> = {}): Lead => ({
  id: "lead-1",
  name: "John Doe",
  source: "manual",
  status: "new",
  score: "warm",
  communicationLog: [],
  activityTimeline: [],
  createdAt: 1000000,
  updatedAt: 1000000,
  ...overrides,
});

const sampleLeads: Lead[] = [
  createMockLead({ id: "lead-1", name: "Lead 1", status: "new" }),
  createMockLead({ id: "lead-2", name: "Lead 2", status: "contacted" }),
  createMockLead({ id: "lead-3", name: "Lead 3", status: "contacted" }),
  createMockLead({ id: "lead-4", name: "Lead 4", status: "viewed" }),
  createMockLead({ id: "lead-5", name: "Lead 5", status: "negotiating" }),
  createMockLead({ id: "lead-6", name: "Lead 6", status: "closed" }),
];

describe("ConversionFunnel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders chart with lead stage data", () => {
    render(<ConversionFunnel leads={sampleLeads} />);

    // Stage labels should be rendered
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("Contacted")).toBeInTheDocument();
    expect(screen.getByText("Viewed")).toBeInTheDocument();
    expect(screen.getByText("Negotiating")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();

    // Drop-off info should be shown (multiple stages have drop-off)
    expect(screen.getAllByText(/drop/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state with no data", () => {
    render(<ConversionFunnel leads={[]} />);

    expect(
      screen.getByText("No leads data available for funnel analysis"),
    ).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<ConversionFunnel leads={[]} isLoading={true} />);

    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });
});
