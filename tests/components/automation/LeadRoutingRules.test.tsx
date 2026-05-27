import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LeadRoutingRules from "@/components/automation/LeadRoutingRules";

// Mock useFirestore hooks
const mockUseCollection = vi.fn();
vi.mock("@/hooks/useFirestore", () => ({
  useCollection: (...args: unknown[]) => mockUseCollection(...args),
}));

// Mock leadRoutingService
const mockGetRoutingConfig = vi.fn();
const mockSaveRoutingConfig = vi.fn();
vi.mock("@/services/leadRoutingService", () => ({
  getRoutingConfig: (...args: unknown[]) => mockGetRoutingConfig(...args),
  saveRoutingConfig: (...args: unknown[]) => mockSaveRoutingConfig(...args),
}));

const sampleAgents = [
  {
    id: "agent-1",
    displayName: "Alice",
    role: "agent" as const,
    email: "alice@test.com",
    isActive: true,
    createdAt: 1000000,
  },
  {
    id: "agent-2",
    displayName: "Bob",
    role: "agent" as const,
    email: "bob@test.com",
    isActive: true,
    createdAt: 1000000,
  },
  {
    id: "sub-1",
    displayName: "Charlie",
    role: "sub-agent" as const,
    email: "charlie@test.com",
    isActive: true,
    createdAt: 1000000,
  },
  {
    id: "broker-1",
    displayName: "Diana",
    role: "broker" as const,
    email: "diana@test.com",
    isActive: true,
    createdAt: 1000000,
  },
];

const defaultConfig = {
  enabled: false,
  rules: [],
};

