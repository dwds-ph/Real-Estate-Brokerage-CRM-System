import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ChecklistWidget from "@/components/automation/ChecklistWidget";

// Mock AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: { uid: "user-1" },
    userProfile: { id: "user-1", role: "agent", displayName: "Test Agent" },
    loading: false,
  })),
}));

// Mock checklist service
const mockFetchTemplates = vi.fn();
const mockFetchInstances = vi.fn();
const mockCreateInstance = vi.fn();
const mockUpdateInstance = vi.fn();

vi.mock("@/services/checklistService", () => ({
  fetchChecklistTemplates: (...args: unknown[]) => mockFetchTemplates(...args),
  fetchChecklistInstances: (...args: unknown[]) => mockFetchInstances(...args),
  createChecklistInstance: (...args: unknown[]) => mockCreateInstance(...args),
  updateChecklistInstance: (...args: unknown[]) => mockUpdateInstance(...args),
}));

const defaultTemplates = [
  {
    id: "tpl-1",
    name: "Lead Intake",
    scope: "lead",
    items: [
      { label: "Call lead", required: true },
      { label: "Send info", required: false },
    ],
    createdBy: "user-1",
    createdAt: 1000000,
  },
];

const defaultInstances = [
  {
    id: "inst-1",
    templateId: "tpl-1",
    templateName: "Lead Intake",
    scopeType: "lead" as const,
    scopeId: "scope-1",
    items: [
      { label: "Call lead", required: true, done: true },
      { label: "Send info", required: false, done: false },
    ],
    progress: 50,
    createdAt: 1000000,
  },
];

describe("ChecklistWidget", () => {
  const defaultProps = {
    scopeType: "lead" as const,
    scopeId: "scope-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows checklist items", async () => {
    mockFetchTemplates.mockResolvedValue(defaultTemplates);
    mockFetchInstances.mockResolvedValue(defaultInstances);

    render(<ChecklistWidget {...defaultProps} />);

    // Wait for items to appear after load
    const callLeadItem = await screen.findByText("Call lead");
    expect(callLeadItem).toBeInTheDocument();
    expect(screen.getByText("Send info")).toBeInTheDocument();
  });

  it("shows progress", async () => {
    mockFetchTemplates.mockResolvedValue(defaultTemplates);
    mockFetchInstances.mockResolvedValue(defaultInstances);

    render(<ChecklistWidget {...defaultProps} />);

    const progressText = await screen.findByText("50%");
    expect(progressText).toBeInTheDocument();
    expect(screen.getByText(/1\/2 done/)).toBeInTheDocument();
  });

  it("allows checking items", async () => {
    mockFetchTemplates.mockResolvedValue(defaultTemplates);
    mockFetchInstances.mockResolvedValue(defaultInstances);
    mockUpdateInstance.mockResolvedValue(undefined);

    render(<ChecklistWidget {...defaultProps} />);

    // Wait for items to render
    await screen.findByText("Call lead");

    // Find unchecked checkbox (Send info is not done)
    const checkboxes = screen.getAllByRole("checkbox");
    const uncheckedCheckbox = checkboxes.find(
      (cb) => !(cb as HTMLInputElement).checked,
    );
    expect(uncheckedCheckbox).toBeDefined();

    // Toggle it
    if (uncheckedCheckbox) {
      fireEvent.click(uncheckedCheckbox);
    }

    // Should have triggered update
    expect(mockUpdateInstance).toHaveBeenCalled();
  });
});
