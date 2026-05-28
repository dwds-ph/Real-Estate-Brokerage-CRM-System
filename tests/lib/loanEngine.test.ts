import { describe, it, expect } from "vitest";
import {
  pagibigDefaults,
  bankDefaults,
  inHouseDefaults,
  computeAmortization,
  checkAffordability,
  computeComparison,
} from "@/lib/loanEngine";
import type { LoanInput } from "@/types";

// ─── pagibigDefaults ──────────────────────────────────────────────────

describe("pagibigDefaults", () => {
  it("returns rate of 6%", () => {
    expect(pagibigDefaults().rate).toBe(6.0);
  });

  it("returns max term of 30 years", () => {
    expect(pagibigDefaults().maxTerm).toBe(30);
  });

  it("returns max amount of 6 million PHP", () => {
    expect(pagibigDefaults().maxAmount).toBe(6_000_000);
  });

  it("returns a frozen-like object shape", () => {
    const d = pagibigDefaults();
    expect(d).toEqual({ rate: 6.0, maxTerm: 30, maxAmount: 6_000_000 });
  });
});

// ─── bankDefaults ─────────────────────────────────────────────────────

describe("bankDefaults", () => {
  it("returns rate of 7%", () => {
    expect(bankDefaults().rate).toBe(7.0);
  });

  it("returns max term of 20 years", () => {
    expect(bankDefaults().maxTerm).toBe(20);
  });

  it("ignores the optional propertyPrice parameter", () => {
    expect(bankDefaults(5_000_000)).toEqual({ rate: 7.0, maxTerm: 20 });
    expect(bankDefaults(0)).toEqual({ rate: 7.0, maxTerm: 20 });
    expect(bankDefaults(1e9)).toEqual({ rate: 7.0, maxTerm: 20 });
  });

  it("works without any argument", () => {
    expect(bankDefaults()).toEqual({ rate: 7.0, maxTerm: 20 });
  });
});

// ─── inHouseDefaults ──────────────────────────────────────────────────

describe("inHouseDefaults", () => {
  it("returns rate of 10%", () => {
    expect(inHouseDefaults().rate).toBe(10.0);
  });

  it("returns max term of 15 years", () => {
    expect(inHouseDefaults().maxTerm).toBe(15);
  });

  it("returns a frozen-like object shape", () => {
    expect(inHouseDefaults()).toEqual({ rate: 10.0, maxTerm: 15 });
  });
});

// ─── computeAmortization ──────────────────────────────────────────────

