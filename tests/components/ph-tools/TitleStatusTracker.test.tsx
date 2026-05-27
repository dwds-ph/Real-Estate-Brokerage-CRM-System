import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TitleStatusTracker } from "@/components/ph-tools/TitleStatusTracker";

describe("TitleStatusTracker", () => {
  it("renders the tracker title", () => {
    render(<TitleStatusTracker />);
    expect(screen.getByText("Title Status Tracker")).toBeInTheDocument();
  });

  it("renders deal price input", () => {
    render(<TitleStatusTracker />);
    expect(screen.getByDisplayValue("5000000")).toBeInTheDocument();
  });

  it("renders all 5 title stages", () => {
    render(<TitleStatusTracker />);
    const withSeller = screen.getAllByText("With Seller");
    expect(withSeller.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("BIR (CGT)").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText("Registry of Deeds").length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText("Transfer to Buyer").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Complete").length).toBeGreaterThanOrEqual(1);
  });

  it("shows current stage description for default stage", () => {
    render(<TitleStatusTracker />);
    expect(
      screen.getByText(/Gather documents from seller/),
    ).toBeInTheDocument();
  });

  it("advances stage when clicking BIR stage button", () => {
    render(<TitleStatusTracker />);
    const birBtn = screen.getAllByText("BIR (CGT)")[0].previousElementSibling;
    if (birBtn) fireEvent.click(birBtn);
    expect(screen.getByText(/Pay 6% Capital Gains Tax/)).toBeInTheDocument();
  });

  it("advances to Complete stage", () => {
    render(<TitleStatusTracker />);
    const allComplete = screen.getAllByText("Complete");
    const btn = allComplete[0].previousElementSibling;
    if (btn) fireEvent.click(btn);
    expect(screen.getByText(/All stages done/)).toBeInTheDocument();
  });

  it("renders progress bar", () => {
    render(<TitleStatusTracker />);
    const progressBar = document.querySelector(".bg-primary.rounded-full");
    expect(progressBar).toBeInTheDocument();
  });

  it("renders document checklist section", () => {
    render(<TitleStatusTracker />);
    expect(screen.getByText("Document Checklist")).toBeInTheDocument();
  });

  it("shows documents for With Seller stage by default", () => {
    render(<TitleStatusTracker />);
    expect(screen.getByText("Original TCT/CCT title")).toBeInTheDocument();
    expect(screen.getByText("Tax Declaration")).toBeInTheDocument();
    expect(
      screen.getByText("Latest Real Property Tax Receipt"),
    ).toBeInTheDocument();
  });

  it("toggles document status on click", () => {
    render(<TitleStatusTracker />);
    const docItem = screen.getByText("Original TCT/CCT title");
    fireEvent.click(docItem);
    expect(screen.getAllByText("submitted").length).toBeGreaterThanOrEqual(1);
    fireEvent.click(docItem);
    expect(screen.getAllByText("done").length).toBeGreaterThanOrEqual(1);
    fireEvent.click(docItem);
    expect(screen.getAllByText("pending").length).toBeGreaterThanOrEqual(1);
  });

  it("shows document counts per stage", () => {
    render(<TitleStatusTracker />);
    expect(screen.getByText(/With Seller \(5 docs\)/)).toBeInTheDocument();
    expect(screen.getByText(/BIR \(CGT\) \(5 docs\)/)).toBeInTheDocument();
    expect(
      screen.getByText(/Registry of Deeds \(5 docs\)/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Transfer to Buyer \(4 docs\)/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Complete \(3 docs\)/)).toBeInTheDocument();
  });

  it("shows estimated closing costs section", () => {
    render(<TitleStatusTracker />);
    const costElements = screen.getAllByText(/Estimated Closing Costs/);
    expect(costElements.length).toBeGreaterThanOrEqual(1);
  });

  it("shows closing cost breakdown when expanded", () => {
    render(<TitleStatusTracker />);
    fireEvent.click(screen.getAllByText(/Estimated Closing Costs/)[0]);
    expect(screen.getByText(/Capital Gains Tax/)).toBeInTheDocument();
    expect(screen.getByText(/Documentary Stamp Tax/)).toBeInTheDocument();
    // "Transfer Tax" appears in both label and value when expanded
    const transferTaxElements = screen.getAllByText(/Transfer Tax/);
    expect(transferTaxElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Miscellaneous Fees/)).toBeInTheDocument();
    expect(
      screen.getByText(/Total Estimated Closing Costs/),
    ).toBeInTheDocument();
  });

  it("updates closing costs when deal price changes", () => {
    render(<TitleStatusTracker />);
    const priceInput = screen.getByDisplayValue("5000000");
    fireEvent.change(priceInput, { target: { value: "10000000" } });
    fireEvent.click(screen.getAllByText(/Estimated Closing Costs/)[0]);
    expect(screen.getByText("₱600,000")).toBeInTheDocument();
  });

  it("shows BIR documents when BIR stage is active", () => {
    render(<TitleStatusTracker />);
    const birBtn = screen.getAllByText("BIR (CGT)")[0].previousElementSibling;
    fireEvent.click(birBtn!);
    expect(
      screen.getByText("Notarized Deed of Absolute Sale"),
    ).toBeInTheDocument();
    expect(screen.getByText("BIR Form 1706 (CGT return)")).toBeInTheDocument();
  });

  it("shows documents for Transfer stage", () => {
    render(<TitleStatusTracker />);
    const transferBtn =
      screen.getAllByText("Transfer to Buyer")[0].previousElementSibling;
    fireEvent.click(transferBtn!);
    expect(screen.getByText("New owner info/bio-data")).toBeInTheDocument();
  });

  it("shows documents for Complete stage", () => {
    render(<TitleStatusTracker />);
    const completeBtn =
      screen.getAllByText("Complete")[0].previousElementSibling;
    fireEvent.click(completeBtn!);
    expect(screen.getByText("New TCT under buyer name")).toBeInTheDocument();
  });

  it("shows the closing costs disclaimer", () => {
    render(<TitleStatusTracker />);
    fireEvent.click(screen.getAllByText(/Estimated Closing Costs/)[0]);
    expect(screen.getByText(/Actual costs vary by LGU/)).toBeInTheDocument();
  });

  it("shows done documents with strikethrough styling", () => {
    render(<TitleStatusTracker />);
    const docItem = screen.getByText("Original TCT/CCT title");
    fireEvent.click(docItem);
    fireEvent.click(docItem);
    const span = screen.getByText("Original TCT/CCT title");
    expect(span.className).toContain("line-through");
  });

  it("shows submitted documents with paperclip icon", () => {
    render(<TitleStatusTracker />);
    const docItem = screen.getByText("Original TCT/CCT title");
    fireEvent.click(docItem);
    expect(docItem.parentElement?.textContent).toContain("📎");
  });

  it("shows pending documents with white square icon by default", () => {
    render(<TitleStatusTracker />);
    const docItem = screen.getByText("Original TCT/CCT title");
    expect(docItem.parentElement?.textContent).toContain("⬜");
  });
});
