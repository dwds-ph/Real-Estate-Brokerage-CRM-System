import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CalendarPage from "@/pages/CalendarPage";

// Mock child components
vi.mock("@/components/calendar/UnifiedCalendar", () => ({
  default: () => <div data-testid="unified-calendar" />,
}));

vi.mock("@/components/calendar/SmartReminders", () => ({
  default: () => <div data-testid="smart-reminders" />,
}));

vi.mock("@/components/calendar/QuickCreate", () => ({
  default: (props: { open: boolean; onClose: () => void }) =>
    props.open ? <div data-testid="quick-create-modal" /> : null,
}));

describe("CalendarPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders calendar page", () => {
    render(<CalendarPage />);
    expect(screen.getByText("Calendar")).toBeInTheDocument();
  });

  it("shows calendar view", () => {
    render(<CalendarPage />);
    expect(screen.getByTestId("unified-calendar")).toBeInTheDocument();
  });

  it("shows smart reminders section", () => {
    render(<CalendarPage />);
    expect(screen.getByTestId("smart-reminders")).toBeInTheDocument();
  });

  it("shows Quick Create button", () => {
    render(<CalendarPage />);
    expect(screen.getByText("Quick Create")).toBeInTheDocument();
  });

  it("shows Quick Create modal when button clicked", () => {
    render(<CalendarPage />);
    const btn = screen.getByText("Quick Create");
    fireEvent.click(btn);
    expect(screen.getByTestId("quick-create-modal")).toBeInTheDocument();
  });

  it("shows description text", () => {
    render(<CalendarPage />);
    expect(
      screen.getByText(
        "Unified view of viewings, tasks, deals, and document expiries",
      ),
    ).toBeInTheDocument();
  });
});