describe("LeadRoutingRules", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCollection.mockReturnValue({
      data: sampleAgents,
      loading: false,
      error: null,
    });
    mockGetRoutingConfig.mockResolvedValue(defaultConfig);
    mockSaveRoutingConfig.mockResolvedValue(undefined);
  });

  it("returns null when not open", () => {
    const { container } = render(
      <LeadRoutingRules {...defaultProps} open={false} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders the modal with title", async () => {
    render(<LeadRoutingRules {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("Lead Routing Rules")).toBeInTheDocument();
    });
  });

  it("renders the enable toggle", async () => {
    render(<LeadRoutingRules {...defaultProps} />);
    await waitFor(() => {
      expect(
        screen.getByText("Enable automatic lead assignment"),
      ).toBeInTheDocument();
    });
  });

  it("shows empty state when no rules exist", async () => {
    render(<LeadRoutingRules {...defaultProps} />);
    await waitFor(() => {
      expect(
        screen.getByText("No rules configured. Add one below."),
      ).toBeInTheDocument();
    });
  });

  it("loads existing config on open", async () => {
    render(<LeadRoutingRules {...defaultProps} />);
    await waitFor(() => {
      expect(mockGetRoutingConfig).toHaveBeenCalled();
    });
  });

  it("renders add rule buttons", async () => {
    render(<LeadRoutingRules {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("+ Round Robin")).toBeInTheDocument();
      expect(screen.getByText("+ By Specialty")).toBeInTheDocument();
      expect(screen.getByText("+ By Location")).toBeInTheDocument();
    });
  });

  it("adds a round-robin rule when button is clicked", async () => {
    render(<LeadRoutingRules {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("+ Round Robin")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("+ Round Robin"));
    // Now the rule should appear
    expect(screen.getByText(/🔄 Round Robin/)).toBeInTheDocument();
    expect(screen.getByText(/Agent Rotation Order/)).toBeInTheDocument();
  });

  it("adds a specialty rule when button is clicked", async () => {
    render(<LeadRoutingRules {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("+ By Specialty")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("+ By Specialty"));
    expect(screen.getByText(/🎯 Specialty/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Leads with matching property interest are auto-assigned/,
      ),
    ).toBeInTheDocument();
  });

  it("adds a location rule when button is clicked", async () => {
    render(<LeadRoutingRules {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("+ By Location")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("+ By Location"));
    expect(screen.getByText(/📍 Location/)).toBeInTheDocument();
    expect(
      screen.getByText(/Leads with matching location are auto-assigned/),
    ).toBeInTheDocument();
  });

  it("allows removing a rule", async () => {
    render(<LeadRoutingRules {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("+ Round Robin")).toBeInTheDocument();
    });
    // Add a rule
    fireEvent.click(screen.getByText("+ Round Robin"));
    expect(screen.getByText(/🔄 Round Robin/)).toBeInTheDocument();
    // Remove the rule
    fireEvent.click(screen.getByText("Remove"));
    expect(screen.queryByText(/🔄 Round Robin/)).not.toBeInTheDocument();
    // Empty state should show again
    expect(
      screen.getByText("No rules configured. Add one below."),
    ).toBeInTheDocument();
  });

  it("shows agent options in round-robin select", async () => {
    render(<LeadRoutingRules {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("+ Round Robin")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("+ Round Robin"));
    // The round-robin select is the one with multiple attribute
    const agentSelect = document.querySelector("select[multiple]");
    expect(agentSelect).toBeInTheDocument();
    expect(agentSelect!.innerHTML).toContain("Alice");
    expect(agentSelect!.innerHTML).toContain("Bob");
    expect(agentSelect!.innerHTML).toContain("Charlie");
    // Broker should NOT be in the select
    expect(agentSelect!.innerHTML).not.toContain("Diana");
  });

  it("shows agent options in specialty and location selects", async () => {
    render(<LeadRoutingRules {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("+ By Specialty")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("+ By Specialty"));
    // Should have agent select with Alice, Bob, Charlie
    const agentSelect = screen.getByDisplayValue("Agent...");
    expect(agentSelect).toContainHTML("Alice");
    expect(agentSelect).toContainHTML("Bob");
    expect(agentSelect).toContainHTML("Charlie");
  });

  it("displays existing rules from config", async () => {
    mockGetRoutingConfig.mockResolvedValue({
      enabled: true,
      rules: [
        {
          type: "round-robin" as const,
          agentIds: ["agent-1", "agent-2"],
          currentIndex: 0,
        },
        {
          type: "specialty" as const,
          specialtyMap: { condo: "agent-1" },
        },
      ],
    });

    render(<LeadRoutingRules {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/🔄 Round Robin/)).toBeInTheDocument();
      expect(screen.getByText(/🎯 Specialty/)).toBeInTheDocument();
    });
  });

  it("toggles enable checkbox", async () => {
    render(<LeadRoutingRules {...defaultProps} />);
    await waitFor(() => {
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  it("renders Save and Cancel buttons", async () => {
    render(<LeadRoutingRules {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("Save Rules")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });
  });

  it("calls onClose when clicking Cancel", async () => {
    const onClose = vi.fn();
    render(<LeadRoutingRules {...defaultProps} onClose={onClose} />);
    await waitFor(() => {
      fireEvent.click(screen.getByText("Cancel"));
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("calls onClose when clicking the backdrop", async () => {
    const onClose = vi.fn();
    render(<LeadRoutingRules {...defaultProps} onClose={onClose} />);
    // The backdrop has the onClick handler (the outermost div with bg-black/50)
    await waitFor(() => {
      const backdrop =
        document.querySelector(".bg-black\\/50") ||
        document.querySelector('[class*="bg-black"]');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalled();
      }
    });
  });

  it("saves rules and shows success message", async () => {
    render(<LeadRoutingRules {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("+ Round Robin")).toBeInTheDocument();
    });
    // Add a rule
    fireEvent.click(screen.getByText("+ Round Robin"));
    // Save
    fireEvent.click(screen.getByText("Save Rules"));
    await waitFor(() => {
      expect(mockSaveRoutingConfig).toHaveBeenCalled();
      expect(screen.getByText(/Saved successfully/)).toBeInTheDocument();
    });
  });

  it("shows loading state while fetching config", async () => {
    mockUseCollection.mockReturnValue({
      data: [],
      loading: true,
      error: null,
    });
    // Make getRoutingConfig slow
    mockGetRoutingConfig.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 500)),
    );

    render(<LeadRoutingRules {...defaultProps} />);
    await waitFor(() => {
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });
  });

  it("shows error message when save fails", async () => {
    mockSaveRoutingConfig.mockRejectedValue(new Error("Save failed"));
    render(<LeadRoutingRules {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("+ Round Robin")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("+ Round Robin"));
    fireEvent.click(screen.getByText("Save Rules"));
    await waitFor(() => {
      expect(
        screen.getByText("Failed to save routing config"),
      ).toBeInTheDocument();
    });
  });
});
