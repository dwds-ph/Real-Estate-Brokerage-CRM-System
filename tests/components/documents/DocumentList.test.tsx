import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DocumentList from "@/components/documents/DocumentList";
import type { VaultDocument } from "@/types";

const createMockDoc = (overrides: Partial<VaultDocument> = {}): VaultDocument => ({
  id: "doc-1",
  dealId: "deal-1",
  name: "Contract.pdf",
  fileUrl: "https://storage.example.com/contract.pdf",
  fileType: "application/pdf",
  fileSize: 102400,
  category: "contract",
  uploadedBy: "user-1",
  uploadedAt: 1000000,
  version: 1,
  tags: [],
  ...overrides,
});

const sampleDocs: VaultDocument[] = [
  createMockDoc({ id: "doc-1", name: "Contract.pdf", category: "contract" }),
  createMockDoc({ id: "doc-2", name: "ID Scan.jpg", fileType: "image/jpeg", category: "identification" }),
  createMockDoc({ id: "doc-3", name: "Tax Report.xlsx", fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", category: "tax" }),
];

describe("DocumentList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders list of documents", () => {
    render(
      <DocumentList
        documents={sampleDocs}
        loading={false}
        error={null}
      />,
    );

    expect(screen.getByText("Contract.pdf")).toBeInTheDocument();
    expect(screen.getByText("ID Scan.jpg")).toBeInTheDocument();
    expect(screen.getByText("Tax Report.xlsx")).toBeInTheDocument();
    // Should show count
    expect(screen.getByText("3 documents")).toBeInTheDocument();
  });

  it("shows empty state when no docs", () => {
    render(
      <DocumentList
        documents={[]}
        loading={false}
        error={null}
      />,
    );

    expect(screen.getByText("No documents found")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(
      <DocumentList
        documents={[]}
        loading={true}
        error={null}
      />,
    );

    // Loading spinner should be rendered
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("calls onSelect when document clicked", () => {
    const onSelect = vi.fn();
    render(
      <DocumentList
        documents={sampleDocs}
        loading={false}
        error={null}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByText("Contract.pdf"));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "doc-1", name: "Contract.pdf" }),
    );
  });
});