describe("computeAmortization", () => {
  const baseInput: LoanInput = {
    loanType: "bank",
    propertyPrice: 5_000_000,
    downPayment: 1_000_000,
    loanTerm: 20,
    annualRate: 7.0,
  };

  // ── Empty / edge cases ──────────────────────────────────────────

  it("returns empty array when principal is zero (price === downPayment)", () => {
    const input: LoanInput = {
      ...baseInput,
      propertyPrice: 1_000_000,
      downPayment: 1_000_000,
    };
    expect(computeAmortization(input)).toEqual([]);
  });

  it("returns empty array when principal is negative (price < downPayment)", () => {
    const input: LoanInput = {
      ...baseInput,
      propertyPrice: 500_000,
      downPayment: 1_000_000,
    };
    expect(computeAmortization(input)).toEqual([]);
  });

  it("returns empty array when loanTerm is zero", () => {
    const input: LoanInput = { ...baseInput, loanTerm: 0 };
    expect(computeAmortization(input)).toEqual([]);
  });

  it("returns empty array when loanTerm is negative", () => {
    const input: LoanInput = { ...baseInput, loanTerm: -5 };
    expect(computeAmortization(input)).toEqual([]);
  });

  it("returns empty array when annualRate is zero", () => {
    const input: LoanInput = { ...baseInput, annualRate: 0 };
    expect(computeAmortization(input)).toEqual([]);
  });

  it("returns empty array when annualRate is negative", () => {
    const input: LoanInput = { ...baseInput, annualRate: -3 };
    expect(computeAmortization(input)).toEqual([]);
  });

  // ── Basic computation ────────────────────────────────────────────

  it("computes correct monthly payment using standard amortization formula", () => {
    const input: LoanInput = {
      loanType: "pagibig",
      propertyPrice: 3_000_000,
      downPayment: 300_000,
      loanTerm: 30,
      annualRate: 6.0,
    };
    const rows = computeAmortization(input);
    expect(rows.length).toBeGreaterThan(0);

    const principal = input.propertyPrice - input.downPayment; // 2_700_000
    const monthlyRate = 6.0 / 100 / 12;
    const months = 30 * 12;
    const expectedPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);

    expect(rows[0].payment).toBeCloseTo(expectedPayment, 2);
  });

  it("returns 360 rows for a 30-year term (fully amortized)", () => {
    const input: LoanInput = {
      loanType: "pagibig",
      propertyPrice: 3_000_000,
      downPayment: 300_000,
      loanTerm: 30,
      annualRate: 6.0,
    };
    const rows = computeAmortization(input);
    expect(rows).toHaveLength(360);
  });

  it("returns 240 rows for a 20-year term", () => {
    const input: LoanInput = { ...baseInput, loanTerm: 20 };
    const rows = computeAmortization(input);
    expect(rows).toHaveLength(240);
  });

  it("returns 180 rows for a 15-year term", () => {
    const input: LoanInput = { ...baseInput, loanTerm: 15 };
    const rows = computeAmortization(input);
    expect(rows).toHaveLength(180);
  });

  it("returns 1 row for a 1-month (1/12 year) term", () => {
    const input: LoanInput = { ...baseInput, loanTerm: 1 / 12 };
    const rows = computeAmortization(input);
    expect(rows).toHaveLength(1);
  });

  // ── Row structure ────────────────────────────────────────────────

  it("each row has the correct AmortizationRow shape", () => {
    const rows = computeAmortization(baseInput);
    for (const row of rows) {
      expect(row).toHaveProperty("month");
      expect(row).toHaveProperty("year");
      expect(row).toHaveProperty("beginningBalance");
      expect(row).toHaveProperty("payment");
      expect(row).toHaveProperty("principal");
      expect(row).toHaveProperty("interest");
      expect(row).toHaveProperty("endingBalance");
    }
  });

  it("row 1 begins with the full principal as beginningBalance", () => {
    const rows = computeAmortization(baseInput);
    const principal = baseInput.propertyPrice - baseInput.downPayment; // 4_000_000
    expect(rows[0].beginningBalance).toBeCloseTo(principal, 2);
  });

  it("each month increments correctly", () => {
    const rows = computeAmortization(baseInput);
    for (let i = 0; i < rows.length; i++) {
      expect(rows[i].month).toBe(i + 1);
    }
  });

  it("year is correctly computed as ceil(month / 12)", () => {
    const rows = computeAmortization(baseInput);
    for (const row of rows) {
      expect(row.year).toBe(Math.ceil(row.month / 12));
    }
  });

  it("payment is constant across all periods (fixed-rate)", () => {
    const rows = computeAmortization(baseInput);
    const firstPayment = rows[0].payment;
    for (const row of rows) {
      expect(row.payment).toBeCloseTo(firstPayment, 6);
    }
  });

  // ── Interest & principal breakdown ───────────────────────────────

  it("first payment has more interest than principal", () => {
    const rows = computeAmortization(baseInput);
    // Early in the loan, interest is high
    expect(rows[0].interest).toBeGreaterThan(rows[0].principal);
  });

  it("last payment has more principal than interest", () => {
    const rows = computeAmortization(baseInput);
    const last = rows[rows.length - 1];
    expect(last.principal).toBeGreaterThan(last.interest);
  });

  it("principal portion increases over time, interest decreases", () => {
    const rows = computeAmortization(baseInput);
    // Compare first, middle, and last
    const first = rows[0];
    const mid = rows[Math.floor(rows.length / 2)];
    const last = rows[rows.length - 1];

    expect(first.principal).toBeLessThan(mid.principal);
    expect(mid.principal).toBeLessThan(last.principal);
    expect(first.interest).toBeGreaterThan(mid.interest);
    expect(mid.interest).toBeGreaterThan(last.interest);
  });

  it("interest + principal equals payment for each row", () => {
    const rows = computeAmortization(baseInput);
    for (const row of rows) {
      expect(row.principal + row.interest).toBeCloseTo(row.payment, 6);
    }
  });

  it("endingBalance of row n equals beginningBalance of row n+1", () => {
    const rows = computeAmortization(baseInput);
    for (let i = 0; i < rows.length - 1; i++) {
      expect(rows[i].endingBalance).toBeCloseTo(
        rows[i + 1].beginningBalance,
        6,
      );
    }
  });

  it("last row ends with balance at or near zero", () => {
    const rows = computeAmortization(baseInput);
    const last = rows[rows.length - 1];
    expect(last.endingBalance).toBeCloseTo(0, 1);
  });

  it("endingBalance never goes negative", () => {
    const rows = computeAmortization(baseInput);
    for (const row of rows) {
      expect(row.endingBalance).toBeGreaterThanOrEqual(0);
    }
  });

  // ── Shorter term = higher payment ────────────────────────────────

  it("shorter term results in higher monthly payment", () => {
    const input15: LoanInput = { ...baseInput, loanTerm: 15 };
    const input30: LoanInput = { ...baseInput, loanTerm: 30 };
    const rows15 = computeAmortization(input15);
    const rows30 = computeAmortization(input30);
    expect(rows15[0].payment).toBeGreaterThan(rows30[0].payment);
  });

  // ── Higher rate = higher payment ─────────────────────────────────

  it("higher rate results in higher monthly payment", () => {
    const lowRate: LoanInput = { ...baseInput, annualRate: 5 };
    const highRate: LoanInput = { ...baseInput, annualRate: 9 };
    const rowsLow = computeAmortization(lowRate);
    const rowsHigh = computeAmortization(highRate);
    expect(rowsHigh[0].payment).toBeGreaterThan(rowsLow[0].payment);
  });

  // ── Pag-IBIG scenario ────────────────────────────────────────────

  it("computes Pag-IBIG amortization at 6% for 30 years correctly", () => {
    // Pag-IBIG max: 6M property, 20% down = 4.8M loan at 6% for 30yr
    const input: LoanInput = {
      loanType: "pagibig",
      propertyPrice: 6_000_000,
      downPayment: 1_200_000,
      loanTerm: 30,
      annualRate: 6.0,
    };
    const rows = computeAmortization(input);
    expect(rows).toHaveLength(360);
    const monthly = rows[0].payment;
    // Ballpark: ~28,800/month for 4.8M at 6% over 30yr
    expect(monthly).toBeGreaterThan(25_000);
    expect(monthly).toBeLessThan(32_000);
  });

  // ── Small loan, short term ───────────────────────────────────────

  it("handles a small short-term loan gracefully", () => {
    const input: LoanInput = {
      loanType: "bank",
      propertyPrice: 500_000,
      downPayment: 100_000,
      loanTerm: 1,
      annualRate: 7.0,
    };
    const rows = computeAmortization(input);
    expect(rows).toHaveLength(12);
    expect(rows[0].endingBalance).toBeGreaterThan(0);
    expect(rows[rows.length - 1].endingBalance).toBeCloseTo(0, 1);
  });
});

