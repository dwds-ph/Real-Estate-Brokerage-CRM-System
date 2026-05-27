import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import MortgageTracker from "@/components/mortgage/MortgageTracker";
import { Mortgage, MortgageStage } from "@/types";
import { STAGE_ORDER } from "@/services/mortgageService";

// Mock the mortgage service module
vi.mock("@/services/mortgageService", async () => {
  const actual = await vi.importActual("@/services/mortgageService");
  return {
    ...actual,
    advanceMortgageStage: vi.fn(),
    updateStageNotes: vi.fn(),
  };
});

const createMockMortgage = (
  overrides: Partial<Mortgage> = {},
): Mortgage => ({
  id: "mort-1",
  dealId: "deal-1",
  bankId: "bpi",
  bankName: "BPI",
  loanAmount: 3000000,
  status: "ongoing",
  currentStage: "application" as MortgageStage,
  stages: STAGE_ORDER.map((key, index) => ({
    key,
    label: key.charAt(0).toUpperCase() + key.replace("-", " ").slice(1),
    status: index === 0 ? ("in-progress" as const) : ("pending" as const),
    startedAt: index === 0 ? Date.now() : undefined,
    completedAt: undefined,
    notes: undefined,
  })),
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

describe("MortgageTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders stage progress timeline", () => {
    const mortgage = createMockMortgage();
    render(<MortgageTracker mortgage={mortgage} />);

    // Should render the header with mortgage progress
    expect(screen.getByText("Mortgage Progress")).toBeInTheDocument();
    // Should show the current stage counter
    expect(screen.getByText(/Stage 1 of 5/)).toBeInTheDocument();
  });

  it("highlights current stage", () => {
    const mortgage = createMockMortgage({ currentStage: "bank-evaluation" });
    render(<MortgageTracker mortgage={mortgage} />);

    // Current stage should show "In Progress"
    const inProgressLabels = screen.getAllByText("In Progress");
    expect(inProgressLabels.length).toBeGreaterThanOrEqual(1);
  });

  it("shows completed stages with checkmarks", () => {
    const stages = STAGE_ORDER.map((key, index) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.replace("-", " ").slice(1),
      status: index === 0 ? ("done" as const) : index === 1 ? ("in-progress" as const) : ("pending" as const),
      startedAt: Date.now(),
      completedAt: index === 0 ? Date.now() : undefined,
      notes: undefined,
    }));

    const mortgage = createMockMortgage({
      currentStage: "bank-evaluation",
      stages,
    });
    render(<MortgageTracker mortgage={mortgage} />);

    // The first stage should be marked as "Done"
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("shows status badge (Ongoing/Approved/Rejected)", () => {
    const mortgage = createMockMortgage({ status: "approved" });
    render(<MortgageTracker mortgage={mortgage} />);
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("renders in compact mode", () => {
    const mortgage = createMockMortgage();
    render(<MortgageTracker mortgage={mortgage} compact />);
    // In compact mode, the header is not shown
    expect(screen.queryByText("Mortgage Progress")).not.toBeInTheDocument();
  });
});
