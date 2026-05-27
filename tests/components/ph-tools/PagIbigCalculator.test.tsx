import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PagIbigCalculator } from "@/components/ph-tools/PagIbigCalculator";

describe("PagIbigCalculator", () => {
  it("renders the calculator title", () => {
    render(<PagIbigCalculator />);
    expect(screen.getByText("Pag-IBIG Loan Calculator")).toBeInTheDocument();
  });

  it("renders all input fields by display value", () => {
    render(<PagIbigCalculator />);
    // Default values
    expect(screen.getByDisplayValue("3000000")).toBeInTheDocument();
    expect(screen.getByDisplayValue("20")).toBeInTheDocument();
    expect(screen.getByDisplayValue("6.5")).toBeInTheDocument();
    // Select for loan term
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renders loan term options", () => {
    render(<PagIbigCalculator />);
    const select = screen.getByRole("combobox");
    expect(select).toContainHTML("5 years");
    expect(select).toContainHTML("10 years");
    expect(select).toContainHTML("15 years");
    expect(select).toContainHTML("20 years");
    expect(select).toContainHTML("25 years");
    expect(select).toContainHTML("30 years");
  });

  it("calculates and shows loan amount with default values", () => {
    render(<PagIbigCalculator />);
    // Default: price=3,000,000, downPayment=20% → loan=2,400,000
    expect(screen.getByText("₱2,400,000")).toBeInTheDocument();
  });

  it("calculates and shows down payment amount", () => {
    render(<PagIbigCalculator />);
    // 3,000,000 * 20% = 600,000
    expect(screen.getByText("₱600,000")).toBeInTheDocument();
  });

  it("shows monthly amortization with default values", () => {
    render(<PagIbigCalculator />);
    // 2.4M loan, 6.5% annual, 30 years
    expect(screen.getByText("₱15,169.63")).toBeInTheDocument();
  });

  it("updates loan amount when property price changes", () => {
    render(<PagIbigCalculator />);
    const priceInput = screen.getByDisplayValue("3000000");
    fireEvent.change(priceInput, { target: { value: "5000000" } });
    // 5,000,000 - 20% = 4,000,000
    expect(screen.getByText("₱4,000,000")).toBeInTheDocument();
  });

  it("updates down payment and loan amount when down payment percentage changes", () => {
    render(<PagIbigCalculator />);
    const dpInput = screen.getByDisplayValue("20");
    fireEvent.change(dpInput, { target: { value: "30" } });
    // 3,000,000 - 30% = 2,100,000
    expect(screen.getByText("₱2,100,000")).toBeInTheDocument();
  });

  it("updates when loan term changes", () => {
    render(<PagIbigCalculator />);
    // Default 30yr amort: ₱15,169.63
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "15" } });
    const amortText = screen.getByText(/^₱[\d,]+\.\d{2}$/);
    const amortValue = parseFloat(amortText.textContent!.replace(/[₱,]/g, ""));
    expect(amortValue).toBeGreaterThan(15000);
  });

  it("updates when interest rate changes", () => {
    render(<PagIbigCalculator />);
    const rateInput = screen.getByDisplayValue("6.5");
    fireEvent.change(rateInput, { target: { value: "8" } });
    // Higher rate = higher amortization (default was ₱15,169.63)
    const amortTexts = screen.getAllByText(/^₱[\d,]+\.\d{2}$/);
    const amortText = amortTexts[amortTexts.length - 1];
    const amortValue = parseFloat(amortText.textContent!.replace(/[₱,]/g, ""));
    expect(amortValue).toBeGreaterThan(15169.63);
  });

  it("handles zero interest rate gracefully", () => {
    render(<PagIbigCalculator />);
    const rateInput = screen.getByDisplayValue("6.5");
    fireEvent.change(rateInput, { target: { value: "0" } });
    // Straight-line: 2,400,000 / 360 = 6,666.67
    expect(screen.getByText("₱6,666.67")).toBeInTheDocument();
  });

  it("handles zero property price", () => {
    render(<PagIbigCalculator />);
    const priceInput = screen.getByDisplayValue("3000000");
    fireEvent.change(priceInput, { target: { value: "0" } });
    // Multiple elements show ₱0 (loan, down payment, amortization)
    const zeroElements = screen.getAllByText("₱0");
    expect(zeroElements.length).toBeGreaterThanOrEqual(1);
  });

  it("handles negative property price without crashing", () => {
    render(<PagIbigCalculator />);
    const priceInput = screen.getByDisplayValue("3000000");
    fireEvent.change(priceInput, { target: { value: "-1000000" } });
    // Should still render
    expect(screen.getByText("Pag-IBIG Loan Calculator")).toBeInTheDocument();
  });

  it("renders the Pag-IBIG reference table", () => {
    render(<PagIbigCalculator />);
    expect(
      screen.getByText("Pag-IBIG Max Loanable Amount Reference"),
    ).toBeInTheDocument();
  });

  it("renders all max loan tiers in reference table", () => {
    render(<PagIbigCalculator />);
    const summary = screen.getByText("Pag-IBIG Max Loanable Amount Reference");
    // Click to open the details
    fireEvent.click(summary);
    expect(screen.getByText("Up to ₱2M")).toBeInTheDocument();
    expect(screen.getByText("₱2M – ₱3M")).toBeInTheDocument();
    expect(screen.getByText("₱3M – ₱4.5M")).toBeInTheDocument();
    expect(screen.getByText("₱4.5M – ₱6M")).toBeInTheDocument();
    expect(screen.getByText("₱6M – ₱10M")).toBeInTheDocument();
  });

  it("shows the disclaimer", () => {
    render(<PagIbigCalculator />);
    expect(
      screen.getByText(/Actual rates depend on Pag-IBIG/),
    ).toBeInTheDocument();
  });
});
