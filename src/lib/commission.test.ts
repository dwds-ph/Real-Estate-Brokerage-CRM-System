import { describe, it, expect } from 'vitest';
import {
  calcGrossCommission,
  calcVat,
  calcWithholdingTax,
  calcCapitalGainsTax,
  calcDocumentaryStampTax,
  calcCreditableWithholding,
  calculateFullCommission,
  calcMonthlyAmortization,
} from './commission';

describe('calcGrossCommission', () => {
  it('calculates 3% of 5M', () => {
    expect(calcGrossCommission(5000000, 3)).toBe(150000);
  });

  it('calculates 5% of 2.5M', () => {
    expect(calcGrossCommission(2500000, 5)).toBe(125000);
  });

  it('returns 0 for zero price', () => {
    expect(calcGrossCommission(0, 3)).toBe(0);
  });
});

describe('calcVat', () => {
  it('calculates 12% VAT', () => {
    expect(calcVat(100000)).toBe(12000);
  });
});

describe('calcWithholdingTax', () => {
  it('calculates 1% withholding', () => {
    expect(calcWithholdingTax(100000)).toBe(1000);
  });
});

describe('calcCapitalGainsTax', () => {
  it('calculates 6% CGT on 5M', () => {
    expect(calcCapitalGainsTax(5000000)).toBe(300000);
  });
});

describe('calcDocumentaryStampTax', () => {
  it('calculates 1.5% DST on 5M', () => {
    expect(calcDocumentaryStampTax(5000000)).toBe(75000);
  });
});

describe('calcCreditableWithholding', () => {
  it('calculates 1% CWT', () => {
    expect(calcCreditableWithholding(5000000)).toBe(50000);
  });
});

describe('calculateFullCommission', () => {
  const result = calculateFullCommission({
    dealPrice: 5000000,
    commissionPercent: 3,
  });

  it('calculates gross commission correctly', () => {
    expect(result.grossCommission).toBe(150000);
  });

  it('calculates VAT deduction', () => {
    expect(result.vat).toBe(18000);
  });

  it('calculates withholding tax deduction', () => {
    expect(result.withholdingTax).toBe(1500);
  });

  it('calculates net commission', () => {
    expect(result.netCommission).toBe(130500);
  });

  it('splits net 50/50 between broker and agent by default', () => {
    expect(result.brokerShare).toBe(65250);
    expect(result.agentShare).toBe(65250);
  });

  it('handles co-broking split', () => {
    const coBrokingResult = calculateFullCommission({
      dealPrice: 5000000,
      commissionPercent: 3,
      coBrokingSplit: 50,
    });
    expect(coBrokingResult.agent2Share).toBe(65250);
    expect(coBrokingResult.agentShare).toBe(65250);
  });

  it('handles referral fee', () => {
    const referralResult = calculateFullCommission({
      dealPrice: 5000000,
      commissionPercent: 3,
      referralFee: 20000,
    });
    expect(referralResult.brokerShare).toBe(20000);
  });
});

describe('calcMonthlyAmortization', () => {
  it('calculates correct monthly for Pag-IBIG scenario', () => {
    // ₱2.4M loan, 6.5% annual, 30 years
    const amort = calcMonthlyAmortization(2400000, 6.5, 30);
    expect(amort).toBeGreaterThan(15000);
    expect(amort).toBeLessThan(16000);
  });

  it('returns 0 for zero loan', () => {
    expect(calcMonthlyAmortization(0, 6.5, 30)).toBe(0);
  });

  it('returns 0 for zero term', () => {
    expect(calcMonthlyAmortization(100000, 6.5, 0)).toBe(0);
  });

  it('handles zero interest rate (straight-line)', () => {
    const amort = calcMonthlyAmortization(1200000, 0, 10);
    expect(amort).toBe(10000); // 1.2M / 120 months
  });
});
