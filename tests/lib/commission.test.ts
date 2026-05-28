import { describe, it, expect } from "vitest";
import {
  calcGrossCommission,
  calcVat,
  calcWithholdingTax,
  calcCapitalGainsTax,
  calcDocumentaryStampTax,
  calcCreditableWithholding,
  calculateFullCommission,
  calcMonthlyAmortization,
  type CommissionInput,
} from "@/lib/commission";

// ─── calcGrossCommission ──────────────────────────────────────────────

describe("calcGrossCommission", () => {
  it("calculates 3% of 5M", () => {
    expect(calcGrossCommission(5000000, 3)).toBe(150000);
  });

  it("calculates 5% of 2.5M", () => {
    expect(calcGrossCommission(2500000, 5)).toBe(125000);
  });

  it("returns 0 for zero price", () => {
    expect(calcGrossCommission(0, 3)).toBe(0);
  });

  it("returns 0 for zero percent", () => {
    expect(calcGrossCommission(5000000, 0)).toBe(0);
  });

  it("handles fractional percent", () => {
    expect(calcGrossCommission(1000000, 2.5)).toBe(25000);
  });

  it("handles 100% (full price)", () => {
    expect(calcGrossCommission(500000, 100)).toBe(500000);
  });
});

// ─── calcVat ───────────────────────────────────────────────────────────

describe("calcVat", () => {
  it("calculates 12% VAT", () => {
    expect(calcVat(100000)).toBe(12000);
  });

  it("returns 0 for zero amount", () => {
    expect(calcVat(0)).toBe(0);
  });

  it("handles fractional amounts", () => {
    expect(calcVat(1234.56)).toBeCloseTo(148.1472, 2);
  });
});

// ─── calcWithholdingTax ───────────────────────────────────────────────

describe("calcWithholdingTax", () => {
  it("calculates 1% withholding", () => {
    expect(calcWithholdingTax(100000)).toBe(1000);
  });

  it("returns 0 for zero amount", () => {
    expect(calcWithholdingTax(0)).toBe(0);
  });
});

// ─── calcCapitalGainsTax ──────────────────────────────────────────────

describe("calcCapitalGainsTax", () => {
  it("calculates 6% CGT on 5M", () => {
    expect(calcCapitalGainsTax(5000000)).toBe(300000);
  });

  it("returns 0 for zero deal price", () => {
    expect(calcCapitalGainsTax(0)).toBe(0);
  });
});

// ─── calcDocumentaryStampTax ──────────────────────────────────────────

describe("calcDocumentaryStampTax", () => {
  it("calculates 1.5% DST on 5M", () => {
    expect(calcDocumentaryStampTax(5000000)).toBe(75000);
  });

  it("returns 0 for zero deal price", () => {
    expect(calcDocumentaryStampTax(0)).toBe(0);
  });
});

// ─── calcCreditableWithholding ────────────────────────────────────────

describe("calcCreditableWithholding", () => {
  it("calculates 1% CWT", () => {
    expect(calcCreditableWithholding(5000000)).toBe(50000);
  });

  it("returns 0 for zero deal price", () => {
    expect(calcCreditableWithholding(0)).toBe(0);
  });
});

// ─── calculateFullCommission ──────────────────────────────────────────

