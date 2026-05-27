import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LeadsPage from "@/pages/LeadsPage";

// Mock AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    userProfile: { id: "user-1", displayName: "Agent", role: "agent" },
  }),
}));

// Mock useLeadsPage hook using vi.hoisted
const mockUseLeadsPage = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/useLeadsPage", () => ({
  useLeadsPage: () => mockUseLeadsPage(),
}));

// Mock child components
vi.mock("@/components/leads/LeadFilters", () => ({
  LeadFilters: () => <div data-testid="lead-filters" />,
}));

vi.mock("@/components/leads/LeadForm", () => ({
  LeadForm: () => <div data-testid="lead-form" />,
}));

vi.mock("@/components/leads/LeadList", () => ({
  LeadList: (props: { leads: unknown[]; loading: boolean }) => (
    <div data-testid="lead-list">
      {props.loading ? (
        <span>Loading...</span>
      ) : props.leads.length === 0 ? (
        <span>No leads found</span>
      ) : (
        <span>{props.leads.length} leads</span>
      )}
    </div>
  ),
}));

vi.mock("@/components/automation/LeadRoutingRules", () => ({
  default: () => <div data-testid="lead-routing-rules" />,
}));

const defaultLeadsData = {
  showForm: false,
  setShowForm: vi.fn(),
  editingId: null,
  filter: "all" as const,
  setFilter: vi.fn(),
  search: "",
  setSearch: vi.fn(),
  form: {} as Record<string, unknown>,
  setForm: vi.fn(),
  filtered: [],
  countByStatus: { new: 0, contacted: 0, viewed: 0, negotiating: 0, closed: 0, lost: 0 },
  handleSubmit: vi.fn(),
  handleDelete: vi.fn(),
  resetForm: vi.fn(),
  editLead: vi.fn(),
  leads: [],
  loading: false,
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <LeadsPage />
    </MemoryRouter>,
  );

describe("LeadsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLeadsPage.mockReturnValue({ ...defaultLeadsData });
  });

  it("renders leads page with components", () => {
    renderPage();
    expect(screen.getByText("Leads")).toBeInTheDocument();
    expect(screen.getByTestId("lead-filters")).toBeInTheDocument();
    expect(screen.getByTestId("lead-list")).toBeInTheDocument();
  });

  it("shows leads list count", () => {
    mockUseLeadsPage.mockReturnValue({
      ...defaultLeadsData,
      leads: [{ id: "1" }] as any[], // eslint-disable-line @typescript-eslint/no-explicit-any
    });
    renderPage();
    expect(screen.getByText("1 total leads")).toBeInTheDocument();
  });

  it("shows empty state", () => {
    renderPage();
    expect(screen.getByText("0 total leads")).toBeInTheDocument();
  });

  it("shows New Lead button", () => {
    renderPage();
    expect(screen.getByText("+ New Lead")).toBeInTheDocument();
  });

  it("shows LeadForm when showForm is true", () => {
    mockUseLeadsPage.mockReturnValue({
      ...defaultLeadsData,
      showForm: true,
    });
    renderPage();
    expect(screen.getByTestId("lead-form")).toBeInTheDocument();
  });
});
