import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BankCalculator } from "@/components/ph-tools/BankCalculator";

describe("BankCalculator", () => {
  it("renders the calculator title", () => {
    render(<BankCalculator />);
    expect(screen.getByText("Bank Financing Calculator")).toBeInTheDocument();
  });

  it("renders all input fields", () => {
    render(<BankCalculator />);
    expect(screen.getByDisplayValue("2500000")).toBeInTheDocument();
    const selects = screen.getAllByRole("combobox");
    expect(selects).toHaveLength(2);
  });

  it("renders all bank options in first select", () => {
    render(<BankCalculator />);
    const bankSelect = screen.getAllByRole("combobox")[0];
    expect(bankSelect).toContainHTML("BPI");
    expect(bankSelect).toContainHTML("BDO");
    expect(bankSelect).toContainHTML("Metrobank");
    expect(bankSelect).toContainHTML("Security Bank");
    expect(bankSelect).toContainHTML("EastWest");
  });

  it("renders all term options in second select", () => {
    render(<BankCalculator />);
    const termSelect = screen.getAllByRole("combobox")[1];
    expect(termSelect).toContainHTML("1 year");
    expect(termSelect).toContainHTML("3 years");
    expect(termSelect).toContainHTML("5 years");
    expect(termSelect).toContainHTML("10 years");
    expect(termSelect).toContainHTML("15 years");
    expect(termSelect).toContainHTML("20 years");
  });

  it("defaults to BPI by showing BPI name in results area", () => {
    render(<BankCalculator />);
    const bpiElements = screen.getAllByText("BPI");
    expect(bpiElements.length).toBeGreaterThanOrEqual(1);
  });

  it("shows interest rate for selected bank and term", () => {
    render(<BankCalculator />);
    const rateElements = screen.getAllByText(/9\.0%/);
    expect(rateElements.length).toBeGreaterThanOrEqual(1);
  });

  it("shows loan amount in results", () => {
    render(<BankCalculator />);
    expect(screen.getByText("₱2,500,000")).toBeInTheDocument();
  });

  it("shows monthly amortization for default values", () => {
    render(<BankCalculator />);
    expect(screen.getByText("₱31,668.94")).toBeInTheDocument();
  });

  it("shows total interest payable", () => {
    render(<BankCalculator />);
    expect(screen.getByText("Total Interest Payable")).toBeInTheDocument();
  });

  it("shows total payment", () => {
    render(<BankCalculator />);
    expect(screen.getByText("Total Payment")).toBeInTheDocument();
  });

  it("switches to BDO and shows BDO name", () => {
    render(<BankCalculator />);
    const bankSelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(bankSelect, { target: { value: "bdo" } });
    const bdoElements = screen.getAllByText("BDO");
    expect(bdoElements.length).toBeGreaterThanOrEqual(1);
  });

  it("switches to Metrobank", () => {
    render(<BankCalculator />);
    const bankSelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(bankSelect, { target: { value: "metrobank" } });
    const metroElements = screen.getAllByText("Metrobank");
    expect(metroElements.length).toBeGreaterThanOrEqual(1);
  });

  it("switches term and updates rate accordingly", () => {
    render(<BankCalculator />);
    const termSelect = screen.getAllByRole("combobox")[1];
    fireEvent.change(termSelect, { target: { value: "1" } });
    const rateElements = screen.getAllByText(/7\.5%/);
    expect(rateElements.length).toBeGreaterThanOrEqual(1);
  });

  it("updates results when loan amount changes", () => {
    render(<BankCalculator />);
    const amountInput = screen.getByDisplayValue("2500000");
    fireEvent.change(amountInput, { target: { value: "5000000" } });
    expect(screen.getByText("₱5,000,000")).toBeInTheDocument();
  });

  it("renders the rate comparison section", () => {
    render(<BankCalculator />);
    expect(
      screen.getByText(/Rate Comparison Across Banks/),
    ).toBeInTheDocument();
  });

  it("shows rate comparison for all banks when expanded", () => {
    render(<BankCalculator />);
    fireEvent.click(screen.getByText(/Rate Comparison Across Banks/));
    const comparisonDiv = screen
      .getByText(/Rate Comparison Across Banks/)
      .closest("details");
    expect(comparisonDiv).toBeTruthy();
    expect(comparisonDiv!.textContent).toContain("BPI");
    expect(comparisonDiv!.textContent).toContain("BDO");
    expect(comparisonDiv!.textContent).toContain("Metrobank");
    expect(comparisonDiv!.textContent).toContain("Security Bank");
    expect(comparisonDiv!.textContent).toContain("EastWest");
  });

  it("handles zero loan amount", () => {
    render(<BankCalculator />);
    const amountInput = screen.getByDisplayValue("2500000");
    fireEvent.change(amountInput, { target: { value: "0" } });
    const zeroElements = screen.getAllByText("₱0");
    expect(zeroElements.length).toBeGreaterThanOrEqual(1);
  });

  it("shows the disclaimer", () => {
    render(<BankCalculator />);
    expect(screen.getByText(/Rates are estimates/)).toBeInTheDocument();
  });

  it("shows Security Bank rates correctly", () => {
    render(<BankCalculator />);
    const bankSelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(bankSelect, { target: { value: "security-bank" } });
    const sbElements = screen.getAllByText("Security Bank");
    expect(sbElements.length).toBeGreaterThanOrEqual(1);
    // Rate appears in both result display and comparison — use getAll
    const rateElements = screen.getAllByText(/8\.75%/);
    expect(rateElements.length).toBeGreaterThanOrEqual(1);
  });

  it("shows EastWest rates correctly", () => {
    render(<BankCalculator />);
    const bankSelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(bankSelect, { target: { value: "eastwest" } });
    const ewElements = screen.getAllByText("EastWest");
    expect(ewElements.length).toBeGreaterThanOrEqual(1);
    const rateElements = screen.getAllByText(/9\.25%/);
    expect(rateElements.length).toBeGreaterThanOrEqual(1);
  });
});