describe("calculateFullCommission", () => {
  const baseInput: CommissionInput = {
    dealPrice: 5000000,
    commissionPercent: 3,
  };

  it("calculates gross commission correctly", () => {
    const result = calculateFullCommission(baseInput);
    expect(result.grossCommission).toBe(150000);
  });

  it("calculates VAT deduction", () => {
    const result = calculateFullCommission(baseInput);
    expect(result.vat).toBe(18000);
  });

  it("calculates withholding tax deduction", () => {
    const result = calculateFullCommission(baseInput);
    expect(result.withholdingTax).toBe(1500);
  });

  it("calculates net commission", () => {
    const result = calculateFullCommission(baseInput);
    expect(result.netCommission).toBe(130500);
  });

  it("splits net 50/50 between broker and agent by default", () => {
    const result = calculateFullCommission(baseInput);
    expect(result.brokerShare).toBe(65250);
    expect(result.agentShare).toBe(65250);
    expect(result.agent2Share).toBe(0);
  });

  it("computes totalDeductions as vat + withholding", () => {
    const result = calculateFullCommission(baseInput);
    expect(result.totalDeductions).toBe(19500);
    expect(result.totalDeductions).toBe(result.vat + result.withholdingTax);
  });

  it("handles co-broking split 50/50", () => {
    const result = calculateFullCommission({
      dealPrice: 5000000,
      commissionPercent: 3,
      coBrokingSplit: 50,
    });
    expect(result.agent2Share).toBe(65250);
    expect(result.agentShare).toBe(65250);
    expect(result.brokerShare).toBe(65250);
  });

  it("handles co-broking split 30/70", () => {
    const result = calculateFullCommission({
      dealPrice: 5000000,
      commissionPercent: 3,
      coBrokingSplit: 30,
    });
    // Agent keeps 70%, other agent gets 30%
    expect(result.agentShare).toBeCloseTo(91350, 0); // 130500 * 0.7
    expect(result.agent2Share).toBeCloseTo(39150, 0); // 130500 * 0.3
  });

  it("handles referral fee", () => {
    const result = calculateFullCommission({
      dealPrice: 5000000,
      commissionPercent: 3,
      referralFee: 20000,
    });
    expect(result.brokerShare).toBe(20000);
    expect(result.agentShare).toBe(110500); // 130500 - 20000
  });

  it("handles co-broking + referral fee together (referral overrides agent share but co-broking still sets agent2Share)", () => {
    const result = calculateFullCommission({
      dealPrice: 5000000,
      commissionPercent: 3,
      coBrokingSplit: 50,
      referralFee: 30000,
    });
    // referralFee: agentShare = net - referralFee, brokerShare = referralFee
    // coBroking still applies: agent2Share = net * 0.5
    expect(result.brokerShare).toBe(30000);
    expect(result.agentShare).toBe(100500); // 130500 - 30000
    expect(result.agent2Share).toBe(65250); // co-broking still applies
  });

  it("handles zero deal price", () => {
    const result = calculateFullCommission({
      dealPrice: 0,
      commissionPercent: 3,
    });
    expect(result.grossCommission).toBe(0);
    expect(result.netCommission).toBe(0);
    expect(result.brokerShare).toBe(0);
    expect(result.agentShare).toBe(0);
  });

  it("handles large numbers", () => {
    const result = calculateFullCommission({
      dealPrice: 100000000,
      commissionPercent: 5,
    });
    expect(result.grossCommission).toBe(5000000);
    expect(result.netCommission).toBe(4350000);
    expect(result.brokerShare).toBe(2175000);
    expect(result.agentShare).toBe(2175000);
  });

  it("handles co-broking split of 100 (other agent gets everything)", () => {
    const result = calculateFullCommission({
      dealPrice: 1000000,
      commissionPercent: 3,
      coBrokingSplit: 100,
    });
    expect(result.agentShare).toBe(0);
    expect(result.agent2Share).toBe(26100); // net * 1.0
  });

  it("handles co-broking split of 0 (falsy, treated as no co-broking)", () => {
    const result = calculateFullCommission({
      dealPrice: 1000000,
      commissionPercent: 3,
      coBrokingSplit: 0,
    });
    // 0 is falsy, so co-broking is NOT applied; default 50/50 split used
    expect(result.agentShare).toBe(13050); // net * 0.5
    expect(result.agent2Share).toBe(0);
  });
});

// ─── calcMonthlyAmortization ──────────────────────────────────────────

describe("calcMonthlyAmortization", () => {
  it("calculates correct monthly for Pag-IBIG scenario", () => {
    // ₱2.4M loan, 6.5% annual, 30 years
    const amort = calcMonthlyAmortization(2400000, 6.5, 30);
    expect(amort).toBeGreaterThan(15000);
    expect(amort).toBeLessThan(16000);
  });

  it("returns 0 for zero loan", () => {
    expect(calcMonthlyAmortization(0, 6.5, 30)).toBe(0);
  });

  it("returns 0 for zero term", () => {
    expect(calcMonthlyAmortization(100000, 6.5, 0)).toBe(0);
  });

  it("handles zero interest rate (straight-line)", () => {
    const amort = calcMonthlyAmortization(1200000, 0, 10);
    expect(amort).toBe(10000); // 1.2M / 120 months
  });

  it("handles small loan amounts", () => {
    const amort = calcMonthlyAmortization(50000, 5, 1);
    expect(amort).toBeGreaterThan(0);
  });

  it("handles very high interest rate", () => {
    const amort = calcMonthlyAmortization(100000, 20, 5);
    expect(amort).toBeGreaterThan(2000);
  });

  it("returns straight-line for negative interest rate (treated as <= 0)", () => {
    const amort = calcMonthlyAmortization(120000, -5, 2);
    expect(amort).toBe(5000); // 120000 / 24 months
  });
});
