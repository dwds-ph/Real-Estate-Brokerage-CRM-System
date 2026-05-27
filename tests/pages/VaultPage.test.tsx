import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import VaultPage from "@/pages/VaultPage";

// Mock AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    userProfile: { id: "user-1", displayName: "Agent", role: "agent" },
  }),
}));

// Mock useVaultPage hook
const mockUseVaultPage = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/useVaultPage", () => ({
  useVaultPage: () => mockUseVaultPage(),
}));

// Mock child components
vi.mock("@/components/documents/DocumentTabs", () => ({
  DocumentTabs: () => <div data-testid="document-tabs" />,
}));

vi.mock("@/components/documents/DocumentList", () => ({
  default: () => <div data-testid="document-list" />,
}));

vi.mock("@/components/documents/DocumentDetail", () => ({
  DocumentDetail: () => <div data-testid="document-detail" />,
}));

vi.mock("@/components/documents/DocumentUpload", () => ({
  default: () => <div data-testid="document-upload" />,
}));

vi.mock("@/components/documents/DocumentRequestModal", () => ({
  default: () => <div data-testid="document-request-modal" />,
}));

vi.mock("@/components/documents/ExpiryBanner", () => ({
  ExpiryBanner: () => <div data-testid="expiry-banner" />,
}));

const defaultVaultData = {
  activeTab: "all",
  setActiveTab: vi.fn(),
  selectedDoc: null,
  setSelectedDoc: vi.fn(),
  showUpload: false,
  setShowUpload: vi.fn(),
  showRequest: false,
  setShowRequest: vi.fn(),
  categoryFilter: "all",
  setCategoryFilter: vi.fn(),
  stageFilter: "",
  setStageFilter: vi.fn(),
  versionHistory: [],
  setVersionHistory: vi.fn(),
  versionLoading: false,
  documents: [],
  byDeal: {},
  byListing: {},
  expiringDocs: [],
  myRequests: [],
  categoryCounts: { all: 0 },
  uniqueStages: [],
  docsLoading: false,
  docsError: null,
  reqsLoading: false,
  loadVersionHistory: vi.fn(),
  handleDelete: vi.fn(),
};

describe("VaultPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseVaultPage.mockReturnValue({ ...defaultVaultData });
  });

  it("renders vault page with tabs", () => {
    render(<VaultPage />);
    expect(screen.getByText("Document Vault")).toBeInTheDocument();
    expect(screen.getByTestId("document-tabs")).toBeInTheDocument();
  });

  it("shows document tabs", () => {
    render(<VaultPage />);
    expect(screen.getByTestId("document-tabs")).toBeInTheDocument();
  });

  it("shows upload button", () => {
    render(<VaultPage />);
    expect(screen.getByText("+ Upload")).toBeInTheDocument();
  });

  it("shows request button", () => {
    render(<VaultPage />);
    expect(screen.getByText(/Request/)).toBeInTheDocument();
  });

  it("shows document count", () => {
    mockUseVaultPage.mockReturnValue({
      ...defaultVaultData,
      documents: [{ id: "doc-1", name: "Test" }],
      categoryCounts: { all: 1 },
    });
    render(<VaultPage />);
    expect(screen.getByText("1 document in your vault")).toBeInTheDocument();
  });

  it("shows expiry banner when there are expiring documents", () => {
    mockUseVaultPage.mockReturnValue({
      ...defaultVaultData,
      expiringDocs: [{ id: "doc-1", name: "Expiring Doc" }],
    });
    render(<VaultPage />);
    expect(screen.getByTestId("expiry-banner")).toBeInTheDocument();
  });

  it("renders DocumentUpload modal when showUpload is true", () => {
    mockUseVaultPage.mockReturnValue({
      ...defaultVaultData,
      showUpload: true,
    });
    render(<VaultPage />);
    expect(screen.getByTestId("document-upload")).toBeInTheDocument();
  });

  it("renders DocumentRequestModal when showRequest is true", () => {
    mockUseVaultPage.mockReturnValue({
      ...defaultVaultData,
      showRequest: true,
    });
    render(<VaultPage />);
    expect(screen.getByTestId("document-request-modal")).toBeInTheDocument();
  });
});