// ─── checkAffordability ───────────────────────────────────────────────

describe("checkAffordability", () => {
  const baseInput: LoanInput = {
    loanType: "bank",
    propertyPrice: 3_000_000,
    downPayment: 600_000,
    loanTerm: 20,
    annualRate: 7.0,
    grossIncome: 1_200_000, // 100K/month
    existingDebts: 0,
  };

  // ── Edge cases ───────────────────────────────────────────────────

  it("returns zero monthlyPayment when amortization returns empty", () => {
    const input: LoanInput = {
      loanType: "bank",
      propertyPrice: 500_000,
      downPayment: 500_000,
      loanTerm: 20,
      annualRate: 7.0,
      grossIncome: 1_200_000,
    };
    const result = checkAffordability(input);
    expect(result.monthlyPayment).toBe(0);
  });

  it("handles zero grossIncome gracefully", () => {
    const input: LoanInput = { ...baseInput, grossIncome: 0 };
    const result = checkAffordability(input);
    expect(result.debtToIncomeRatio).toBe(1);
    expect(result.isAffordable).toBe(false);
    expect(result.level).toBe("red");
    expect(result.maxLoanAmount).toBe(0);
    expect(result.maxPropertyPrice).toBe(input.downPayment);
  });

  it("handles undefined grossIncome gracefully", () => {
    const input: LoanInput = { ...baseInput, grossIncome: undefined };
    const result = checkAffordability(input);
    expect(result.debtToIncomeRatio).toBe(1);
    expect(result.isAffordable).toBe(false);
    expect(result.level).toBe("red");
  });

  it("handles zero annualRate gracefully", () => {
    const input: LoanInput = { ...baseInput, annualRate: 0 };
    const result = checkAffordability(input);
    // zero rate → monthly payment is 0 (amortization returns [])
    expect(result.monthlyPayment).toBe(0);
    expect(result.maxLoanAmount).toBe(0);
  });

  // ── DTI and affordability levels ─────────────────────────────────

  it("returns green (affordable) when DTI <= 0.30", () => {
    // Very high income relative to payment
    const input: LoanInput = {
      ...baseInput,
      grossIncome: 3_600_000, // 300K/month
      propertyPrice: 1_000_000,
      downPayment: 200_000,
      loanTerm: 30,
      annualRate: 6.0,
    };
    const result = checkAffordability(input);
    expect(result.level).toBe("green");
    expect(result.isAffordable).toBe(true);
    expect(result.debtToIncomeRatio).toBeLessThanOrEqual(0.3);
  });

  it("returns yellow when DTI is between 0.30 and 0.50", () => {
    // Moderate income — moderate payment
    const input: LoanInput = {
      ...baseInput,
      grossIncome: 600_000, // 50K/month
      propertyPrice: 3_000_000,
      downPayment: 300_000,
      loanTerm: 20,
      annualRate: 7.0,
    };
    const result = checkAffordability(input);
    expect(result.level).toBe("yellow");
    expect(result.isAffordable).toBe(true);
    expect(result.debtToIncomeRatio).toBeGreaterThan(0.3);
    expect(result.debtToIncomeRatio).toBeLessThanOrEqual(0.5);
  });

  it("returns red (not affordable) when DTI > 0.50", () => {
    // Low income — high payment
    const input: LoanInput = {
      ...baseInput,
      grossIncome: 240_000, // 20K/month
      propertyPrice: 5_000_000,
      downPayment: 500_000,
      loanTerm: 15,
      annualRate: 8.0,
    };
    const result = checkAffordability(input);
    expect(result.level).toBe("red");
    expect(result.isAffordable).toBe(false);
    expect(result.debtToIncomeRatio).toBeGreaterThan(0.5);
  });

  // ── DTI calculation ──────────────────────────────────────────────

  it("includes existing debts in DTI calculation", () => {
    const input: LoanInput = {
      ...baseInput,
      grossIncome: 1_200_000,
      existingDebts: 240_000, // 20K/month additional
    };
    const withoutDebt = checkAffordability({ ...input, existingDebts: 0 });
    const withDebt = checkAffordability(input);
    expect(withDebt.debtToIncomeRatio).toBeGreaterThan(
      withoutDebt.debtToIncomeRatio,
    );
  });

  it("computes DTI correctly: (payment + debts/month) / (income/month)", () => {
    const input: LoanInput = {
      ...baseInput,
      grossIncome: 1_200_000, // 100K/month
      existingDebts: 120_000, // 10K/month
    };
    const result = checkAffordability(input);
    const monthlyPayment = result.monthlyPayment;
    const expectedDTI = (monthlyPayment + 10_000) / 100_000;
    expect(result.debtToIncomeRatio).toBeCloseTo(expectedDTI, 4);
  });

  // ── maxLoanAmount / maxPropertyPrice ─────────────────────────────

  it("computes maxLoanAmount based on 30% of gross monthly income", () => {
    const input: LoanInput = {
      ...baseInput,
      grossIncome: 1_200_000, // 100K/month
      annualRate: 7.0,
      loanTerm: 20,
    };
    const result = checkAffordability(input);
    // max affordable monthly = 100_000 * 0.3 = 30_000
    // PV = 30_000 * (1 - (1 + r)^-n) / r
    // r = 7/100/12 = 0.0058333, n = 240
    const monthlyRate = 7.0 / 100 / 12;
    const n = 20 * 12;
    const expectedMaxLoan =
      (30_000 * (1 - Math.pow(1 + monthlyRate, -n))) / monthlyRate;
    expect(result.maxLoanAmount).toBeCloseTo(expectedMaxLoan, 0);
  });

  it("maxPropertyPrice = maxLoanAmount + downPayment", () => {
    const input: LoanInput = { ...baseInput, downPayment: 600_000 };
    const result = checkAffordability(input);
    expect(result.maxPropertyPrice).toBeCloseTo(
      result.maxLoanAmount + 600_000,
      0,
    );
  });

  it("monthlyPayment matches computed amortization first row", () => {
    const result = checkAffordability(baseInput);
    const amortRows = computeAmortization(baseInput);
    expect(result.monthlyPayment).toBeCloseTo(amortRows[0]?.payment || 0, 2);
  });

  // ── Bank scenario at high rate ───────────────────────────────────

  it("correctly marks a bank loan at 9% as unaffordable when income is low", () => {
    const input: LoanInput = {
      loanType: "bank",
      propertyPrice: 4_000_000,
      downPayment: 800_000,
      loanTerm: 20,
      annualRate: 9.0,
      grossIncome: 600_000, // 50K/month
    };
    const result = checkAffordability(input);
    // Payment on 3.2M at 9% for 20yr ≈ 28,786/month
    // DTI = 28,786 / 50,000 = 0.576 → red
    expect(result.level).toBe("red");
    expect(result.isAffordable).toBe(false);
  });
});

