import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ShortcutsHelpModal from "@/components/ShortcutsHelpModal";
import type { ShortcutDef } from "@/hooks/useKeyboardShortcuts";

const mockShortcuts: ShortcutDef[] = [
  {
    keys: ["N"],
    label: "N",
    description: "New lead",
    action: { type: "action", handler: vi.fn() },
  },
  {
    keys: ["E"],
    label: "E",
    description: "Edit lead",
    action: { type: "action", handler: vi.fn() },
  },
  {
    keys: ["?"],
    label: "?",
    description: "Toggle shortcuts help",
    action: { type: "toggleHelp" },
  },
];

describe("ShortcutsHelpModal", () => {
  it("should render when open", () => {
    render(
      <ShortcutsHelpModal
        open={true}
        onClose={vi.fn()}
        shortcuts={mockShortcuts}
      />,
    );

    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    expect(screen.getByText("New lead")).toBeInTheDocument();
    expect(screen.getByText("Edit lead")).toBeInTheDocument();
    expect(screen.getByText("Toggle shortcuts help")).toBeInTheDocument();
  });

  it("should render nothing when closed", () => {
    const { container } = render(
      <ShortcutsHelpModal
        open={false}
        onClose={vi.fn()}
        shortcuts={mockShortcuts}
      />,
    );

    expect(container.innerHTML).toBe("");
  });

  it("should show shortcut list with keys", () => {
    render(
      <ShortcutsHelpModal
        open={true}
        onClose={vi.fn()}
        shortcuts={mockShortcuts}
      />,
    );

    // Check that kbd elements are rendered for each shortcut
    // The shortcut keys appear in kbd elements
    expect(screen.getByText("N", { selector: "kbd" })).toBeInTheDocument();
    expect(screen.getByText("E", { selector: "kbd" })).toBeInTheDocument();
  });

  it("should call onClose when dismissed", () => {
    const onClose = vi.fn();
    render(
      <ShortcutsHelpModal
        open={true}
        onClose={onClose}
        shortcuts={mockShortcuts}
      />,
    );

    // Click the Esc button
    fireEvent.click(screen.getByText("Esc"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should show the help hint at bottom", () => {
    render(
      <ShortcutsHelpModal
        open={true}
        onClose={vi.fn()}
        shortcuts={mockShortcuts}
      />,
    );

    expect(screen.getByText(/press/i)).toBeInTheDocument();
    // There are multiple "?" elements (one in shortcut list, one in hint)
    const questionMarks = screen.getAllByText("?");
    expect(questionMarks.length).toBeGreaterThanOrEqual(1);
  });
});
