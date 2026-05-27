import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import OnboardingTooltip from "@/components/OnboardingTooltip";

describe("OnboardingTooltip", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("should render children", () => {
    render(
      <OnboardingTooltip
        tooltipKey="test-tooltip"
        renderTrigger={(show) => (
          <button data-testid="trigger">Hover me</button>
        )}
      >
        <span data-testid="tooltip-content">Tooltip text</span>
      </OnboardingTooltip>,
    );

    // Trigger should always be rendered
    expect(screen.getByTestId("trigger")).toBeInTheDocument();
    expect(screen.getByText("Hover me")).toBeInTheDocument();
  });

  it("should show tooltip on first visit after delay", () => {
    render(
      <OnboardingTooltip
        tooltipKey="test-tooltip"
        renderTrigger={(show) => (
          <button data-testid="trigger">Hover me</button>
        )}
      >
        <span data-testid="tooltip-content">Tooltip text</span>
      </OnboardingTooltip>,
    );

    // Tooltip should not be visible immediately
    expect(screen.queryByText("Tooltip text")).not.toBeInTheDocument();

    // Fast-forward past the 500ms delay
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Tooltip should now be visible
    expect(screen.getByText("Tooltip text")).toBeInTheDocument();
  });

  it("should dismiss on click", () => {
    render(
      <OnboardingTooltip
        tooltipKey="test-tooltip"
        renderTrigger={(show) => (
          <button data-testid="trigger">Hover me</button>
        )}
      >
        <span data-testid="tooltip-content">Tooltip text</span>
      </OnboardingTooltip>,
    );

    // Fast-forward to show tooltip
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText("Tooltip text")).toBeInTheDocument();

    // Click dismiss button
    const dismissButton = screen.getByLabelText("Dismiss");
    fireEvent.click(dismissButton);

    // Tooltip should be dismissed
    expect(screen.queryByText("Tooltip text")).not.toBeInTheDocument();

    // Should set localStorage
    expect(localStorage.getItem("onboarding_test-tooltip")).toBe("dismissed");
  });

  it("should not show tooltip if already dismissed", () => {
    // Set localStorage to dismissed state
    localStorage.setItem("onboarding_test-tooltip", "dismissed");

    render(
      <OnboardingTooltip
        tooltipKey="test-tooltip"
        renderTrigger={(show) => (
          <button data-testid="trigger">Hover me</button>
        )}
      >
        <span data-testid="tooltip-content">Tooltip text</span>
      </OnboardingTooltip>,
    );

    // Fast-forward past the delay
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Tooltip should NOT be shown since it was dismissed
    expect(screen.queryByText("Tooltip text")).not.toBeInTheDocument();
  });
});