// ─── computeComparison ────────────────────────────────────────────────

describe("computeComparison", () => {
  // ── Basic structure ──────────────────────────────────────────────

  it("returns exactly 3 results (pagibig, bank, in-house)", () => {
    const results = computeComparison(5_000_000, 1_000_000);
    expect(results).toHaveLength(3);
    const types = results.map((r) => r.loanType);
    expect(types).toEqual(["pagibig", "bank", "in-house"]);
  });

  it("each result has the correct shape", () => {
    const results = computeComparison(5_000_000, 1_000_000);
    for (const r of results) {
      expect(r).toHaveProperty("loanType");
      expect(r).toHaveProperty("rate");
      expect(r).toHaveProperty("term");
      expect(r).toHaveProperty("monthlyPayment");
      expect(r).toHaveProperty("totalPayment");
      expect(r).toHaveProperty("totalInterest");
      expect(r).toHaveProperty("totalCost");
      expect(r).toHaveProperty("months");
    }
  });

  // ── Pag-IBIG comparison ──────────────────────────────────────────

  it("Pag-IBIG result uses 6% rate and 30-year term", () => {
    const results = computeComparison(5_000_000, 1_000_000);
    const pagibig = results.find((r) => r.loanType === "pagibig")!;
    expect(pagibig.rate).toBe(6.0);
    expect(pagibig.term).toBe(30);
  });

  it("Pag-IBIG has the lowest monthly payment (longest term, low rate)", () => {
    const results = computeComparison(5_000_000, 1_000_000);
    const pagibig = results.find((r) => r.loanType === "pagibig")!;
    const bank = results.find((r) => r.loanType === "bank")!;
    const inHouse = results.find((r) => r.loanType === "in-house")!;
    expect(pagibig.monthlyPayment).toBeLessThan(bank.monthlyPayment);
    expect(pagibig.monthlyPayment).toBeLessThan(inHouse.monthlyPayment);
  });

  // ── Bank comparison ──────────────────────────────────────────────

  it("Bank result uses 7% rate and 20-year term", () => {
    const results = computeComparison(5_000_000, 1_000_000);
    const bank = results.find((r) => r.loanType === "bank")!;
    expect(bank.rate).toBe(7.0);
    expect(bank.term).toBe(20);
  });

  it("Bank monthly payment is between Pag-IBIG and in-house", () => {
    const results = computeComparison(5_000_000, 1_000_000);
    const pagibig = results.find((r) => r.loanType === "pagibig")!;
    const bank = results.find((r) => r.loanType === "bank")!;
    const inHouse = results.find((r) => r.loanType === "in-house")!;
    expect(bank.monthlyPayment).toBeGreaterThan(pagibig.monthlyPayment);
    expect(bank.monthlyPayment).toBeLessThan(inHouse.monthlyPayment);
  });

  // ── In-house comparison ──────────────────────────────────────────

  it("In-house result uses 10% rate and 15-year term", () => {
    const results = computeComparison(5_000_000, 1_000_000);
    const inHouse = results.find((r) => r.loanType === "in-house")!;
    expect(inHouse.rate).toBe(10.0);
    expect(inHouse.term).toBe(15);
  });

  it("In-house has the highest monthly payment (highest rate, shortest term)", () => {
    const results = computeComparison(5_000_000, 1_000_000);
    const inHouse = results.find((r) => r.loanType === "in-house")!;
    const pagibig = results.find((r) => r.loanType === "pagibig")!;
    const bank = results.find((r) => r.loanType === "bank")!;
    expect(inHouse.monthlyPayment).toBeGreaterThan(pagibig.monthlyPayment);
    expect(inHouse.monthlyPayment).toBeGreaterThan(bank.monthlyPayment);
  });

  // ── totalCost includes downPayment ───────────────────────────────

  it("totalCost equals totalPayment plus downPayment", () => {
    const downPayment = 1_000_000;
    const results = computeComparison(5_000_000, downPayment);
    for (const r of results) {
      expect(r.totalCost).toBeCloseTo(r.totalPayment + downPayment, 0);
    }
  });

  it("totalInterest equals totalPayment minus principal", () => {
    const results = computeComparison(5_000_000, 1_000_000);
    const principal = 4_000_000;
    for (const r of results) {
      expect(r.totalInterest).toBeCloseTo(r.totalPayment - principal, 0);
    }
  });

  // ── Zero down payment ────────────────────────────────────────────

  it("handles zero down payment (full loan amount)", () => {
    const results = computeComparison(3_000_000, 0);
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.monthlyPayment).toBeGreaterThan(0);
      expect(r.totalCost).toBe(r.totalPayment); // downPayment = 0
    }
  });

  // ── months count ─────────────────────────────────────────────────

  it("Pag-IBIG has 360 months (30yr), Bank has 240 (20yr), In-house has 180 (15yr)", () => {
    const results = computeComparison(5_000_000, 1_000_000);
    const pagibig = results.find((r) => r.loanType === "pagibig")!;
    const bank = results.find((r) => r.loanType === "bank")!;
    const inHouse = results.find((r) => r.loanType === "in-house")!;
    expect(pagibig.months).toBe(360);
    expect(bank.months).toBe(240);
    expect(inHouse.months).toBe(180);
  });

  // ── Pag-IBIG has highest total interest (longest term) ───────────

  it("Pag-IBIG has the highest total interest despite lowest rate", () => {
    const results = computeComparison(5_000_000, 1_000_000);
    const pagibig = results.find((r) => r.loanType === "pagibig")!;
    const bank = results.find((r) => r.loanType === "bank")!;
    const inHouse = results.find((r) => r.loanType === "in-house")!;
    // Longer term means more total interest even at lower rate
    expect(pagibig.totalInterest).toBeGreaterThan(bank.totalInterest);
    expect(pagibig.totalInterest).toBeGreaterThan(inHouse.totalInterest);
  });

  // ── With zero-price edge case ────────────────────────────────────

  it("handles zero property price gracefully", () => {
    const results = computeComparison(0, 0);
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.monthlyPayment).toBe(0);
      expect(r.totalPayment).toBe(0);
      expect(r.totalInterest).toBe(0);
      expect(r.totalCost).toBe(0);
      expect(r.months).toBe(0);
    }
  });

  // ── Large property price ─────────────────────────────────────────

  it("handles a large property price without overflow", () => {
    const results = computeComparison(50_000_000, 10_000_000);
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.monthlyPayment).toBeGreaterThan(0);
      expect(r.totalPayment).toBeGreaterThan(0);
      expect(r.totalCost).toBeGreaterThan(0);
    }
  });
});
