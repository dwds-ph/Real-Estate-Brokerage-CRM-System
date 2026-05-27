import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DealsPage from "@/pages/DealsPage";

// Mock AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    userProfile: { id: "user-1", displayName: "Agent", role: "agent" },
  }),
}));

// Mock useDealsPage hook
const mockUseDealsPage = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/useDealsPage", () => ({
  useDealsPage: () => mockUseDealsPage(),
}));

// Mock child components
vi.mock("@/components/deals/DealKanban", () => ({
  DealKanban: () => <div data-testid="deal-kanban" />,
}));

vi.mock("@/components/deals/DealMortgageSection", () => ({
  DealMortgageSection: () => <div data-testid="deal-mortgage-section" />,
}));

vi.mock("@/components/deals/DealReferralSection", () => ({
  DealReferralSection: () => <div data-testid="deal-referral-section" />,
}));

vi.mock("@/components/mortgage/MortgageForm", () => ({
  default: () => <div data-testid="mortgage-form" />,
}));

vi.mock("@/components/automation/ChecklistWidget", () => ({
  default: () => <div data-testid="checklist-widget" />,
}));

const defaultDealsData = {
  allLeads: [],
  allDeals: [],
  allMortgages: [],
  loading: false,
  draggingId: null,
  isBroker: false,
  showMortgageForm: false,
  setShowMortgageForm: vi.fn(),
  selectedDealId: undefined,
  setSelectedDealId: vi.fn(),
  checklistExpanded: false,
  setChecklistExpanded: vi.fn(),
  checklistDealId: null,
  setChecklistDealId: vi.fn(),
  handleDragStart: vi.fn(),
  handleDrop: vi.fn(),
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <DealsPage />
    </MemoryRouter>,
  );

describe("DealsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDealsPage.mockReturnValue({ ...defaultDealsData });
  });

  it("renders deals page header", () => {
    renderPage();
    expect(screen.getByText("Deal Pipeline")).toBeInTheDocument();
  });

  it("shows deal cards via kanban board", () => {
    renderPage();
    expect(screen.getByTestId("deal-kanban")).toBeInTheDocument();
  });

  it("shows mortgage section", () => {
    renderPage();
    expect(screen.getByTestId("deal-mortgage-section")).toBeInTheDocument();
  });

  it("shows referral section", () => {
    renderPage();
    expect(screen.getByTestId("deal-referral-section")).toBeInTheDocument();
  });

  it("shows loading spinner when loading", () => {
    mockUseDealsPage.mockReturnValue({
      ...defaultDealsData,
      loading: true,
    });
    renderPage();
    // When loading, the page renders only a spinner, not the full layout
    expect(screen.queryByTestId("deal-kanban")).not.toBeInTheDocument();
    expect(screen.queryByText("Deal Pipeline")).not.toBeInTheDocument();
  });

  it("shows New Lead button", () => {
    renderPage();
    expect(screen.getByText("+ New Lead")).toBeInTheDocument();
  });

  it("shows chequead checklist section", () => {
    renderPage();
    expect(screen.getByText("Deal Checklists")).toBeInTheDocument();
  });

  it("does not show broker overview for agents", () => {
    renderPage();
    expect(screen.queryByText("Broker Overview")).not.toBeInTheDocument();
  });

  it("shows broker overview for brokers", () => {
    mockUseDealsPage.mockReturnValue({
      ...defaultDealsData,
      isBroker: true,
    });
    renderPage();
    expect(screen.getByText("Broker Overview")).toBeInTheDocument();
  });
});
