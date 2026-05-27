import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MortgageForm from "@/components/mortgage/MortgageForm";
import { BANKS } from "@/services/mortgageService";

// Mock mortgage service
vi.mock("@/services/mortgageService", async () => {
  const actual = await vi.importActual("@/services/mortgageService");
  return {
    ...actual,
    createMortgage: vi.fn(),
    updateMortgage: vi.fn(),
  };
});

const { createMortgage } = await import("@/services/mortgageService");

describe("MortgageForm", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    dealId: "deal-1",
    existingMortgage: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders bank selector", () => {
    render(<MortgageForm {...defaultProps} />);

    expect(screen.getByText("New Mortgage")).toBeInTheDocument();
    // All banks should be rendered as selectable buttons
    BANKS.forEach((bank) => {
      // Use getAllByText since bank name may appear in both button and info
      const matches = screen.getAllByText(bank.name);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows bank info when bank selected", () => {
    render(<MortgageForm {...defaultProps} />);

    // BPI is the default selected bank, so its info should appear
    const bpi = BANKS.find((b) => b.id === "bpi");
    // Check for the typical rate and timeline in the info section
    expect(
      screen.getByText(new RegExp(`${bpi!.estimatedTimelineDays} days`)),
    ).toBeInTheDocument();
    // The typical rate appears in both bank button and info section
    const rateElements = screen.getAllByText(bpi!.typicalRate);
    expect(rateElements.length).toBeGreaterThanOrEqual(1);
  });

  it("validates loan amount input", async () => {
    render(<MortgageForm {...defaultProps} />);

    // Set an invalid loan amount (0 passes the disabled check but fails validation)
    const loanInput = screen.getByPlaceholderText("e.g. 3000000");
    fireEvent.change(loanInput, { target: { value: "0" } });

    // Submit with invalid loan amount should show error
    const submitBtn = screen.getByText("Create Mortgage");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Please enter a valid loan amount"),
      ).toBeInTheDocument();
    });
  });

  it("shows formatted currency preview for valid loan amount", () => {
    render(<MortgageForm {...defaultProps} />);

    const loanInput = screen.getByPlaceholderText("e.g. 3000000");
    fireEvent.change(loanInput, { target: { value: "5000000" } });

    // Should show formatted currency (₱5,000,000)
    expect(screen.getByText(/₱5[,.]000[,.]000/)).toBeInTheDocument();
  });

  it("calls createMortgage on submit with valid data", async () => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    render(
      <MortgageForm
        {...defaultProps}
        onSuccess={onSuccess}
        onClose={onClose}
      />,
    );

    const loanInput = screen.getByPlaceholderText("e.g. 3000000");
    fireEvent.change(loanInput, { target: { value: "4000000" } });

    const submitBtn = screen.getByText("Create Mortgage");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(vi.mocked(createMortgage)).toHaveBeenCalledWith({
        dealId: "deal-1",
        bankId: "bpi",
        bankName: "BPI",
        loanAmount: 4000000,
      });
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("returns null when not open", () => {
    const { container } = render(
      <MortgageForm {...defaultProps} open={false} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("shows edit mode for existing mortgage", () => {
    const existingMortgage = {
      id: "mort-1",
      dealId: "deal-1",
      bankId: "bdo",
      bankName: "BDO",
      loanAmount: 2500000,
      status: "ongoing" as const,
      currentStage: "application" as const,
      stages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    render(
      <MortgageForm {...defaultProps} existingMortgage={existingMortgage} />,
    );

    expect(screen.getByText("Edit Mortgage")).toBeInTheDocument();
    expect(screen.getByText("Update")).toBeInTheDocument();
  });
});
