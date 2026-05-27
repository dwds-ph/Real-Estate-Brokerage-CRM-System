import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DocumentUpload from "@/components/documents/DocumentUpload";

// Mock AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: { uid: "user-1" },
    userProfile: { id: "user-1", role: "agent", displayName: "Test Agent" },
    loading: false,
  })),
}));

// Mock documentVault service
vi.mock("@/services/documentVault", () => ({
  uploadVaultFile: vi.fn(
    (
      _file: File,
      _userId: string,
      progressCb?: (p: {
        progress: number;
        bytesTransferred: number;
        totalBytes: number;
      }) => void,
    ) => {
      if (progressCb) {
        progressCb({ progress: 50, bytesTransferred: 512, totalBytes: 1024 });
      }
      return Promise.resolve("https://storage.example.com/file.pdf");
    },
  ),
  createVaultDocument: vi.fn(() => Promise.resolve("doc-id")),
  UploadProgress: {},
}));

// Mock child components - these are all NAMED exports
vi.mock("@/components/documents/FilePicker", () => ({
  FilePicker: ({
    onFileSelect,
    file,
  }: {
    onFileSelect: (f: File) => void;
    file: File | null;
  }) => (
    <div data-testid="file-picker">
      {!file && (
        <button
          data-testid="select-file-btn"
          onClick={() =>
            onFileSelect(
              new File(["test"], "test.pdf", { type: "application/pdf" }),
            )
          }
        >
          Select File
        </button>
      )}
      {file && <span data-testid="file-selected">{file.name}</span>}
    </div>
  ),
}));

vi.mock("@/components/documents/DocumentMetadataForm", () => ({
  DocumentMetadataForm: ({
    form,
    onChange,
  }: {
    form: { name: string };
    onChange: (field: string, value: string) => void;
  }) => (
    <div data-testid="metadata-form">
      <input
        data-testid="doc-name-input"
        value={form.name}
        onChange={(e) => onChange("name", e.target.value)}
      />
    </div>
  ),
}));

vi.mock("@/components/documents/UploadProgress", () => ({
  UploadProgress: ({ progress }: { progress: number }) => (
    <div data-testid="upload-progress">Progress: {progress}%</div>
  ),
}));

describe("DocumentUpload", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders upload form when open", () => {
    render(<DocumentUpload {...defaultProps} />);

    expect(screen.getByText("Upload Document")).toBeInTheDocument();
    expect(screen.getByTestId("file-picker")).toBeInTheDocument();
    expect(screen.getByTestId("metadata-form")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    const { container } = render(
      <DocumentUpload {...defaultProps} open={false} />,
    );

    expect(container.innerHTML).toBe("");
  });

  it("shows upload button", async () => {
    vi.useFakeTimers();
    render(<DocumentUpload {...defaultProps} />);

    // Flush the useEffect's setTimeout(0) reset timer
    vi.advanceTimersByTime(10);

    // Switch to real timers for async operations
    vi.useRealTimers();

    // Upload button should exist
    const uploadBtn = screen.getByText("Upload");
    expect(uploadBtn).toBeInTheDocument();
  });
});
